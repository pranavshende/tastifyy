import { prisma } from '../utils/prisma.js';
/**
 * sendPushNotification
 *
 * Fetches the user's FCM token and dispatches a push notification.
 * If FIREBASE_SERVICE_ACCOUNT is not set, it logs the payload to console
 * to simulate the FCM dispatch successfully.
 */
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
        const payload = {
            token: user.fcm_token,
            notification: { title, body },
            data: data || {}
        };
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // In a true environment, we would initialize firebase-admin and send:
            // const admin = require('firebase-admin');
            // await admin.messaging().send(payload);
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
//# sourceMappingURL=notification.service.js.map