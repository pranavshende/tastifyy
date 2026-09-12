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

// ─── ADDRESS ROUTES ───────────────────────────────────────────────────────────

router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const user_id = (req.user as any).id;
    const addresses = await prisma.address.findMany({
      where: { user_id, is_deleted: false },
      orderBy: [
        { is_default: 'desc' },
        { created_at: 'desc' }
      ]
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch addresses' } });
  }
});

router.post('/addresses', async (req: Request, res: Response) => {
  const { label, address_line, city, state, pincode, is_default, latitude, longitude } = req.body;
  
  if (!address_line || !city || !state || !pincode) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required address fields' } });
    return;
  }
  
  try {
    const user_id = (req.user as any).id;
    
    // If setting as default, unset others
    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id },
        data: { is_default: false }
      });
    }
    
    // If it's the first address, make it default automatically
    const count = await prisma.address.count({ where: { user_id } });
    const shouldBeDefault = is_default || count === 0;

    const address = await prisma.address.create({
      data: {
        user_id,
        label: (label ? label.toLowerCase() : 'home') as any,
        address_line,
        city,
        state,
        pincode,
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
        is_default: shouldBeDefault
      }
    });
    
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create address' } });
  }
});

router.delete('/addresses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = (req.user as any).id;
  
  try {
    const address = await prisma.address.findFirst({
      where: { id: id as string, user_id, is_deleted: false }
    });
    
    if (!address) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
      return;
    }
    
    await prisma.address.update({
      where: { id: id as string },
      data: { is_deleted: true }
    });
    
    // If we deleted the default, set another one as default if it exists
    if (address.is_default) {
      const nextAddress = await prisma.address.findFirst({
        where: { user_id, is_deleted: false }
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { is_default: true }
        });
      }
    }
    
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete address' } });
  }
});

router.patch('/addresses/:id/default', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = (req.user as any).id;
  
  try {
    const address = await prisma.address.findFirst({
      where: { id: id as string, user_id, is_deleted: false }
    });
    
    if (!address) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Address not found' } });
      return;
    }
    
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { user_id },
        data: { is_default: false }
      }),
      prisma.address.update({
        where: { id: id as string },
        data: { is_default: true }
      })
    ]);
    
    res.json({ success: true, message: 'Default address updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to set default address' } });
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
        ratings: { select: { restaurant_rating: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    const result = restaurants.map(r => {
      let rating = 0;
      if (r.ratings && r.ratings.length > 0) {
        const sum = r.ratings.reduce((acc, curr) => acc + curr.restaurant_rating, 0);
        rating = Number((sum / r.ratings.length).toFixed(1));
      }
      
      const { ratings, ...rest } = r;

      return {
        ...rest,
        rating,
        logo_url: getPublicUrl(r.logo_url),
        cover_image_url: getPublicUrl(r.cover_image_url),
      };
    });
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
        ratings: { select: { restaurant_rating: true } }
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

    let rating = 0;
    if (restaurant.ratings && restaurant.ratings.length > 0) {
      const sum = restaurant.ratings.reduce((acc, curr) => acc + curr.restaurant_rating, 0);
      rating = Number((sum / restaurant.ratings.length).toFixed(1));
    }
    const { ratings, ...restRestaurant } = restaurant;

    const formattedRestaurant = {
      ...restRestaurant,
      rating,
      logo_url: getPublicUrl(restaurant.logo_url),
      cover_image_url: getPublicUrl(restaurant.cover_image_url),
    };

    res.json({ success: true, data: { restaurant: formattedRestaurant, menu: filteredCategories } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu' } });
  }
});

export default router;
