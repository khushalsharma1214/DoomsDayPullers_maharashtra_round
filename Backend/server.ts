import express from "express";
import allocationRoutes from "./allocation/allocationRoutes";
import { expireReservations } from "./allocation/reservationService";

const app = express();

app.use(express.json());

app.use("/api/purchase", allocationRoutes);

setInterval(async () => {
    try {
        const result = await expireReservations();

        if (result.expiredCount > 0) {
            console.log(
                `Expired reservations cleaned up: ${result.expiredCount}`
            );
        }
    } catch (error) {
        console.error("Expiry cleanup failed:", error);
    }
}, 10000);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Fair Drop server running on http://localhost:${PORT}`);
});