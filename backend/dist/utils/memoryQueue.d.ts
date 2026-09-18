type JobHandler = (job: any) => Promise<any>;
declare class MemoryQueue {
    name: string;
    static timers: Map<string, NodeJS.Timeout>;
    static workers: Map<string, JobHandler>;
    constructor(name: string, opts?: any);
    add(name: string, data: any, opts?: any): Promise<{
        name: string;
        data: any;
        id: any;
        remove: () => Promise<void>;
    }>;
    getJob(jobId: string): Promise<{
        remove: () => Promise<void>;
    }>;
    static dispatch(queueName: string, job: any): void;
}
declare class MemoryWorker {
    constructor(queueName: string, handler: JobHandler);
}
export { MemoryQueue as Queue, MemoryWorker as Worker };
//# sourceMappingURL=memoryQueue.d.ts.map