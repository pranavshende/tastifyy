import { prisma } from '../utils/prisma.js';
import Razorpay from 'razorpay';
import { randomUUID, createHmac } from 'crypto';
import axios from 'axios';
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});
// Used when a restaurant sets up their bank details
export const createLinkedAccount = async (req, res) => {
    const { email, phone, name, account_number, ifsc_code, beneficiary_name } = req.body;
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
        if (!partner) {
            res.status(403).json({ success: false, error: 'Not a restaurant partner' });
            return;
        }
        let razorpay_account_id = '';
        if (process.env.RAZORPAY_KEY_ID === 'rzp_test_mock' || !process.env.RAZORPAY_KEY_ID) {
            razorpay_account_id = `acc_mock_${randomUUID().substring(0, 8)}`;
        }
        else {
            // Real Razorpay Route API call
            const account = await razorpay.accounts.create({
                type: 'route',
                email: email || user.email || 'partner@tastifyy.app',
                phone: phone || user.phone,
                legal_business_name: name || beneficiary_name,
                business_type: 'individual',
                contact_name: beneficiary_name || name,
                profile: {
                    category: 'food',
                    subcategory: 'restaurant'
                },
                legal_info: {
                    pan: 'ABCDE1234F' // Required by RP, typically collected during onboarding. Mocked here if missing.
                }
            });
            razorpay_account_id = account.id;
        }
        // Save to DB
        await prisma.restaurant.update({
            where: { id: partner.restaurant_id },
            data: { razorpay_account_id }
        });
        res.json({ success: true, data: { razorpay_account_id } });
    }
    catch (error) {
        console.error('Razorpay Linked Account Error:', error?.error || error);
        res.status(500).json({ success: false, error: 'Failed to create linked account' });
    }
};
// Used to trigger payouts to delivery partners via RazorpayX
export const triggerPayout = async (req, res) => {
    const { partner_id, amount } = req.body; // amount in INR
    const user = req.user;
    if (user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
    }
    try {
        const deliveryPartner = await prisma.deliveryPartner.findUnique({ where: { id: partner_id } });
        if (!deliveryPartner || !deliveryPartner.bank_account_number || !deliveryPartner.ifsc_code) {
            res.status(400).json({ success: false, error: 'Delivery partner bank details missing' });
            return;
        }
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_mock') {
            // Mock RazorpayX payout creation
            res.json({ success: true, message: 'Payout triggered successfully (Mocked)', data: { partner_id, amount, status: 'processed' } });
            return;
        }
        if (!process.env.RAZORPAYX_ACCOUNT_NUMBER) {
            res.status(400).json({ success: false, error: 'RAZORPAYX_ACCOUNT_NUMBER is not configured.' });
            return;
        }
        const authHeader = 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        // 1. Create Contact
        const contactRes = await axios.post('https://api.razorpay.com/v1/contacts', {
            name: deliveryPartner.name,
            contact: deliveryPartner.phone,
            type: 'employee',
            reference_id: deliveryPartner.id
        }, { headers: { Authorization: authHeader } });
        const contactId = contactRes.data.id;
        // 2. Create Fund Account
        const fundAccRes = await axios.post('https://api.razorpay.com/v1/fund_accounts', {
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
                name: deliveryPartner.name,
                ifsc: deliveryPartner.ifsc_code,
                account_number: deliveryPartner.bank_account_number
            }
        }, { headers: { Authorization: authHeader } });
        const fundAccountId = fundAccRes.data.id;
        // 3. Create Payout
        const payoutRes = await axios.post('https://api.razorpay.com/v1/payouts', {
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
            fund_account_id: fundAccountId,
            amount: Math.round(Number(amount) * 100), // in paise
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: `payout_${randomUUID().substring(0, 8)}`,
            narration: 'Tastifyy Delivery Payout'
        }, { headers: { Authorization: authHeader } });
        res.json({ success: true, message: 'Payout triggered successfully', data: payoutRes.data });
    }
    catch (error) {
        console.error('RazorpayX Payout Error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to trigger payout', details: error?.response?.data || error.message });
    }
};
export const handleRazorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_mock';
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        res.status(400).send('Missing signature');
        return;
    }
    try {
        // Verify signature using the raw Buffer body
        const expected = createHmac('sha256', secret).update(req.body).digest('hex');
        if (expected !== signature) {
            res.status(400).send('Invalid signature');
            return;
        }
        const payload = JSON.parse(req.body.toString());
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        if (!paymentEntity) {
            res.status(400).send('Invalid payload structure');
            return;
        }
        const razorpay_order_id = paymentEntity.order_id;
        const razorpay_payment_id = paymentEntity.id;
        if (!razorpay_order_id) {
            res.status(200).send('OK');
            return;
        }
        const order = await prisma.order.findFirst({
            where: { razorpay_order_id }
        });
        if (!order) {
            res.status(404).send('Order not found');
            return;
        }
        if (event === 'payment.captured' || event === 'order.paid') {
            if (order.payment_status !== 'success') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        payment_status: 'success',
                        razorpay_payment_id,
                        status: 'restaurant_confirmed'
                    }
                });
                // Use dynamic import for socket to avoid circular deps or missing imports
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.to(`restaurant_${order.restaurant_id}`).emit('order:status_update', {
                    orderId: order.id,
                    status: 'restaurant_confirmed',
                    payment_status: 'success'
                });
            }
        }
        else if (event === 'payment.failed') {
            if (order.payment_status !== 'success') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        payment_status: 'failed',
                        status: 'cancelled',
                        cancellation_reason: 'Payment failed'
                    }
                });
            }
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
//# sourceMappingURL=payment.controller.js.map