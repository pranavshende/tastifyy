import { Queue } from '../utils/memoryQueue.js';
export declare const orderTimeoutQueue: Queue;
export declare function scheduleOrderTimeout(orderId: string, delayMs: number): Promise<void>;
export declare function cancelOrderTimeout(orderId: string): Promise<void>;
export declare const payoutQueue: Queue;
export declare const smsQueue: Queue;
export declare const notificationQueue: Queue;
export declare const whatsappQueue: Queue;
export declare const assignmentQueue: Queue;
export declare const refundQueue: Queue;
//# sourceMappingURL=queues.d.ts.map