import { Router, Request, Response } from 'express';
import { generateChallenge } from '../services/powService.js';
import { antiBotMiddleware } from '../middleware/antiBot.js';
import { processPurchase } from '../services/ticketService.js';

const router = Router();

// Endpoint 1: Provides the cryptographic puzzle challenge to the client
router.get('/challenge', (req: Request, res: Response) => {
    res.json(generateChallenge());
});

// Endpoint 2: Validates the anti-bot check and processes ticket allocation
router.post('/buy-seat', antiBotMiddleware, async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;
    
    if (!userId) {
        res.status(400).json({ error: 'User ID required' });
        return;
    }

    try {
        const success = await processPurchase(userId);
        if (success) {
            res.status(200).json({ message: 'Seat successfully allocated!' });
        } else {
            res.status(409).json({ error: 'Sold out or duplicate request.' });
        }
    } catch (err) {
        console.error('Allocation error:', err);
        res.status(500).json({ error: 'Server error during allocation' });
    }
});

export default router;