import crypto from 'crypto';
import { config } from '../config';

export const createChallenge = () => {
    return crypto.randomBytes(16).toString('hex');
};

export const isValidProofOfWork = (challenge: string, nonce: string): boolean => {
    const hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
    return hash.startsWith(config.POW_DIFFICULTY);
};