import { Queue } from '../utils/memoryQueue.js';
// import { redisClient } from '../utils/redis.js'; // Disabled to avoid Redis dependency
// Order Timeout Queue: Handles auto-cancellation if restaurant doesn't respond
export const orderTimeoutQueue = new Queue('order-timeout');
export async function scheduleOrderTimeout(orderId, delayMs) {
    await orderTimeoutQueue.add('check-timeout', { orderId }, {
        delay: delayMs,
        jobId: `timeout-${orderId}` // Idempotent key so we can easily cancel it
    });
}
export async function cancelOrderTimeout(orderId) {
    const job = await orderTimeoutQueue.getJob(`timeout-${orderId}`);
    if (job) {
        await job.remove();
    }
}
// Delivery Payout Queue: Handles triggering RazorpayX payout after delivery
export const payoutQueue = new Queue('delivery-payout');
// SMS Queue: Handles asynchronous Auth and Delivery SMS sending
export const smsQueue = new Queue('sms');
// Notification Queue: Handles Push Notifications (FCM) and DB Notifications
export const notificationQueue = new Queue('notification');
// WhatsApp order alerts: provider calls run in a worker.
export const whatsappQueue = new Queue('whatsapp-alert');
// Assignment Queue: Handles geospatial delivery partner assignment
export const assignmentQueue = new Queue('assignment');
// Refund Queue: Handles Razorpay refunds asynchronously
export const refundQueue = new Queue('refund');
//# sourceMappingURL=queues.js.map