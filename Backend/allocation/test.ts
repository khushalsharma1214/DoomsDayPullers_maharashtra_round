import { reserveSeat } from "./seatService.js";

async function test() {
    try {
        const result = await reserveSeat(1, 101);

        console.log("Reservation result:");
        console.log(result);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
