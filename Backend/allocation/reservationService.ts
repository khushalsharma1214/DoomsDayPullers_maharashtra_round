import { pool } from "./db.js";

export async function expireReservations() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Find reservations that have expired
        const expiredReservations = await client.query(
            `
            SELECT id, seat_id
            FROM reservations
            WHERE status = 'RESERVED'
            AND expires_at <= NOW()
            FOR UPDATE
            `
        );

        if (expiredReservations.rows.length === 0) {
            await client.query("COMMIT");

            return {
                success: true,
                expiredCount: 0
            };
        }

        for (const reservation of expiredReservations.rows) {

            // Mark reservation as expired
            await client.query(
                `
                UPDATE reservations
                SET status = 'EXPIRED'
                WHERE id = $1
                `,
                [reservation.id]
            );

            // Make the seat available again
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

        await client.query("COMMIT");

        return {
            success: true,
            expiredCount: expiredReservations.rows.length
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}
