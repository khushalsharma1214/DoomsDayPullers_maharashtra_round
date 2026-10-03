import { Router, Request, Response } from 'express';
import { createChallenge } from '../services/powService';
import { honeypotCheck, verifyProofOfWork } from '../middleware/antiBot';
import { waitingRoomLimiter } from '../middleware/rateLimiter';

const router = Router();

// Endpoint for frontend to request a cryptographic puzzle
router.get('/challenge', (req: Request, res: Response) => {
    res.json({ challenge: createChallenge() });
});

// Protected endpoint to actually join the drop
router.post('/join', waitingRoomLimiter, honeypotCheck, verifyProofOfWork, (req: Request, res: Response) => {
    // If they pass the middleware, they are placed in the queue
    res.status(200).json({ message: 'Successfully joined the waiting room.' });
});

export default router;