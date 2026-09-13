// In-memory substitute for Redis to bypass limits and avoid external dependencies
class MemoryRedis {
    store = new Map();
    async setex(key, seconds, value) {
        if (this.store.has(key)) {
            const existing = this.store.get(key);
            if (existing?.expiry)
                clearTimeout(existing.expiry);
        }
        const timer = setTimeout(() => {
            this.store.delete(key);
        }, seconds * 1000);
        this.store.set(key, { value, expiry: timer });
    }
    async get(key) {
        const record = this.store.get(key);
        return record ? record.value : null;
    }
    async del(key) {
        const record = this.store.get(key);
        if (record?.expiry) {
            clearTimeout(record.expiry);
        }
        this.store.delete(key);
    }
    on(event, cb) {
        if (event === 'connect') {
            setImmediate(cb);
        }
    }
}
export const redisClient = new MemoryRedis();
console.log('[Redis] Using In-Memory Redis substitute to bypass free tier limits.');
//# sourceMappingURL=redis.js.map