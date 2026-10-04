const db = require("../database/db");

const expireReservations = async () => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const expiredReservations = await client.query(
      `
      SELECT
        id,
        match_id,
        seat_id
      FROM reservations
      WHERE status = 'reserved'
      AND expires_at <= CURRENT_TIMESTAMP
      FOR UPDATE
      `
    );

    let expiredCount = 0;

    for (const reservation of expiredReservations.rows) {
      const reservationUpdate =
        await client.query(
          `
          UPDATE reservations
          SET status = 'expired'
          WHERE id = $1
          AND status = 'reserved'
          RETURNING id
          `,
          [reservation.id]
        );

      if (
        reservationUpdate.rows.length !== 1
      ) {
        continue;
      }

      const seatUpdate =
        await client.query(
          `
          UPDATE seats
          SET status = 'available'
          WHERE id = $1
          AND status = 'reserved'
          RETURNING id
          `,
          [reservation.seat_id]
        );

      if (seatUpdate.rows.length === 1) {
        await client.query(
          `
          UPDATE matches
          SET available_seats =
            available_seats + 1
          WHERE id = $1
          `,
          [reservation.match_id]
        );
      }

      expiredCount++;
    }

    await client.query("COMMIT");

    if (expiredCount > 0) {
      console.log(
        `Expired ${expiredCount} reservation(s)`
      );
    }
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
      "Error expiring reservations:",
      error.message
    );
  } finally {
    client.release();
  }
};

module.exports = {
  expireReservations
};