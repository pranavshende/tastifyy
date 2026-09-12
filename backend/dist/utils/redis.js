import { Redis } from 'ioredis';
// Create a single shared Redis client instance
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not set in environment. Background jobs and OTP will fail.');
}
// We use maxRetriesPerRequest: null because BullMQ requires it
export const redisClient = new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
redisClient.on('error', (err) => {
    console.error('[Redis] Connection Error:', err);
});
redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
});
//# sourceMappingURL=redis.js.map