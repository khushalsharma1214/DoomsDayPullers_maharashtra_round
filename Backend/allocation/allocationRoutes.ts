import { Router } from "express";
import { reserveSeat } from "./seatService";

const router = Router();

router.post("/reserve", async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        if (!eventId || !userId) {
            return res.status(400).json({
                success: false,
                message: "eventId and userId are required"
            });
        }

        const result = await reserveSeat(
            Number(eventId),
            Number(userId)
        );

        if (!result.success) {
            return res.status(409).json(result);
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

export default router;