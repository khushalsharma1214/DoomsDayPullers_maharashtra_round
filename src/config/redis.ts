import { Redis } from 'ioredis';
import { RedisMemoryServer } from 'redis-memory-server';

let redisClient: Redis;

const initRedis = async () => {
    if (!redisClient) {
        // Automatically spin up a memory-based Redis instance on the fly
        const redisServer = await RedisMemoryServer.create();
        const host = await redisServer.getHost();
        const port = await redisServer.getPort();

        redisClient = new Redis({
            host,
            port,
        });

        console.log(`🚀 Embedded Redis Memory Server running at ${host}:${port}`);
    }
    return redisClient;
};

// Export a proxy client so your existing imports work seamlessly without changes
const client = new Proxy({} as Redis, {
    get(target, prop) {
        // Lazy initialize or forward methods
        if (!redisClient) {
            // Fallback synchronous proxy or initialize on demand
            // For ioredis, initialization happens on first command, but let's make sure it's ready:
        }
        return (redisClient as any)?.[prop];
    }
});

// Quick self-initialization for safety
initRedis().then(clientInstance => {
    Object.assign(client, clientInstance);
}).catch(err => {
    console.error('Failed to start embedded Redis:', err);
});

export default client;