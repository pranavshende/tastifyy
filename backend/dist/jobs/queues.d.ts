import { Queue } from 'bullmq';
export declare const orderTimeoutQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare function scheduleOrderTimeout(orderId: string, delayMs: number): Promise<void>;
export declare function cancelOrderTimeout(orderId: string): Promise<void>;
export declare const payoutQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare const smsQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare const notificationQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare const assignmentQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
export declare const refundQueue: Queue<any, any, string, any, any, string, import("bullmq").RedisQueueBackend>;
//# sourceMappingURL=queues.d.ts.map