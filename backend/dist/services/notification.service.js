import { prisma } from '../utils/prisma.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
// Initialize Firebase Admin once
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('[FCM] Firebase Admin initialized successfully');
    }
    catch (error) {
        console.error('[FCM] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize admin', error);
    }
}
export async function sendPushNotification(userId, title, body, data) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fcm_token: true }
        });
        if (!user || !user.fcm_token) {
            console.warn(`[FCM-MOCK] Cannot send notification, user ${userId} has no fcm_token.`);
            return false;
        }
        if (getApps().length > 0) {
            await getMessaging().send({
                token: user.fcm_token,
                notification: { title, body },
                data: data || {}
            });
            console.log(`[FCM] Sent real push notification to user ${userId}`);
        }
        else {
            // Local Stub Logging
            console.log(`\n================== FCM PUSH NOTIFICATION ==================`);
            console.log(`To: User ${userId} (Token: ${user.fcm_token})`);
            console.log(`Title: ${title}`);
            console.log(`Body: ${body}`);
            if (data)
                console.log(`Data Payload:`, data);
            console.log(`===========================================================\n`);
        }
        return true;
    }
    catch (error) {
        console.error(`[FCM-ERROR] Failed to send push notification to user ${userId}:`, error);
        return false;
    }
}
import { getIO } from '../socket.js';
export async function createNotification(recipientId, recipientType, type, title, body, data) {
    try {
        const notification = await prisma.notification.create({
            data: {
                recipient_id: recipientId,
                recipient_type: recipientType,
                type,
                title,
                body,
                data: data || null,
                is_read: false
            }
        });
        try {
            getIO().to(`${recipientType}_${recipientId}`).emit('notification:new', notification);
        }
        catch (e) {
            console.error('[Notification] Failed to emit socket event', e);
        }
        return notification;
    }
    catch (e) {
        console.error('[Notification] Failed to create DB notification', e);
        return null;
    }
}
//# sourceMappingURL=notification.service.js.map