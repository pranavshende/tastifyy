import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';
import type { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { refundQueue } from '../jobs/queues.js';
import { notificationQueue } from '../jobs/queues.js';
import { findRestaurantUserByRestaurantId } from '../utils/restaurantPartner.js';

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

router.patch('/restaurants/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['pending', 'active', 'suspended', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  try {
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: { status }
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

// ─── PLATFORM METRICS ───────────────────────────────────────────────────────

// GET /admin/dashboard — platform metrics
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      rejectedRestaurants,
      suspendedRestaurants,
      totalDeliveryPartners,
      pendingDeliveryPartners,
      totalOrders,
      openComplaints,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { approval_status: 'approved' } }),
      prisma.restaurant.count({ where: { approval_status: 'pending' } }),
      prisma.restaurant.count({ where: { approval_status: 'rejected' } }),
      prisma.restaurant.count({ where: { approval_status: 'suspended' } }),
      prisma.deliveryPartner.count(),
      prisma.deliveryPartner.count({ where: { status: 'pending' } }),
      prisma.order.count(),
      prisma.supportTicket.count({ where: { status: 'open' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRestaurants,
        activeRestaurants,
        pendingRestaurants,
        rejectedRestaurants,
        suspendedRestaurants,
        totalDeliveryPartners,
        pendingDeliveryPartners,
        totalOrders,
        openComplaints,
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
    const approvalStatus = status === 'active' ? 'approved' : status;
    const where = approvalStatus ? { approval_status: approvalStatus as any } : {};
    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({ where, skip, take: parseInt(limit), include: { documents: true }, orderBy: { created_at: 'desc' } }),
      prisma.restaurant.count({ where }),
    ]);
    res.json({ success: true, data: restaurants, total });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
  }
});

router.get('/restaurant-location-requests', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  try {
    const requests = await prisma.restaurantLocationChangeRequest.findMany({
      where: status ? { status: status as any } : {},
      include: { restaurant: { select: { id: true, name: true, address_line: true, city: true, state: true, latitude: true, longitude: true, formatted_address: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch location requests' } });
  }
});

router.patch('/restaurant-location-requests/:requestId/approve', async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;
  try {
    const pendingRequest = await prisma.restaurantLocationChangeRequest.findUnique({ where: { id: requestId }, select: { restaurant_id: true } });
    const request = await prisma.restaurantLocationChangeRequest.updateMany({
      where: { id: requestId, status: 'pending' },
      data: { status: 'approved', reviewed_by: (req.user as any).id, reviewed_at: new Date(), review_notes: req.body.notes || null },
    });
    if (!request.count) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pending location request not found' } });
      return;
    }
    const partner = pendingRequest ? await findRestaurantUserByRestaurantId(pendingRequest.restaurant_id) : null;
    if (partner) await notificationQueue.add('notify', { type: 'both', userId: partner.id, userRole: 'restaurant_partner', title: 'Location change approved', body: 'Your restaurant location change was approved. Set the new location from your profile.', data: { event: 'location_change_approved', restaurant_id: pendingRequest?.restaurant_id } });
    res.json({ success: true, message: 'Location change approved' });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve location request' } });
  }
});

router.patch('/restaurant-location-requests/:requestId/reject', async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;
  const notes = req.body.notes as string | undefined;
  if (!notes) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  try {
    const pendingRequest = await prisma.restaurantLocationChangeRequest.findUnique({ where: { id: requestId }, select: { restaurant_id: true } });
    const request = await prisma.restaurantLocationChangeRequest.updateMany({
      where: { id: requestId, status: 'pending' },
      data: { status: 'rejected', reviewed_by: (req.user as any).id, reviewed_at: new Date(), review_notes: notes },
    });
    if (!request.count) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pending location request not found' } });
      return;
    }
    const partner = pendingRequest ? await findRestaurantUserByRestaurantId(pendingRequest.restaurant_id) : null;
    if (partner) await notificationQueue.add('notify', { type: 'both', userId: partner.id, userRole: 'restaurant_partner', title: 'Location change rejected', body: notes, data: { event: 'location_change_rejected', restaurant_id: pendingRequest?.restaurant_id } });
    res.json({ success: true, message: 'Location change rejected' });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject location request' } });
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
        visibility_status: 'visible', approved_by: (req.user as any).id, approved_at: new Date(),
      }
    });
    const partner = await findRestaurantUserByRestaurantId(id);
    if (partner) await notificationQueue.add('notify', {
      type: 'both', userId: partner.id, userRole: 'restaurant_partner',
      title: 'Restaurant approved', body: 'Your restaurant has been approved on Tastifyy.',
      data: { restaurant_id: id, event: 'restaurant_approved' }
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
  if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id }, data: {
        status: 'rejected', approval_status: 'rejected', account_status: 'inactive',
        visibility_status: 'hidden', rejection_reason: reason,
      }
    });
    const partner = await findRestaurantUserByRestaurantId(id);
    if (partner) await notificationQueue.add('notify', {
      type: 'both', userId: partner.id, userRole: 'restaurant_partner',
      title: 'Restaurant application not approved', body: reason,
      data: { restaurant_id: id, event: 'restaurant_rejected' }
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject restaurant' } });
  }
});

// PATCH /admin/restaurants/:id/suspend
router.patch('/restaurants/:id/suspend', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body as { reason?: string };
  try {
    const restaurant = await prisma.restaurant.update({ where: { id }, data: {
      status: 'suspended', approval_status: 'suspended', account_status: 'inactive', visibility_status: 'hidden',
      rejection_reason: reason || undefined,
    } });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to suspend restaurant' } });
  }
});

router.patch('/restaurants/:id/activate', async (req: Request, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.update({ where: { id: req.params.id as string }, data: {
      account_status: 'active', status: 'active'
    } });
    res.json({ success: true, data: restaurant });
  } catch { res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to activate restaurant' } }); }
});

router.patch('/restaurants/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.update({ where: { id: req.params.id as string }, data: {
      account_status: 'inactive', status: 'active'
    } });
    res.json({ success: true, data: restaurant });
  } catch { res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate restaurant' } }); }
});

router.patch('/restaurants/:id/visibility', async (req: Request, res: Response) => {
  const { visible } = req.body as { visible?: boolean };
  if (visible === undefined) return res.status(400).json({ success: false, message: 'visible is required' });
  try {
    const restaurant = await prisma.restaurant.update({ where: { id: req.params.id as string }, data: {
      visibility_status: visible ? 'visible' : 'hidden'
    } });
    res.json({ success: true, data: restaurant });
  } catch { res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update visibility' } }); }
});

router.patch('/restaurants/:id/request-changes', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { notes } = req.body as { notes?: string };
  if (!notes) return res.status(400).json({ success: false, message: 'Requested changes are required' });
  try {
    const restaurant = await prisma.restaurant.update({ where: { id }, data: {
      status: 'pending', approval_status: 'changes_required', account_status: 'inactive',
      visibility_status: 'hidden', admin_notes: notes,
    } });
    const partner = await findRestaurantUserByRestaurantId(id);
    if (partner) await notificationQueue.add('notify', {
      type: 'both', userId: partner.id, userRole: 'restaurant_partner',
      title: 'Changes required for approval', body: notes,
      data: { restaurant_id: id, event: 'restaurant_changes_required' }
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to request changes' } });
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
