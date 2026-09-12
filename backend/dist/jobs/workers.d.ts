import { Worker } from 'bullmq';
export declare const orderTimeoutWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
export declare const payoutWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
export declare const smsWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
export declare const notificationWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
export declare const assignmentWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
export declare const refundWorker: Worker<any, any, string, import("bullmq").RedisQueueBackend, import("bullmq").JobProgress>;
//# sourceMappingURL=workers.d.ts.map