import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';
import { getIO } from '../socket.js';
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

// ─── PROFILE ROUTES ─────────────────────────────────────────────────────────

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const partner = await getPartner((req.user as any).id);
    if (!partner) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Partner not found' } });
      return;
    }
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
    const partner = await getPartner((req.user as any).id);
    if (!partner) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

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
        status: { in: ['ready', 'out_for_delivery'] }
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
        data: { delivery_partner_id: partnerId }
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

export default router;
