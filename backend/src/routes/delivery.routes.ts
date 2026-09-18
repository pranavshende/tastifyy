import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';
import { getIO } from '../socket.js';
import { assignmentQueue } from '../jobs/queues.js';
import { getPublicUrl, uploadFile, deleteFile, validateFile, generateFilename } from '../services/storage.service.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(authenticate, authorizeRole(['delivery_partner']));

// Helper to get partner
const getPartner = async (userId: string) => {
  return await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
};

const getOrCreatePartner = async (user: any) => {
  const existing = await getPartner(user.id);
  if (existing) return existing;

  return await prisma.deliveryPartner.create({
    data: {
      user_id: user.id,
      name: user.name || 'Delivery Partner',
      phone: user.phone,
      email: user.email || null,
    },
  });
};

// ─── PROFILE ROUTES ─────────────────────────────────────────────────────────

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const partner = await getOrCreatePartner(req.user as any);
    partner.profile_photo_url = getPublicUrl(partner.profile_photo_url);
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  const { name, phone, email, vehicle_type, vehicle_number, bank_account_number, ifsc_code, upi_id } = req.body;
  if (!name || !phone) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
    return;
  }
  try {
    const partner = await getOrCreatePartner(req.user as any);

    // Update User as well to keep in sync
    await prisma.user.update({
      where: { id: (req.user as any).id },
      data: { name, phone, email }
    });

    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { name, phone, email, vehicle_type, vehicle_number, bank_account_number, ifsc_code, upi_id }
    });
    
    updated.profile_photo_url = getPublicUrl(updated.profile_photo_url);
    res.json({ success: true, data: updated });
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
    const partner = await getPartner((req.user as any).id);
    if (!partner) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

    const filename = generateFilename(file.originalname, 'profile');
    const path = `delivery/${partner.id}/${filename}`;
    const uploadResult = await uploadFile('delivery', partner.id, filename, file.buffer, file.mimetype);
    
    if (partner.profile_photo_url) {
      await deleteFile(partner.profile_photo_url);
    }
    
    await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { profile_photo_url: uploadResult.path }
    });
    
    res.json({ success: true, data: { profile_photo_url: getPublicUrl(uploadResult.path) } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload photo' } });
  }
});

router.delete('/profile/photo', async (req: Request, res: Response) => {
  try {
    const partner = await getPartner((req.user as any).id);
    if (partner?.profile_photo_url) {
      await deleteFile(partner.profile_photo_url);
      await prisma.deliveryPartner.update({
        where: { id: partner.id },
        data: { profile_photo_url: null }
      });
    }
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete photo' } });
  }
});

// ─── LOCATION ROUTES ──────────────────────────────────────────────────────────

// POST /delivery/location — update current coordinates
router.post('/location', async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Latitude and longitude required' } });
    return;
  }
  
  try {
    const partner = await getPartner((req.user as any).id);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });

    await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        current_latitude: latitude,
        current_longitude: longitude,
        is_online: true // optionally auto-set them online if they ping location
      }
    });

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['restaurant_confirmed', 'preparing', 'ready'] },
        delivery_partner_id: null,
      },
      select: { id: true },
      take: 20,
    });
    for (const order of pendingOrders) {
      await assignmentQueue.add('assign-partner', { orderId: order.id });
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update location' } });
  }
});

// ─── ORDER ROUTES ───────────────────────────────────────────────────────────

// GET /delivery/orders/available — fetch orders needing a rider
router.get('/orders/available', async (req: Request, res: Response) => {
  try {
    const partner = await getPartner((req.user as any).id);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
    const partnerId = partner.id;

    const orders = await prisma.order.findMany({
      where: { 
        status: { in: ['restaurant_confirmed', 'preparing', 'ready'] },
        delivery_partner_id: null 
      },
      include: {
        restaurant: { select: { name: true, address_line: true, city: true, phone: true } },
        delivery_address: true,
      },
      orderBy: { created_at: 'asc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch available orders' } });
  }
});

// GET /delivery/orders/active — fetch my currently assigned active order
router.get('/orders/active', async (req: Request, res: Response) => {
  try {
    const partner = await getPartner((req.user as any).id);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
    const partnerId = partner.id;

    const order = await prisma.order.findFirst({
      where: {
        delivery_partner_id: partnerId,
        status: { in: ['restaurant_confirmed', 'preparing', 'ready', 'out_for_delivery'] }
      },
      include: {
        restaurant: { select: { name: true, address_line: true, city: true, phone: true } },
        delivery_address: true,
        customer: { select: { name: true, phone: true } }
      }
    });
    res.json({ success: true, data: order }); // order can be null
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch active order' } });
  }
});

