import { pool } from "./db.js";
import { randomUUID } from "crypto";

export async function reserveSeat(
    eventId: number,
    userId: number
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const existingReservation = await client.query(
            `
            SELECT id, seat_id
            FROM reservations
            WHERE event_id = $1
            AND user_id = $2
            AND status = 'RESERVED'
            AND expires_at > NOW()
            LIMIT 1
            `,
            [eventId, userId]
        );

        if (existingReservation.rows.length > 0) {
            await client.query("ROLLBACK");

            return {
                success: false,
                message: "User already has an active reservation"
            };
        }

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

        // Default reservation duration is 5 minutes.
        // For stress testing, set RESERVATION_MINUTES
        // in Backend/.env to a larger value.
        const reservationMinutes =
            Number(process.env.RESERVATION_MINUTES) || 5;

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

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}