import * as crypto from 'crypto';

export interface Challenge {
    nonce: string;
    difficulty: number;
}

const DIFFICULTY = 3; // Number of leading zeros required

export const generateChallenge = (): Challenge => {
    const nonce = crypto.randomBytes(16).toString('hex');
    return { nonce, difficulty: DIFFICULTY };
};

export const verifyProofOfWork = (nonce: string, clientHash: string): boolean => {
    const prefix = '0'.repeat(DIFFICULTY);
    
    if (!clientHash.startsWith(prefix)) {
        return false;
    }

    // Verify counter loop to ensure the client legitimately solved the puzzle
    for (let i = 0; i < 2000000; i++) {
        const hash = crypto.createHash('sha256').update(`${nonce}${i}`).digest('hex');
        if (hash === clientHash) {
            return true;
        }
    }

    return false;
};