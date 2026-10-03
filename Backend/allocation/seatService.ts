import { pool } from "./db.js";
import { randomUUID } from "crypto";

export async function reserveSeat(
    eventId: number,
    userId: number
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        /*
         * Lock any existing RESERVED reservations for this user.
         *
         * This prevents a race between:
         * - a user trying to reserve again
         * - the background expiry worker cleaning up the old reservation
         *
         * If the reservation has already expired, we clean it up here
         * before attempting a new allocation.
         */
        const existingReservations = await client.query(
            `
            SELECT id, seat_id, expires_at
            FROM reservations
            WHERE event_id = $1
            AND user_id = $2
            AND status = 'RESERVED'
            FOR UPDATE
            `,
            [eventId, userId]
        );

        for (const reservation of existingReservations.rows) {
            const expiresAt = reservation.expires_at
                ? new Date(reservation.expires_at).getTime()
                : null;

            const isExpired =
                expiresAt !== null &&
                expiresAt <= Date.now();

            if (isExpired) {
                await client.query(
                    `
                    UPDATE reservations
                    SET status = 'EXPIRED'
                    WHERE id = $1
                    `,
                    [reservation.id]
                );

                await client.query(
                    `
                    UPDATE seats
                    SET status = 'AVAILABLE',
                        user_id = NULL,
                        reservation_id = NULL
                    WHERE id = $1
                    `,
                    [reservation.seat_id]
                );
            }
        }

        /*
         * Check again for an active reservation.
         *
         * The row locks above ensure that an expiry operation cannot
         * race with this check for the same reservation.
         */
        const activeReservation = await client.query(
            `
            SELECT id
            FROM reservations
            WHERE event_id = $1
            AND user_id = $2
            AND status = 'RESERVED'
            AND (
                expires_at IS NULL
                OR expires_at > NOW()
            )
            LIMIT 1
            `,
            [eventId, userId]
        );

        if (activeReservation.rows.length > 0) {
            await client.query("ROLLBACK");

            return {
                success: false,
                message: "User already has an active reservation"
            };
        }

        /*
         * Find one available seat.
         *
         * FOR UPDATE SKIP LOCKED allows many concurrent users to
         * allocate different seats without waiting for each other.
         */
        const result = await client.query(
            `
            SELECT id, seat_number
            FROM seats
            WHERE event_id = $1
            AND status = 'AVAILABLE'
            ORDER BY id
            LIMIT 1
            FOR UPDATE SKIP LOCKED
            `,
            [eventId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return {
                success: false,
                message: "No seats available"
            };
        }

        const seat = result.rows[0];
        const reservationId = randomUUID();

        const reservationMinutes =
            Number(process.env.RESERVATION_MINUTES) || 5;

        /*
         * Mark the seat as reserved.
         */
        await client.query(
            `
            UPDATE seats
            SET status = 'RESERVED',
                user_id = $1,
                reservation_id = $2
            WHERE id = $3
            `,
            [userId, reservationId, seat.id]
        );

        /*
         * Create the reservation with an expiry time.
         */
        await client.query(
            `
            INSERT INTO reservations
            (
                id,
                event_id,
                seat_id,
                user_id,
                status,
                expires_at
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                'RESERVED',
                NOW() + ($5 * INTERVAL '1 minute')
            )
            `,
            [
                reservationId,
                eventId,
                seat.id,
                userId,
                reservationMinutes
            ]
        );

        await client.query("COMMIT");

        return {
            success: true,
            reservationId,
            seatNumber: seat.seat_number
        };

    } catch (error: any) {
        await client.query("ROLLBACK");

        /*
         * PostgreSQL unique constraint violation.
         *
         * This protects against two simultaneous requests from the
         * same user attempting to create multiple active reservations.
         */
        if (error?.code === "23505") {
            return {
                success: false,
                message: "User already has an active reservation"
            };
        }

        throw error;

    } finally {
        client.release();
    }
}