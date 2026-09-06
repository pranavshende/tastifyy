/**
 * sendPushNotification
 *
 * Fetches the user's FCM token and dispatches a push notification.
 * If FIREBASE_SERVICE_ACCOUNT is not set, it logs the payload to console
 * to simulate the FCM dispatch successfully.
 */
export declare function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>): Promise<boolean>;
//# sourceMappingURL=notification.service.d.ts.map