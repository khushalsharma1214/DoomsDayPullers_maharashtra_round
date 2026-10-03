import { Request, Response, NextFunction } from 'express';
import { isValidProofOfWork } from '../services/powService';

export const honeypotCheck = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.secondary_email) {
        return res.status(403).json({ error: 'Automated request detected.' });
    }
    next();
};

export const verifyProofOfWork = (req: Request, res: Response, next: NextFunction) => {
    const { challenge, nonce } = req.body;
    
    if (!challenge || !nonce || !isValidProofOfWork(challenge, nonce)) {
        return res.status(401).json({ error: 'Invalid or missing Proof of Work.' });
    }
    next();
};