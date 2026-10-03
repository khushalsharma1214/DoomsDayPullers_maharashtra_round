import { Request, Response, NextFunction } from 'express';
import { verifyProofOfWork } from '../services/powService.js';
import redis from '../config/redis.js';

export const antiBotMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { nonce, clientHash } = req.body;
    
    // Identify client by IP address for rate limiting
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';
    const rateLimitKey = `rate_limit:${clientIp}`;

    try {
        // 1. Rate Limiting: Max 20 requests per second
        const currentRequests = await redis.incr(rateLimitKey);
        
        if (currentRequests === 1) {
            await redis.expire(rateLimitKey, 1); // 1-second TTL window
        }

        if (currentRequests > 20) {
            res.status(403).json({ 
                error: 'Rate limit exceeded (Max 20 req/sec). Automated bot behavior detected.' 
            });
            return;
        }

        // 2. Proof of Work Validation
        if (!nonce || !clientHash) {
            res.status(403).json({ error: 'Missing Proof of Work. Access denied.' });
            return;
        }

        const isValid = verifyProofOfWork(nonce, clientHash);

        if (!isValid) {
            res.status(403).json({ error: 'Invalid Proof of Work. Bot detected.' });
            return;
        }

        next();
    } catch (err) {
        console.error('Anti-bot middleware error:', err);
        res.status(500).json({ error: 'Internal security check error' });
    }
};