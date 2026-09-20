import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';
import type { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { refundQueue } from '../jobs/queues.js';
import { getLaunchDaySettings } from '../utils/launchDay.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorizeRole(['admin']));

// ─── RESTAURANT MANAGEMENT ──────────────────────────────────────────────────

router.get('/restaurants', async (req: Request, res: Response) => {
  const { status } = req.query;
  try {
    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.approval_status = status;
    }
    const restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
  }
});

router.patch('/restaurants/:id/approve', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: {
        status: 'active',
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
        operating_status: 'open',
        is_open: true
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve restaurant' } });
  }
});

router.patch('/restaurants/:id/reject', async (req: Request, res: Response) => {
  const { rejection_reason } = req.body;
  try {
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: {
        status: 'rejected',
        approval_status: 'rejected',
        account_status: 'inactive',
        visibility_status: 'hidden',
        operating_status: 'closed',
        is_open: false,
        // Assuming there is a rejection_reason or notes field if we want to store it. We can just use the status for now, or log it.
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject restaurant' } });
  }
});

router.patch('/restaurants/:id/suspend', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: {
        status: 'suspended',
        approval_status: 'suspended',
        account_status: 'inactive',
        visibility_status: 'hidden',
        operating_status: 'closed',
        is_open: false
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to suspend restaurant' } });
  }
});


router.patch('/restaurants/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['pending', 'active', 'suspended', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  try {
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: {
        status,
        approval_status: status === 'active' ? 'approved' : status,
        account_status: status === 'active' ? 'active' : 'inactive',
        visibility_status: status === 'active' ? 'visible' : 'hidden',
        operating_status: status === 'active' ? 'open' : 'closed',
        is_open: status === 'active'
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
  }
});

// ─── PROFILE ROUTES ─────────────────────────────────────────────────────────

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).id },
      select: { id: true, name: true, phone: true, email: true, profile_photo_url: true }
    });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    user.profile_photo_url = getPublicUrl(user.profile_photo_url);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
    return;
  }
  try {
    const user = await prisma.user.update({
      where: { id: (req.user as any).id },
      data: { name, phone, email },
      select: { id: true, name: true, phone: true, email: true, profile_photo_url: true }
    });
    user.profile_photo_url = getPublicUrl(user.profile_photo_url);
    res.json({ success: true, data: user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: { code: 'UNIQUE_CONSTRAINT', message: 'Phone or email already exists' } });
      return;
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } });
  }
});

router.post('/profile/photo', upload.single('image'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No image file provided' } });
    return;
  }
  const validation = validateFile(file.buffer, file.mimetype, file.size);
  if (!validation.valid) {
    res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
    return;
  }
  try {
    const filename = generateFilename(file.originalname, 'profile');
    const path = `users/${(req.user as any).id}/${filename}`;
    const uploadResult = await uploadFile('users', (req.user as any).id, filename, file.buffer, file.mimetype);
    
    const oldUser = await prisma.user.findUnique({ where: { id: (req.user as any).id }, select: { profile_photo_url: true } });
    if (oldUser?.profile_photo_url) {
      await deleteFile(oldUser.profile_photo_url);
    }
    
    await prisma.user.update({
      where: { id: (req.user as any).id },
      data: { profile_photo_url: uploadResult.path }
    });
    
    res.json({ success: true, data: { profile_photo_url: getPublicUrl(uploadResult.path) } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload photo' } });
  }
});

router.delete('/profile/photo', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req.user as any).id }, select: { profile_photo_url: true } });
    if (user?.profile_photo_url) {
      await deleteFile(user.profile_photo_url);
      await prisma.user.update({
        where: { id: (req.user as any).id },
        data: { profile_photo_url: null }
      });
    }
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete photo' } });
  }
});

// ─── PLATFORM CONFIG ────────────────────────────────────────────────────────

// GET /admin/config
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.adminConfig.findMany();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch config' } });
  }
});

router.get('/launch-status', async (_req: Request, res: Response) => {
  try {
    const [settings, todayStart] = await Promise.all([
      getLaunchDaySettings(),
      Promise.resolve(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })))
    ]);
    todayStart.setHours(0, 0, 0, 0);
    const statuses = ['pending', 'restaurant_confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;
    const counts = await Promise.all(statuses.map(status => prisma.order.count({ where: { status, created_at: { gte: todayStart } } })));
    res.json({
      success: true,
      data: {
        ...settings,
        realTimeSystemActive: true,
        todayOrders: counts.reduce((sum, value) => sum + value, 0),
        statusCounts: Object.fromEntries(statuses.map((status, index) => [status, counts[index]]))
      }
    });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load launch status' } });
  }
});

