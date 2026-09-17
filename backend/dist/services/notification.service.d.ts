export declare function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>): Promise<boolean>;
export declare function createNotification(recipientId: string, recipientType: 'customer' | 'restaurant_partner' | 'delivery_partner' | 'admin', type: string, title: string, body: string, data?: any): Promise<{
    id: string;
    created_at: Date;
    type: string;
    data: import("@prisma/client/runtime/client").JsonValue | null;
    recipient_type: import("@prisma/client").$Enums.RecipientType;
    recipient_id: string;
    title: string;
    body: string;
    is_read: boolean;
}>;
//# sourceMappingURL=notification.service.d.ts.map