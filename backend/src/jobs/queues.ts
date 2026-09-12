import { Queue } from 'bullmq';
import { redisClient } from '../utils/redis.js';

// Order Timeout Queue: Handles auto-cancellation if restaurant doesn't respond
export const orderTimeoutQueue = new Queue('order-timeout', { connection: redisClient });

export async function scheduleOrderTimeout(orderId: string, delayMs: number) {
  await orderTimeoutQueue.add('check-timeout', { orderId }, {
    delay: delayMs,
    jobId: `timeout-${orderId}` // Idempotent key so we can easily cancel it
  });
}

export async function cancelOrderTimeout(orderId: string) {
  const job = await orderTimeoutQueue.getJob(`timeout-${orderId}`);
  if (job) {
    await job.remove();
  }
}

// Delivery Payout Queue: Handles triggering RazorpayX payout after delivery
export const payoutQueue = new Queue('delivery-payout', { connection: redisClient });

// SMS Queue: Handles asynchronous Auth and Delivery SMS sending
export const smsQueue = new Queue('sms', { connection: redisClient });

// Notification Queue: Handles Push Notifications (FCM) and DB Notifications
export const notificationQueue = new Queue('notification', { connection: redisClient });

// Assignment Queue: Handles geospatial delivery partner assignment
export const assignmentQueue = new Queue('assignment', { connection: redisClient });

// Refund Queue: Handles Razorpay refunds asynchronously
export const refundQueue = new Queue('refund', { connection: redisClient });