// PUT /admin/config
router.put('/config', async (req: Request, res: Response) => {
  const adminId = (req.user as any).id;
  const { configs } = req.body as { configs: Array<{ key: string, value: string, description?: string }> };
  
  if (!Array.isArray(configs)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'configs must be an array' } });
    return;
  }

  try {
    // Upsert each config
    const updated = await Promise.all(configs.map(c => 
      prisma.adminConfig.upsert({
        where: { key: c.key },
        update: { value: String(c.value), updated_by: adminId },
        create: { key: c.key, value: String(c.value), description: c.description || '', updated_by: adminId }
      })
    ));
    
    // Log it
    await prisma.adminAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'UPDATE_CONFIG',
        target_type: 'Platform',
        details: { keys_updated: configs.map(c => c.key) }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update config' } });
  }
});

// GET /admin/whatsapp-alerts - delivery audit trail for backup order alerts
router.get('/whatsapp-alerts', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  try {
    const [logs, total] = await Promise.all([
      prisma.whatsAppNotificationLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { order: { select: { id: true, created_at: true, restaurant: { select: { name: true } } } } }
      }),
      prisma.whatsAppNotificationLog.count()
    ]);
    res.json({ success: true, data: logs, total, page, limit });
  } catch (error) {
    console.error('WhatsApp alert logs error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch WhatsApp alert logs' } });
  }
});

// PUT /admin/whatsapp-alerts/recipients - comma-separated E.164 or Indian mobile numbers
router.put('/whatsapp-alerts/recipients', async (req: Request, res: Response) => {
  const recipients = req.body?.recipients;
  if (!Array.isArray(recipients) || recipients.length === 0 || recipients.some((phone: unknown) => !/^\+?\d{10,15}$/.test(String(phone)))) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'recipients must be non-empty mobile numbers' } });
    return;
  }
  try {
    const config = await prisma.adminConfig.upsert({
      where: { key: 'WHATSAPP_ALERT_RECIPIENTS' },
      update: { value: recipients.join(','), updated_by: (req.user as any).id },
      create: { key: 'WHATSAPP_ALERT_RECIPIENTS', value: recipients.join(','), description: 'Backup WhatsApp alert recipients', updated_by: (req.user as any).id }
    });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update WhatsApp recipients' } });
  }
});

// ─── PLATFORM METRICS ───────────────────────────────────────────────────────

// GET /admin/dashboard — platform metrics
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      totalDeliveryPartners,
      pendingDeliveryPartners,
      totalOrders,
      openComplaints,
      launchSettings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'active' } }),
      prisma.restaurant.count({ where: { status: 'pending' } }),
      prisma.deliveryPartner.count(),
      prisma.deliveryPartner.count({ where: { status: 'pending' } }),
      prisma.order.count(),
      prisma.supportTicket.count({ where: { status: 'open' } }),
      getLaunchDaySettings(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRestaurants,
        activeRestaurants,
        pendingRestaurants,
        totalDeliveryPartners,
        pendingDeliveryPartners,
        totalOrders,
        openComplaints,
        launchSettings,
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } });
  }
});

// GET /admin/users
router.get('/users', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ]
    } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: users, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } });
  }
});

// PATCH /admin/users/:id/block
router.patch('/users/:id/block', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { block } = req.body as { block: boolean };
  try {
    const user = await prisma.user.update({ where: { id }, data: { is_active: !block } });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user status' } });
  }
});

// GET /admin/restaurants
router.get('/restaurants', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = status ? { status: status as any } : {};
    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({ where, skip, take: parseInt(limit), include: { documents: true }, orderBy: { created_at: 'desc' } }),
      prisma.restaurant.count({ where }),
    ]);
    res.json({ success: true, data: restaurants, total });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
  }
});

// PATCH /admin/restaurants/:id/approve
router.patch('/restaurants/:id/approve', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        status: 'active', approval_status: 'approved', account_status: 'active',
        visibility_status: 'visible', operating_status: 'open', is_open: true,
        approved_by: (req.user as any).id, approved_at: new Date()
      }
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve restaurant' } });
  }
});

// PATCH /admin/restaurants/:id/reject
router.patch('/restaurants/:id/reject', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body as { reason: string };
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        status: 'rejected', approval_status: 'rejected', account_status: 'inactive',
        visibility_status: 'hidden', operating_status: 'closed', is_open: false,
        rejection_reason: reason || null
      }
    });
    res.json({ success: true, data: restaurant, reason });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject restaurant' } });
  }
});

// PATCH /admin/restaurants/:id/suspend
router.patch('/restaurants/:id/suspend', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        status: 'suspended', approval_status: 'suspended', account_status: 'inactive',
        visibility_status: 'hidden', operating_status: 'closed', is_open: false
      }
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to suspend restaurant' } });
  }
});

