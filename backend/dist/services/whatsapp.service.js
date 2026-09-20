import { prisma } from '../utils/prisma.js';
import { whatsappQueue } from '../jobs/queues.js';
const DEFAULT_RECIPIENTS = ['7498784109', '9322586177'];
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000];
function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
}
async function getRecipients() {
    const config = await prisma.adminConfig.findUnique({ where: { key: 'WHATSAPP_ALERT_RECIPIENTS' } });
    const configured = config?.value.split(',').map(normalizePhone).filter(phone => phone.length >= 10) || [];
    return [...new Set(configured.length ? configured : DEFAULT_RECIPIENTS.map(normalizePhone))];
}
function money(value) {
    return `₹${Number(value || 0).toFixed(2)}`;
}
function mapsLink(latitude, longitude) {
    if (latitude === null || longitude === null || latitude === undefined || longitude === undefined)
        return 'Not available';
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
async function buildMessage(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            customer: { select: { name: true, phone: true } },
            restaurant: { include: { partners: { where: { is_active: true }, select: { name: true } } } },
            order_items: { select: { name_snapshot: true, quantity: true } },
            delivery_address: true
        }
    });
    if (!order)
        throw new Error(`Order ${orderId} not found`);
    const address = order.delivery_address;
    const items = order.order_items.map(item => `• ${item.name_snapshot} × ${item.quantity}`).join('\n');
    const partnerName = order.restaurant.partners[0]?.name || order.restaurant.owner_name;
    return `🔔 NEW TASTIFYY ORDER

Restaurant: ${order.restaurant.name}
Order ID: #${order.id}

Customer: ${order.customer.name}
Mobile: ${order.customer.phone}

Items:
${items}

Subtotal: ${money(order.item_subtotal)}
Delivery Charge: ${money(order.delivery_fee)}
Discount: ${money(order.discount_amount)}
Total: ${money(order.total_amount)}

Payment Method: ${String(order.payment_method).toUpperCase()}
Order Time: ${order.created_at.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Customer Address:
${address.address_line}, ${address.city}, ${address.state} - ${address.pincode}

📍 Order Location:
${mapsLink(address.latitude, address.longitude)}

Restaurant Partner:
${order.restaurant.name} / ${partnerName}

Please check the Tastifyy dashboard and process the order.`;
}
async function sendWhatsAppMessage(to, body) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId)
        throw new Error('WhatsApp API credentials are not configured');
    const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: true, body } })
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WhatsApp API ${response.status}: ${errorBody.slice(0, 500)}`);
    }
}
export async function enqueueWhatsAppAlerts(orderId) {
    const recipients = await getRecipients();
    for (const recipientPhone of recipients) {
        const log = await prisma.whatsAppNotificationLog.upsert({
            where: { order_id_recipient_phone: { order_id: orderId, recipient_phone: recipientPhone } },
            create: { order_id: orderId, recipient_phone: recipientPhone },
            update: {}
        });
        if (log.status !== 'sent') {
            await whatsappQueue.add('send', { logId: log.id }, { jobId: `whatsapp-${log.id}` });
        }
    }
}
export async function processWhatsAppAlert(logId) {
    // Atomically claim the log so duplicate queue jobs cannot send twice.
    const claimed = await prisma.whatsAppNotificationLog.updateMany({
        where: { id: logId, status: { in: ['pending', 'failed'] } },
        data: { status: 'sending', attempts: { increment: 1 } }
    });
    if (claimed.count === 0)
        return;
    const log = await prisma.whatsAppNotificationLog.findUnique({ where: { id: logId } });
    if (!log)
        return;
    const attempts = log.attempts;
    try {
        await sendWhatsAppMessage(log.recipient_phone, await buildMessage(log.order_id));
        await prisma.whatsAppNotificationLog.update({
            where: { id: logId },
            data: { status: 'sent', sent_at: new Date(), last_error: null, next_retry_at: null }
        });
        console.log(`[WhatsApp] Sent order ${log.order_id} to ${log.recipient_phone}`);
    }
    catch (error) {
        const finalFailure = attempts >= MAX_ATTEMPTS;
        const retryDelay = RETRY_DELAYS_MS[attempts - 1];
        await prisma.whatsAppNotificationLog.update({
            where: { id: logId },
            data: {
                status: 'failed',
                attempts,
                last_error: String(error?.message || error).slice(0, 1000),
                next_retry_at: finalFailure ? null : new Date(Date.now() + retryDelay)
            }
        });
        if (!finalFailure) {
            await whatsappQueue.add('send', { logId }, { delay: retryDelay, jobId: `whatsapp-${logId}-retry-${attempts}` });
        }
        console.error(`[WhatsApp] ${finalFailure ? 'Failed' : 'Retry scheduled for'} order ${log.order_id} to ${log.recipient_phone}:`, error);
    }
}
//# sourceMappingURL=whatsapp.service.js.map