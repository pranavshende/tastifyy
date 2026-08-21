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

router.use(authenticate, authorizeRole(['customer']));

router.use(authenticate, authorizeRole(['customer']));

// ─── PROFILE ROUTES ─────────────────────────────────────────────────────────

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).id },
      select: { id: true, name: true, phone: true, email: true, profile_photo_url: true, dob: true }
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
  const { name, phone, email, dob } = req.body;
  if (!name || !phone) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
    return;
  }
  try {
    const user = await prisma.user.update({
      where: { id: (req.user as any).id },
      data: { name, phone, email, dob: dob ? new Date(dob) : null },
      select: { id: true, name: true, phone: true, email: true, profile_photo_url: true, dob: true }
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
    
    // Check old photo and delete if exists
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

// ─── RESTAURANT & MENU ROUTES ───────────────────────────────────────────────

// GET /api/customer/restaurants
// Fetch all active restaurants. MVP: no complex geofencing, just return active ones.
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        type: true,
        address_line: true,
        city: true,
        cover_image_url: true,
        logo_url: true,
        is_pure_veg: true,
        cuisine_tags: true,
        avg_preparation_time_mins: true,
        is_open: true,
      },
      orderBy: { created_at: 'desc' }
    });
    const result = restaurants.map(r => ({
      ...r,
      logo_url: getPublicUrl(r.logo_url),
      cover_image_url: getPublicUrl(r.cover_image_url),
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurants' } });
  }
});

// GET /api/customer/restaurants/:id/menu
// Fetch restaurant details and its active menu items, grouped by category
router.get('/restaurants/:id/menu', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id, status: 'active' },
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        is_pure_veg: true,
        cuisine_tags: true,
        avg_preparation_time_mins: true,
        cover_image_url: true,
        logo_url: true,
        is_open: true,
      }
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found or inactive' } });
      return;
    }

    const categories = await prisma.menuCategory.findMany({
      where: { restaurant_id: id, is_active: true },
      orderBy: { display_order: 'asc' },
      include: {
        menu_items: {
          where: { is_available: true },
          orderBy: { name: 'asc' },
          include: {
            customizations: {
              include: { options: true }
            }
          }
        }
      }
    });

    // Filter out empty categories for the customer view
    const filteredCategories = categories.filter((cat: any) => cat.menu_items && cat.menu_items.length > 0).map((cat: any) => ({
      ...cat,
      menu_items: cat.menu_items.map((item: any) => ({
        ...item,
        image_url: getPublicUrl(item.image_url),
      }))
    }));

    const formattedRestaurant = {
      ...restaurant,
      logo_url: getPublicUrl(restaurant.logo_url),
      cover_image_url: getPublicUrl(restaurant.cover_image_url),
    };

    res.json({ success: true, data: { restaurant: formattedRestaurant, menu: filteredCategories } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu' } });
  }
});

export default router;
