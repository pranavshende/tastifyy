// In-memory replacement for BullMQ to remove Redis dependency and bypass free tier limits
class MemoryQueue {
    name;
    static timers = new Map();
    static workers = new Map();
    constructor(name, opts) {
        this.name = name;
    }
    async add(name, data, opts) {
        const jobId = opts?.jobId || Math.random().toString(36).substr(2, 9);
        const delay = opts?.delay || 0;
        const job = {
            name,
            data,
            id: jobId,
            remove: async () => {
                const timer = MemoryQueue.timers.get(jobId);
                if (timer) {
                    clearTimeout(timer);
                    MemoryQueue.timers.delete(jobId);
                }
            }
        };
        if (delay > 0) {
            const timer = setTimeout(() => {
                MemoryQueue.dispatch(this.name, job);
                MemoryQueue.timers.delete(jobId);
            }, delay);
            MemoryQueue.timers.set(jobId, timer);
        }
        else {
            // Execute immediately but asynchronously to avoid blocking the event loop
            setImmediate(() => {
                MemoryQueue.dispatch(this.name, job);
            });
        }
        return job;
    }
    async getJob(jobId) {
        return {
            remove: async () => {
                const timer = MemoryQueue.timers.get(jobId);
                if (timer) {
                    clearTimeout(timer);
                    MemoryQueue.timers.delete(jobId);
                }
            }
        };
    }
    static dispatch(queueName, job) {
        const handler = MemoryQueue.workers.get(queueName);
        if (handler) {
            handler(job).catch(err => console.error(`[In-Memory Queue] Job Error [${queueName}]:`, err));
        }
        else {
            console.warn(`[In-Memory Queue] No worker registered for queue: ${queueName}`);
        }
    }
}
class MemoryWorker {
    constructor(queueName, handler) {
        MemoryQueue.workers.set(queueName, handler);
    }
}
export { MemoryQueue as Queue, MemoryWorker as Worker };
//# sourceMappingURL=memoryQueue.js.map