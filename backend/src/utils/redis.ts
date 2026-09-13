// In-memory substitute for Redis to bypass limits and avoid external dependencies
class MemoryRedis {
  private store = new Map<string, { value: string; expiry: NodeJS.Timeout | null }>();

  async setex(key: string, seconds: number, value: string) {
    if (this.store.has(key)) {
      const existing = this.store.get(key);
      if (existing?.expiry) clearTimeout(existing.expiry);
    }

    const timer = setTimeout(() => {
      this.store.delete(key);
    }, seconds * 1000);

    this.store.set(key, { value, expiry: timer });
  }

  async get(key: string): Promise<string | null> {
    const record = this.store.get(key);
    return record ? record.value : null;
  }

  async del(key: string) {
    const record = this.store.get(key);
    if (record?.expiry) {
      clearTimeout(record.expiry);
    }
    this.store.delete(key);
  }

  on(event: string, cb: any) {
    if (event === 'connect') {
      setImmediate(cb);
    }
  }
}

export const redisClient = new MemoryRedis();
console.log('[Redis] Using In-Memory Redis substitute to bypass free tier limits.');
