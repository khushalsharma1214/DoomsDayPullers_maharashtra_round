const db = require("../database/db");

const reserveSeat = async (req, res) => {
  const client = await db.connect();

  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    await client.query("BEGIN");

    const queueResult = await client.query(
      `
      SELECT id, status
      FROM queue_entries
      WHERE user_id = $1
      AND match_id = $2
      AND status = 'admitted'
      ORDER BY admitted_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [userId, matchId]
    );

    if (queueResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "User has not been admitted to the reservation stage"
      });
    }

    const existingReservation = await client.query(
      `
      SELECT id
      FROM reservations
      WHERE user_id = $1
      AND match_id = $2
      AND status = 'reserved'
      AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
      FOR UPDATE
      `,
      [userId, matchId]
    );

    if (existingReservation.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "User already has an active reservation for this match"
      });
    }

    const seatResult = await client.query(
      `
      SELECT id
      FROM seats
      WHERE match_id = $1
      AND status = 'available'
      ORDER BY id
      LIMIT 1
      FOR UPDATE SKIP LOCKED
      `,
      [matchId]
    );

    if (seatResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "No seats available"
      });
    }

    const seatId = seatResult.rows[0].id;

    const matchUpdate = await client.query(
      `
      UPDATE matches
      SET available_seats = available_seats - 1
      WHERE id = $1
      AND available_seats > 0
      RETURNING id, available_seats
      `,
      [matchId]
    );

    if (matchUpdate.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "No seats available"
      });
    }

    const seatUpdate = await client.query(
      `
      UPDATE seats
      SET status = 'reserved'
      WHERE id = $1
      AND match_id = $2
      AND status = 'available'
      RETURNING id, seat_number, status
      `,
      [seatId, matchId]
    );

    if (seatUpdate.rows.length !== 1) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Seat could not be reserved"
      });
    }

    const reservationResult = await client.query(
      `
      INSERT INTO reservations (
        user_id,
        match_id,
        seat_id,
        status,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        'reserved',
        CURRENT_TIMESTAMP + INTERVAL '5 minutes'
      )
      RETURNING *
      `,
      [userId, matchId, seatId]
    );

    const queueUpdate = await client.query(
      `
      UPDATE queue_entries
      SET status = 'completed'
      WHERE id = $1
      AND status = 'admitted'
      RETURNING id, status
      `,
      [queueResult.rows[0].id]
    );

    if (queueUpdate.rows.length !== 1) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Queue admission could not be consumed"
      });
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Seat reserved successfully",
      reservation: reservationResult.rows[0],
      seat: seatUpdate.rows[0],
      remainingSeats: matchUpdate.rows[0].available_seats
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError.message
      );
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Seat or reservation conflict"
      });
    }

    console.error(
      "Error reserving seat:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to reserve seat"
    });
  } finally {
    client.release();
  }
};

const confirmReservation = async (req, res) => {
  const client = await db.connect();

  try {
    const { reservationId } = req.params;
    const userId = req.user.id;

    await client.query("BEGIN");

    const reservationResult = await client.query(
      `
      SELECT *
      FROM reservations
      WHERE id = $1
      AND user_id = $2
      AND status = 'reserved'
      FOR UPDATE
      `,
      [reservationId, userId]
    );

    if (reservationResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Active reservation not found"
      });
    }

    const reservation = reservationResult.rows[0];

    if (
      new Date(reservation.expires_at) <=
      new Date()
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Reservation has expired"
      });
    }

    const updatedReservation = await client.query(
      `
      UPDATE reservations
      SET status = 'confirmed'
      WHERE id = $1
      AND user_id = $2
      AND status = 'reserved'
      RETURNING *
      `,
      [reservationId, userId]
    );

    if (updatedReservation.rows.length !== 1) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Reservation could not be confirmed"
      });
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Reservation confirmed",
      reservation: updatedReservation.rows[0]
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError.message
      );
    }

    console.error(
      "Error confirming reservation:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to confirm reservation"
    });
  } finally {
    client.release();
  }
};

module.exports = {
  reserveSeat,
  confirmReservation
};