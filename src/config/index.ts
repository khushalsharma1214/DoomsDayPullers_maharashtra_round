export const config = {
    PORT: process.env.PORT || 3000,
    POW_DIFFICULTY: '000', // Number of leading zeros required for the hash
    RATE_LIMIT_WINDOW_MS: 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: 30
};