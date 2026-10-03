console.log("EXPIRY TEST STARTED");

import { expireReservations } from "./reservationService.js";
import { pool } from "./db.js";

async function test() {
    try {
        const result = await expireReservations();

        console.log("Expiry result:");
        console.log(result);

    } catch (error) {
        console.error("Error:", error);

    } finally {
        await pool.end();
    }
}

test();