// GET /admin/delivery-partners
router.get('/delivery-partners', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = status ? { status: status as any } : {};
    const [partners, total] = await Promise.all([
      prisma.deliveryPartner.findMany({ where, skip, take: parseInt(limit), orderBy: { created_at: 'desc' } }),
      prisma.deliveryPartner.count({ where }),
    ]);
    res.json({ success: true, data: partners, total });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch delivery partners' } });
  }
});

// PATCH /admin/delivery-partners/:id/approve
router.patch('/delivery-partners/:id/approve', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const partner = await prisma.deliveryPartner.update({ where: { id }, data: { status: 'active' } });
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve partner' } });
  }
});

// PATCH /admin/delivery-partners/:id/reject
router.patch('/delivery-partners/:id/reject', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body as { reason: string };
  try {
    const partner = await prisma.deliveryPartner.update({ where: { id }, data: { status: 'rejected' } });
    res.json({ success: true, data: partner, reason });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject partner' } });
  }
});

// GET /admin/orders
router.get('/orders', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = status ? { status: status as any } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { customer: true, restaurant: true, order_items: { include: { menu_item: true } } },
        orderBy: { created_at: 'desc' }
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, data: orders, total });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
  }
});

// GET /admin/support
router.get('/support', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = status ? { status: status as any } : {};
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { customer: true, order: true },
        orderBy: { created_at: 'desc' }
      }),
      prisma.supportTicket.count({ where }),
    ]);
    res.json({ success: true, data: tickets, total });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch support tickets' } });
  }
});

// PATCH /admin/support/:id/resolve
router.patch('/support/:id/resolve', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { resolution_notes, issue_refund } = req.body;
  
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution_notes
      },
      include: { order: true }
    });

    // Handle True Refund if requested
    if (issue_refund && ticket.order_id) {
      if (ticket.order?.payment_status === 'success' && ticket.order?.razorpay_payment_id) {
        
        // Mark order as cancelled and queue the refund
        await prisma.order.update({
          where: { id: ticket.order_id },
          data: { status: 'cancelled', cancelled_by: 'admin', cancellation_reason: resolution_notes || 'Admin support refund' }
        });

        await refundQueue.add('refund-order', { orderId: ticket.order_id, reason: resolution_notes || 'Admin support refund' });

        await prisma.adminAuditLog.create({
          data: {
            admin_id: (req.user as any).id,
            action: 'REFUND_QUEUED',
            target_type: 'Order',
            target_id: ticket.order_id,
            details: { amount: Number(ticket.order.total_amount), reason: resolution_notes }
          }
        });
        
      } else {
        // Just cancel if not paid online
        await prisma.order.update({
          where: { id: ticket.order_id },
          data: { status: 'cancelled' }
        });

        await prisma.adminAuditLog.create({
          data: {
            admin_id: (req.user as any).id,
            action: 'ORDER_CANCELLED',
            target_type: 'Order',
            target_id: ticket.order_id,
            details: { reason: resolution_notes }
          }
        });
      }
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve ticket' } });
  }
});

// GET /admin/audit-logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const action = req.query.action as string | undefined;

  try {
    const where = action ? { action } : {};
    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { admin: { select: { name: true, email: true } } },
        orderBy: { created_at: 'desc' }
      }),
      prisma.adminAuditLog.count({ where })
    ]);
    res.json({ success: true, data: logs, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs' } });
  }
});

// ─── PAYOUTS ─────────────────────────────────────────────────────────────────

// GET /admin/payouts
router.get('/payouts', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '20';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = status ? { payout_status: status as any } : {};
    const [assignments, total] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { partner: true, order: true },
        orderBy: { assigned_at: 'desc' }
      }),
      prisma.deliveryAssignment.count({ where }),
    ]);
    res.json({ success: true, data: assignments, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payouts' } });
  }
});

// POST /admin/payouts/:id/retry — retry a failed payout
router.post('/payouts/:id/retry', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id: id as string },
      include: { partner: true }
    });

    if (!assignment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
    if (assignment.payout_status === 'success') return res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Payout already processed' } });

    // Reset status and re-enqueue
    await prisma.deliveryAssignment.update({
      where: { id: id as string },
      data: { payout_status: 'pending', payout_reference_id: null, payout_failure_reason: null }
    });

    const { payoutQueue } = await import('../jobs/queues.js');
    await payoutQueue.add('delivery-payout', { assignment_id: id }, {
      jobId: `payout-retry-${id}-${Date.now()}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    await prisma.adminAuditLog.create({
      data: {
        admin_id: (req.user as any).id,
        action: 'PAYOUT_RETRY',
        target_type: 'DeliveryAssignment',
        target_id: String(id),
        details: { partner_id: assignment.partner_id }
      }
    });

    res.json({ success: true, message: 'Payout retry queued successfully' });
  } catch (error) {
    console.error('Payout retry error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retry payout' } });
  }
});

export default router;
