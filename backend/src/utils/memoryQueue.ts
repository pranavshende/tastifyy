// In-memory replacement for BullMQ to remove Redis dependency and bypass free tier limits

type JobHandler = (job: any) => Promise<any>;

class MemoryQueue {
  name: string;
  static timers = new Map<string, NodeJS.Timeout>();
  static workers = new Map<string, JobHandler>();

  constructor(name: string, opts?: any) {
    this.name = name;
  }

  async add(name: string, data: any, opts?: any) {
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
    } else {
      // Execute immediately but asynchronously to avoid blocking the event loop
      setImmediate(() => {
        MemoryQueue.dispatch(this.name, job);
      });
    }

    return job;
  }

  async getJob(jobId: string) {
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

  static dispatch(queueName: string, job: any) {
    const handler = MemoryQueue.workers.get(queueName);
    if (handler) {
      handler(job).catch(err => console.error(`[In-Memory Queue] Job Error [${queueName}]:`, err));
    } else {
      console.warn(`[In-Memory Queue] No worker registered for queue: ${queueName}`);
    }
  }
}

class MemoryWorker {
  constructor(queueName: string, handler: JobHandler) {
    MemoryQueue.workers.set(queueName, handler);
  }
}

export { MemoryQueue as Queue, MemoryWorker as Worker };