// POST /delivery/orders/:id/accept — accept an available order
router.post('/orders/:id/accept', async (req: Request, res: Response) => {
  try {
    const partner = await getPartner((req.user as any).id);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
    const partnerId = partner.id;

    const id = req.params.id as string;

    // Ensure it's not already assigned
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.delivery_partner_id) {
      return res.status(400).json({ success: false, error: { code: 'UNAVAILABLE', message: 'Order is no longer available' } });
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { delivery_partner_id: partnerId, status: 'out_for_delivery' }
      }),
      prisma.deliveryAssignment.create({
        data: {
          order_id: id,
          partner_id: partnerId,
          status: 'accepted',
          earning_amount: 30.00, // MVP flat earning
          pickup_distance_km: 2.5,
          delivery_distance_km: 4.2
        }
      })
    ]);

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept order' } });
  }
});

// PATCH /delivery/orders/:id/status — update active order status
router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, otp } = req.body;
    const id = req.params.id as string;
    const partner = await getPartner((req.user as any).id);
    
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a delivery partner' } });
    
    // Ensure the order is assigned to this partner
    const order = await prisma.order.findFirst({
      where: { id, delivery_partner_id: partner.id }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found or not assigned to you' } });
    }

    if (status === 'delivered') {
      if (!otp || String(otp) !== order.delivery_otp) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'Invalid or missing delivery OTP' } });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    // If delivered, update assignment status
    if (status === 'delivered') {
      await prisma.deliveryAssignment.update({
        where: { order_id: id },
        data: { status: 'delivered' }
      });
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update order status' } });
  }
});

// PATCH /delivery/status — toggle online/offline
router.patch('/status', async (req: Request, res: Response) => {
  const user = req.user as any;
  const { is_online } = req.body as { is_online: boolean };
  try {
    const partner = await prisma.deliveryPartner.update({
      where: { user_id: user.id },
      data: { is_online }
    });
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update availability status' } });
  }
});

// GET /delivery/dashboard — partner home stats
router.get('/dashboard', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { user_id: user.id } });
    if (!partner) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery partner profile not found' } });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeliveries, todayEarnings] = await Promise.all([
      prisma.deliveryAssignment.count({
        where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: today } }
      }),
      prisma.deliveryAssignment.aggregate({
        where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: today } },
        _sum: { earning_amount: true }
      }),
    ]);

    res.json({
      success: true,
      data: {
        is_online: partner.is_online,
        status: partner.status,
        today_deliveries: todayDeliveries,
        today_earnings: todayEarnings._sum.earning_amount || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard' } });
  }
});

// GET /delivery/earnings — aggregated earnings summary
router.get('/earnings', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await getPartner(user.id);
    if (!partner) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayAgg, weekAgg, monthAgg, totalAgg, recentAssignments] = await Promise.all([
      prisma.deliveryAssignment.aggregate({
        where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: todayStart } },
        _sum: { earning_amount: true }, _count: true
      }),
      prisma.deliveryAssignment.aggregate({
        where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: sevenDaysAgo } },
        _sum: { earning_amount: true }, _count: true
      }),
      prisma.deliveryAssignment.aggregate({
        where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: thirtyDaysAgo } },
        _sum: { earning_amount: true }, _count: true
      }),
      prisma.deliveryAssignment.aggregate({
        where: { partner_id: partner.id, status: 'delivered' },
        _sum: { earning_amount: true }, _count: true
      }),
      prisma.deliveryAssignment.findMany({
        where: { partner_id: partner.id, status: 'delivered', updated_at: { gte: sevenDaysAgo } },
        select: { earning_amount: true, updated_at: true },
        orderBy: { updated_at: 'asc' }
      })
    ]);

    const dailyData: Record<string, { earnings: number; deliveries: number }> = {};
    for (let i = 0; i <= 6; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      dailyData[d.toISOString().split('T')[0] as string] = { earnings: 0, deliveries: 0 };
    }
    recentAssignments.forEach(a => {
      const dateStr = new Date(a.updated_at).toISOString().split('T')[0] as string;
      if (dailyData[dateStr]) {
        dailyData[dateStr].earnings += Number(a.earning_amount || 0);
        dailyData[dateStr].deliveries += 1;
      }
    });

    res.json({
      success: true,
      data: {
        today: { earnings: Number(todayAgg._sum.earning_amount || 0), deliveries: todayAgg._count },
        week: { earnings: Number(weekAgg._sum.earning_amount || 0), deliveries: weekAgg._count },
        month: { earnings: Number(monthAgg._sum.earning_amount || 0), deliveries: monthAgg._count },
        allTime: { earnings: Number(totalAgg._sum.earning_amount || 0), deliveries: totalAgg._count },
        chartData: Object.keys(dailyData).sort().map(date => ({ date, ...dailyData[date] }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch earnings' } });
  }
});

// GET /delivery/orders/history — completed deliveries
router.get('/orders/history', async (req: Request, res: Response) => {
  const user = req.user as any;
  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');
  try {
    const partner = await getPartner(user.id);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });

    const [assignments, total] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where: { partner_id: partner.id, status: 'delivered' },
        include: {
          order: {
            include: {
              restaurant: { select: { name: true, city: true } },
              delivery_address: { select: { address_line: true, city: true } }
            }
          }
        },
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.deliveryAssignment.count({ where: { partner_id: partner.id, status: 'delivered' } })
    ]);

    res.json({ success: true, data: assignments, total, page });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch history' } });
  }
});

export default router;
