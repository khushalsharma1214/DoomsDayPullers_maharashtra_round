import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const waitingRoomLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});