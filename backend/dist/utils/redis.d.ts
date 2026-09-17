declare class MemoryRedis {
    private store;
    setex(key: string, seconds: number, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    on(event: string, cb: any): void;
}
export declare const redisClient: MemoryRedis;
export {};
//# sourceMappingURL=redis.d.ts.map