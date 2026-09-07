import { prisma } from '../utils/prisma.js';
import Razorpay from 'razorpay';
import { randomUUID, createHmac } from 'crypto';
import axios from 'axios';
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});
const razorpayAuthHeader = () => 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
// ─── STEP 1: Create Linked Account ─────────────────────────────────────────────
// POST /api/payments/linked-account
export const createLinkedAccount = async (req, res) => {
    const { email, phone, name, business_type, pan_number } = req.body;
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
        if (!partner) {
            res.status(403).json({ success: false, error: 'Not a restaurant partner' });
            return;
        }
        const restaurant = await prisma.restaurant.findUnique({ where: { id: partner.restaurant_id } });
        if (!restaurant) {
            res.status(404).json({ success: false, error: 'Restaurant not found' });
            return;
        }
        // Prevent duplicate account creation
        if (restaurant.razorpay_account_id && restaurant.route_account_status !== 'failed') {
            res.json({ success: true, data: { razorpay_account_id: restaurant.razorpay_account_id, route_account_status: restaurant.route_account_status } });
            return;
        }
        if (!pan_number || pan_number.length !== 10) {
            res.status(400).json({ success: false, error: 'Valid 10-character PAN is required for Route onboarding.' });
            return;
        }
        const account = await razorpay.accounts.create({
            email: email || user.email || restaurant.email || 'partner@tastifyy.app',
            profile: {
                category: 'food',
                subcategory: 'restaurant',
                addresses: {
                    registered: {
                        street1: restaurant.address_line,
                        city: restaurant.city,
                        state: restaurant.state,
                        postal_code: restaurant.pincode,
                        country: 'IN'
                    }
                }
            },
            legal_business_name: restaurant.name,
            business_type: business_type || 'individual',
            contact_name: name || restaurant.owner_name,
            legal_info: { pan: pan_number }
        });
        const razorpay_account_id = account.id;
        await prisma.restaurant.update({
            where: { id: partner.restaurant_id },
            data: { razorpay_account_id, pan_number, route_account_status: 'account_created' }
        });
        res.json({ success: true, message: 'Linked account created. Proceed to add stakeholder.', data: { razorpay_account_id } });
    }
    catch (error) {
        console.error('Razorpay Linked Account Error:', error?.error || error);
        res.status(500).json({ success: false, error: 'Failed to create linked account', details: error?.error?.description });
    }
};
// ─── STEP 2: Create Stakeholder ────────────────────────────────────────────────
// POST /api/payments/stakeholder
export const createStakeholder = async (req, res) => {
    const { name, email, phone, relationship, ownership_percentage } = req.body;
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
        if (!partner) {
            res.status(403).json({ success: false, error: 'Not a restaurant partner' });
            return;
        }
        const restaurant = await prisma.restaurant.findUnique({ where: { id: partner.restaurant_id } });
        if (!restaurant?.razorpay_account_id) {
            res.status(400).json({ success: false, error: 'Linked account must be created before adding a stakeholder.' });
            return;
        }
        const sth = await axios.post(`https://api.razorpay.com/v2/accounts/${restaurant.razorpay_account_id}/stakeholders`, {
            name: name || restaurant.owner_name,
            email: email || restaurant.email,
            relationship: { director: relationship === 'director' },
            phone: { primary: phone || restaurant.phone },
            ownership_percentage: ownership_percentage || 100
        }, { headers: { Authorization: razorpayAuthHeader() } });
        const stakeholder_id = sth.data.id;
        await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: { razorpay_stakeholder_id: stakeholder_id, route_account_status: 'product_config_pending' }
        });
        res.json({ success: true, message: 'Stakeholder added. Proceed to configure bank details.', data: { stakeholder_id } });
    }
    catch (error) {
        console.error('Stakeholder Error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to create stakeholder', details: error?.response?.data });
    }
};
// ─── STEP 3: Configure Product + Bank Details ───────────────────────────────────
// POST /api/payments/product-config
export const configureRouteProduct = async (req, res) => {
    const { account_number, ifsc_code, beneficiary_name } = req.body;
    const user = req.user;
    try {
        const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
        if (!partner) {
            res.status(403).json({ success: false, error: 'Not a restaurant partner' });
            return;
        }
        const restaurant = await prisma.restaurant.findUnique({ where: { id: partner.restaurant_id } });
        if (!restaurant?.razorpay_account_id) {
            res.status(400).json({ success: false, error: 'Complete linked account and stakeholder steps first.' });
            return;
        }
        if (!account_number || !ifsc_code || !beneficiary_name) {
            res.status(400).json({ success: false, error: 'Bank account number, IFSC, and beneficiary name are required.' });
            return;
        }
        // Save bank details to DB first
        await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: { bank_account_number: account_number, ifsc_code, bank_beneficiary_name: beneficiary_name }
        });
        // Request Route product access
        await axios.post(`https://api.razorpay.com/v2/accounts/${restaurant.razorpay_account_id}/products`, { requested_product: 'route' }, { headers: { Authorization: razorpayAuthHeader() } });
        // Attach bank details to product
        await axios.patch(`https://api.razorpay.com/v2/accounts/${restaurant.razorpay_account_id}/products/route`, { settlements: { account_number, ifsc_code, beneficiary_name }, tnc_accepted: true }, { headers: { Authorization: razorpayAuthHeader() } });
        const newStatus = 'verification_pending';
        await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: { route_account_status: newStatus }
        });
        res.json({
            success: true,
            message: 'Bank details submitted. Account pending Razorpay verification.',
            data: { route_account_status: newStatus }
        });
    }
    catch (error) {
        console.error('Product Config Error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to configure Route product', details: error?.response?.data });
    }
};
// ─── DELIVERY PAYOUT (FIX-002: X-Payout-Idempotency, FIX-009: reuse contact/fund_account) ──
// POST /api/payments/payout  (admin only)
export const triggerPayout = async (req, res) => {
    const { assignment_id } = req.body;
    const user = req.user;
    if (user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
    }
    try {
        const assignment = await prisma.deliveryAssignment.findUnique({
            where: { id: assignment_id },
            include: { partner: true }
        });
        if (!assignment) {
            res.status(404).json({ success: false, error: 'Delivery assignment not found' });
            return;
        }
        if (assignment.payout_status === 'success' || assignment.payout_status === 'processing') {
            res.status(409).json({ success: false, error: 'Payout already processed or in progress' });
            return;
        }
        if (!assignment.partner?.bank_account_number || !assignment.partner?.ifsc_code) {
            res.status(400).json({ success: false, error: 'Delivery partner bank details missing' });
            return;
        }
        // Atomic lock
        const updateCount = await prisma.deliveryAssignment.updateMany({
            where: { id: assignment_id, payout_status: { notIn: ['success', 'processing'] } },
            data: { payout_status: 'processing' }
        });
        if (updateCount.count === 0) {
            res.status(409).json({ success: false, error: 'Payout already initiated concurrently' });
            return;
        }
        const deliveryPartner = assignment.partner;
        const amount = Number(assignment.earning_amount) || 0;
        if (amount <= 0) {
            await prisma.deliveryAssignment.update({ where: { id: assignment_id }, data: { payout_status: 'failed' } });
            res.status(400).json({ success: false, error: 'Invalid payout amount' });
            return;
        }
        // Deterministic idempotency key (<36 chars limit for RazorpayX)
        const idempotencyKey = assignment_id;
        if (!process.env.RAZORPAYX_ACCOUNT_NUMBER) {
            await prisma.deliveryAssignment.update({ where: { id: assignment_id }, data: { payout_status: 'failed' } });
            res.status(400).json({ success: false, error: 'RAZORPAYX_ACCOUNT_NUMBER is not configured.' });
            return;
        }
        const authHeader = razorpayAuthHeader();
        // Reuse contact_id if already stored
        let contactId = deliveryPartner.razorpay_contact_id;
        if (!contactId) {
            const contactRes = await axios.post('https://api.razorpay.com/v1/contacts', {
                name: deliveryPartner.bank_beneficiary_name || deliveryPartner.name,
                contact: deliveryPartner.phone,
                type: 'employee',
                reference_id: deliveryPartner.id
            }, { headers: { Authorization: authHeader } });
            contactId = contactRes.data.id;
            await prisma.deliveryPartner.update({ where: { id: deliveryPartner.id }, data: { razorpay_contact_id: contactId } });
        }
        // Reuse fund_account_id if already stored
        let fundAccountId = deliveryPartner.razorpay_fund_account_id;
        if (!fundAccountId) {
            const fundAccRes = await axios.post('https://api.razorpay.com/v1/fund_accounts', {
                contact_id: contactId,
                account_type: 'bank_account',
                bank_account: {
                    name: deliveryPartner.bank_beneficiary_name || deliveryPartner.name,
                    ifsc: deliveryPartner.ifsc_code,
                    account_number: deliveryPartner.bank_account_number
                }
            }, { headers: { Authorization: authHeader } });
            fundAccountId = fundAccRes.data.id;
            await prisma.deliveryPartner.update({ where: { id: deliveryPartner.id }, data: { razorpay_fund_account_id: fundAccountId } });
        }
        // FIX-002: Mandatory X-Payout-Idempotency header
        const payoutRes = await axios.post('https://api.razorpay.com/v1/payouts', {
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
            fund_account_id: fundAccountId,
            amount: Math.round(amount * 100),
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: idempotencyKey,
            narration: 'Tastifyy Delivery Payout'
        }, {
            headers: {
                Authorization: authHeader,
                'X-Payout-Idempotency': idempotencyKey
            }
        });
        // Keep status as 'processing' — webhook finalises it
        await prisma.deliveryAssignment.update({
            where: { id: assignment_id },
            data: {
                payout_status: 'processing',
                payout_reference_id: payoutRes.data.id,
                payout_idempotency_key: idempotencyKey
            }
        });
        res.json({ success: true, message: 'Payout triggered. Awaiting webhook confirmation.', data: { payout_id: payoutRes.data.id } });
    }
    catch (error) {
        const errorMsg = error?.response?.data?.error?.description || error.message;
        console.error('RazorpayX Payout Error:', error?.response?.data || error.message);
        await prisma.deliveryAssignment.updateMany({
            where: { id: req.body.assignment_id, payout_status: 'processing' },
            data: { payout_status: 'failed', payout_failure_reason: errorMsg }
        }).catch(console.error);
        res.status(500).json({ success: false, error: 'Failed to trigger payout', details: error?.response?.data || error.message });
    }
};
// ─── WEBHOOK HANDLER ─────────────────────────────────────────────────────────────
export const handleRazorpayWebhook = async (req, res) => {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is not configured in live mode. Denying webhook.');
        res.status(500).send('Webhook secret misconfigured');
        return;
    }
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        res.status(400).send('Missing signature');
        return;
    }
    try {
        const expected = createHmac('sha256', secret).update(req.body).digest('hex');
        if (expected !== signature) {
            res.status(400).send('Invalid signature');
            return;
        }
        const payload = JSON.parse(req.body.toString());
        const event = payload.event;
        // ── Payment Events ──────────────────────────────────────────────────────
        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payload?.payment?.entity;
            if (!paymentEntity?.order_id) {
                res.status(200).send('OK');
                return;
            }
            const order = await prisma.order.findFirst({
                where: { razorpay_order_id: paymentEntity.order_id },
                include: { order_items: true }
            });
            // Always return 200 to prevent Razorpay retries
            if (!order) {
                res.status(200).send('OK');
                return;
            }
            const notes_order_id = paymentEntity.notes?.order_id;
            if (notes_order_id && notes_order_id !== order.id) {
                console.error(`[Webhook] IDOR: payload order ${notes_order_id} != DB order ${order.id}`);
                res.status(200).send('OK');
                return;
            }
            if (order.payment_status !== 'success') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { payment_status: 'success', razorpay_payment_id: paymentEntity.id, status: 'restaurant_confirmed' }
                });
                const { getIO } = await import('../socket.js');
                getIO().to(`restaurant_${order.restaurant_id}`).emit('order:status_update', {
                    orderId: order.id, status: 'restaurant_confirmed', payment_status: 'success'
                });
            }
        }
        else if (event === 'payment.failed') {
            const paymentEntity = payload.payload?.payment?.entity;
            if (!paymentEntity?.order_id) {
                res.status(200).send('OK');
                return;
            }
            const order = await prisma.order.findFirst({
                where: { razorpay_order_id: paymentEntity.order_id },
                include: { order_items: true }
            });
            if (!order) {
                res.status(200).send('OK');
                return;
            }
            if (order.payment_status !== 'success' && order.status !== 'cancelled') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { payment_status: 'failed', status: 'cancelled', cancellation_reason: 'Payment failed' }
                });
                for (const item of order.order_items) {
                    await prisma.menuItem.updateMany({
                        where: { id: item.menu_item_id, stock_quantity: { not: null } },
                        data: { stock_quantity: { increment: item.quantity } }
                    });
                }
            }
        }
        // ── Route Transfer Events (FIX-007: store transfer_id) ─────────────────
        else if (event === 'transfer.processed') {
            const transferEntity = payload.payload?.transfer?.entity;
            if (transferEntity?.source) {
                const order = await prisma.order.findFirst({ where: { razorpay_order_id: transferEntity.source } });
                if (order) {
                    await prisma.order.update({ where: { id: order.id }, data: { razorpay_transfer_id: transferEntity.id } });
                    console.log(`[Webhook] TRANSFER_PROCESSED: Order ${order.id} — transfer ${transferEntity.id}`);
                }
            }
        }
        // ── RazorpayX Payout Events (FIX-008) ─────────────────────────────────
        else if (event === 'payout.processed') {
            const payoutId = payload.payload?.payout?.entity?.id;
            if (payoutId) {
                await prisma.deliveryAssignment.updateMany({
                    where: { payout_reference_id: payoutId },
                    data: { payout_status: 'success', payout_processed_at: new Date() }
                });
                console.log(`[Webhook] PAYOUT_PROCESSED: ${payoutId}`);
            }
        }
        else if (event === 'payout.failed') {
            const payoutId = payload.payload?.payout?.entity?.id;
            if (payoutId) {
                const description = payload.payload?.payout?.entity?.failure_reason || 'Webhook failed';
                await prisma.deliveryAssignment.updateMany({
                    where: { payout_reference_id: payoutId, payout_status: 'processing' },
                    data: { payout_status: 'failed', payout_failure_reason: description }
                });
                console.warn(`[Webhook] PAYOUT_FAILED: ${payoutId} — admin should retry.`);
            }
        }
        else if (event === 'payout.reversed') {
            const payoutId = payload.payload?.payout?.entity?.id;
            if (payoutId) {
                const description = payload.payload?.payout?.entity?.failure_reason || 'Webhook reversed';
                // Clear reference so payout can be re-triggered
                await prisma.deliveryAssignment.updateMany({
                    where: { payout_reference_id: payoutId },
                    data: { payout_status: 'reversed', payout_reference_id: null, payout_failure_reason: description }
                });
                console.warn(`[Webhook] PAYOUT_REVERSED: ${payoutId} — admin must re-trigger payout.`);
            }
        }
        // ── Route Account Activation Events ─────────────────────────────────────
        else if (event === 'account.instantly_activated' || event === 'account.activated') {
            const accountId = payload.payload?.account?.entity?.id;
            if (accountId) {
                await prisma.restaurant.updateMany({
                    where: { razorpay_account_id: accountId },
                    data: { route_account_status: 'activated', route_activated_at: new Date() }
                });
                console.log(`[Webhook] ROUTE_ACCOUNT_ACTIVATED: ${accountId}`);
            }
        }
        else if (event === 'account.needs_clarification' || event === 'account.rejected') {
            const accountId = payload.payload?.account?.entity?.id;
            if (accountId) {
                await prisma.restaurant.updateMany({
                    where: { razorpay_account_id: accountId },
                    data: { route_account_status: 'rejected' }
                });
                console.warn(`[Webhook] ROUTE_ACCOUNT_REJECTED/CLARIFICATION: ${accountId}`);
            }
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
// ─── REFUND UTILITY (FIX-003 + FIX-006) ─────────────────────────────────────────
export const processRefund = async (order_id, reason = 'Order cancelled', isPartialRefund = false, refundAmount) => {
    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order || !order.razorpay_payment_id || order.payment_status !== 'success') {
        return { success: false, error: 'No captured payment to refund' };
    }
    const amountToRefund = refundAmount || Math.round(Number(order.total_amount) * 100);
    try {
        let reversalId = null;
        let reversalStatus = null;
        // Use manual reversal ONLY for partial refunds where reverse_all cannot be used
        if (isPartialRefund && order.razorpay_transfer_id) {
            try {
                const reversalRes = await axios.post(`https://api.razorpay.com/v1/transfers/${order.razorpay_transfer_id}/reversals`, { amount: amountToRefund }, { headers: { Authorization: razorpayAuthHeader() } });
                reversalId = reversalRes.data.id;
                reversalStatus = 'success';
                console.log(`[Refund] Manual transfer reversal successful for order ${order_id}`);
            }
            catch (reversalErr) {
                reversalStatus = 'failed';
                console.error(`[Refund] Manual transfer reversal failed (continuing with refund):`, reversalErr?.response?.data || reversalErr.message);
            }
        }
        const refundPayload = {
            amount: amountToRefund,
            notes: { order_id, reason }
        };
        if (!isPartialRefund) {
            // Automatic Razorpay native reverse_all for full refunds (safe and atomic)
            refundPayload.reverse_all = 1;
        }
        const refund = await razorpay.payments.refund(order.razorpay_payment_id, refundPayload);
        const refundId = refund.id;
        if (!isPartialRefund) {
            reversalStatus = 'success';
        }
        await prisma.order.update({
            where: { id: order_id },
            data: {
                payment_status: 'refunded',
                razorpay_refund_id: refundId,
                refund_status: 'refunded',
                razorpay_reversal_id: reversalId,
                reversal_status: reversalStatus
            }
        });
        return { success: true, refundId };
    }
    catch (error) {
        const errorMsg = error?.error?.description || error.message;
        console.error(`[Refund Error] order ${order_id}:`, errorMsg);
        await prisma.order.update({
            where: { id: order_id },
            data: {
                refund_status: 'refund_failed',
                refund_failure_reason: errorMsg
            }
        });
        return { success: false, error: errorMsg };
    }
};
// Triggering TS rebuild
//# sourceMappingURL=payment.controller.js.map