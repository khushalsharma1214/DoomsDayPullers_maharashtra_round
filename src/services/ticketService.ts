import redis from '../config/redis.js';

// Initializes or resets available seats and clears previous test users in Redis
export const initializeInventory = async () => {
    await redis.set('available_seats', 500);
    await redis.del('purchased_users'); // Clear past user purchases on restart/init
    console.log('Inventory initialized with 500 seats and user list cleared.');
};

export const processPurchase = async (userId: string): Promise<boolean> => {
    // Safety check: Ensure inventory is initialized if it's missing
    const currentSeats = await redis.get('available_seats');
    if (currentSeats === null) {
        await initializeInventory();
    }

    // Atomic Lua script to prevent race conditions and duplicate allocations
    const luaScript = `
        local seats = tonumber(redis.call('get', KEYS[1]))
        if seats and seats > 0 then
            local alreadyBought = redis.call('sismember', KEYS[2], ARGV[1])
            if alreadyBought == 1 then return 0 end

            redis.call('decr', KEYS[1])
            redis.call('sadd', KEYS[2], ARGV[1])
            return 1
        end
        return 0
    `;

    const result = await redis.eval(
        luaScript,
        2,
        'available_seats',
        'purchased_users',
        userId
    );

    return result === 1;
};