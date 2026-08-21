import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';
import type { Request, Response } from 'express';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorizeRole(['admin']));

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
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'active' } }),
      prisma.restaurant.count({ where: { status: 'pending' } }),
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
    const restaurant = await prisma.restaurant.update({ where: { id }, data: { status: 'active' } });
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
    const restaurant = await prisma.restaurant.update({ where: { id }, data: { status: 'rejected' } });
    res.json({ success: true, data: restaurant, reason });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject restaurant' } });
  }
});

// PATCH /admin/restaurants/:id/suspend
router.patch('/restaurants/:id/suspend', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const restaurant = await prisma.restaurant.update({ where: { id }, data: { status: 'suspended' } });
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

    // Handle Mock Refund if requested
    if (issue_refund && ticket.order_id) {
      await prisma.order.update({
        where: { id: ticket.order_id },
        data: { status: 'cancelled', payment_status: 'refunded' }
      });
      // Optionally notify user via socket
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve ticket' } });
  }
});

export default router;
