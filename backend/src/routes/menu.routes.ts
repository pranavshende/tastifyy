import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { uploadFile, deleteFile, validateFile, generateFilename, getPublicUrl } from '../services/storage.service.js';
import { findRestaurantPartner } from '../utils/restaurantPartner.js';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// Menu routes are for restaurant_partners only
router.use(authenticate, authorizeRole(['restaurant_partner']));

// Multer — memory storage for Supabase pipe
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware to extract restaurant_id for the logged-in partner
const attachRestaurantId = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  try {
    const partner = await findRestaurantPartner(user);
    
    if (!partner || !partner.restaurant) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No active restaurant found for this user' } });
      return;
    }
    
    // Attach restaurant_id to request
    (req as any).restaurant_id = partner.restaurant.id;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify restaurant access' } });
  }
};

router.use(attachRestaurantId);

// ─── HELPER ──────────────────────────────────────────────────────────────────

function formatItemWithUrl(item: any) {
  return {
    ...item,
    image_url: getPublicUrl(item.image_url),
  };
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

// GET /api/menu/info — returns restaurant info for the logged-in partner
router.get('/info', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurant_id },
      select: {
        id: true, name: true, status: true, is_open: true,
        logo_url: true, cover_image_url: true,
        phone: true, email: true, address_line: true,
        city: true, state: true, pincode: true,
        cuisine_tags: true, type: true, is_pure_veg: true,
        avg_preparation_time_mins: true, service_radius_km: true,
      }
    });
    if (!restaurant) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
      return;
    }
    const result = {
      ...restaurant,
      logo_url: getPublicUrl(restaurant.logo_url),
      cover_image_url: getPublicUrl(restaurant.cover_image_url),
    };
    res.json({ success: true, data: { restaurant_id, restaurant: result } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch restaurant info' } });
  }
});

// GET /api/menu/categories
router.get('/categories', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurant_id },
      orderBy: { display_order: 'asc' },
      include: { menu_items: { where: { is_deleted: false }, orderBy: { name: 'asc' } } }
    });
    // Convert image paths to public URLs
    const result = categories.map(cat => ({
      ...cat,
      menu_items: cat.menu_items.map(formatItemWithUrl),
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } });
  }
});

// POST /api/menu/categories
router.post('/categories', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { name, display_order } = req.body;
  try {
    const category = await prisma.menuCategory.create({
      data: { restaurant_id, name, display_order: display_order || 0 }
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to create category' } });
  }
});

// PUT /api/menu/categories/:id
router.put('/categories/:id', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  const { name, display_order, is_active } = req.body;
  try {
    const existing = await prisma.menuCategory.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    const category = await prisma.menuCategory.update({
      where: { id: id as string },
      data: { name, display_order, is_active }
    });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } });
  }
});

// DELETE /api/menu/categories/:id
router.delete('/categories/:id', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  try {
    const existing = await prisma.menuCategory.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }
    
    const itemsCount = await prisma.menuItem.count({ where: { category_id: id as string } });
    if (itemsCount > 0) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Cannot delete category with items' } });
      return;
    }

    await prisma.menuCategory.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } });
  }
});

// ─── MENU ITEMS ──────────────────────────────────────────────────────────────

// GET /api/menu/items
router.get('/items', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurant_id, is_deleted: false },
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: items.map(formatItemWithUrl) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch items' } });
  }
});

// POST /api/menu/items — multipart form with optional image
router.post('/items', upload.single('image'), async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { category_id, name, description, price, is_veg, is_available, preparation_time_mins, stock_quantity } = req.body;
  const file = req.file;

  try {
    // Verify category belongs to restaurant
    const category = await prisma.menuCategory.findFirst({ where: { id: category_id, restaurant_id } });
    if (!category) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    let imagePath: string | undefined = undefined;

    if (file) {
      const validation = validateFile(file.buffer, file.mimetype, file.size);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
        return;
      }
      // We need the item ID for the folder, so create item first then update
    }

    const createData: any = {
      name,
      description: description || undefined,
      price: parseFloat(price),
      is_veg: is_veg === 'true' || is_veg === true,
      is_available: is_available !== undefined ? (is_available === 'true' || is_available === true) : true,
      restaurant: { connect: { id: restaurant_id } },
      category: { connect: { id: category_id } },
    };
    if (preparation_time_mins) createData.preparation_time_mins = parseInt(preparation_time_mins);
    if (stock_quantity !== undefined && stock_quantity !== '') {
      createData.stock_quantity = parseInt(stock_quantity);
    } else {
      createData.stock_quantity = null;
    }

    const item = await prisma.menuItem.create({ data: createData });

    // Now upload image if provided, using item.id in path
    if (file) {
      const validation = validateFile(file.buffer, file.mimetype, file.size);
      if (validation.valid) {
        const filename = generateFilename(file.originalname, 'dish');
        const { path } = await uploadFile(restaurant_id, 'menu', `${item.id}/${filename}`, file.buffer, file.mimetype);
        imagePath = path;
        await prisma.menuItem.update({ where: { id: item.id }, data: { image_url: imagePath } });
        item.image_url = imagePath;
      }
    }

    res.status(201).json({ success: true, data: formatItemWithUrl(item) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create item' } });
  }
});

// PUT /api/menu/items/:id — multipart with optional image
router.put('/items/:id', upload.single('image'), async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  const { category_id, name, description, price, is_veg, is_available, preparation_time_mins, stock_quantity } = req.body;
  const file = req.file;

  try {
    const existing = await prisma.menuItem.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }

    if (category_id !== undefined) {
      const category = await prisma.menuCategory.findFirst({ where: { id: category_id, restaurant_id } });
      if (!category) {
        res.status(400).json({ success: false, error: { code: 'INVALID_CATEGORY', message: 'Category does not belong to this restaurant' } });
        return;
      }
    }

    let imagePath = existing.image_url;

    if (file) {
      const validation = validateFile(file.buffer, file.mimetype, file.size);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: validation.error } });
        return;
      }
      // Delete old image
      if (existing.image_url) {
        await deleteFile(existing.image_url);
      }
      const filename = generateFilename(file.originalname, 'dish');
      const { path } = await uploadFile(restaurant_id, 'menu', `${id}/${filename}`, file.buffer, file.mimetype);
      imagePath = path;
    }

    const updateData: any = {
      ...(category_id !== undefined && { category_id }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(is_veg !== undefined && { is_veg: is_veg === 'true' || is_veg === true }),
      ...(is_available !== undefined && { is_available: is_available === 'true' || is_available === true }),
      ...(preparation_time_mins !== undefined && { preparation_time_mins: parseInt(preparation_time_mins) }),
      image_url: imagePath,
    };

    if (stock_quantity !== undefined) {
      updateData.stock_quantity = stock_quantity === '' ? null : parseInt(stock_quantity);
    }

    const item = await prisma.menuItem.update({
      where: { id: id as string },
      data: updateData
    });
    res.json({ success: true, data: formatItemWithUrl(item) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update item' } });
  }
});

// DELETE /api/menu/items/:id/image — delete just the image
router.delete('/items/:id/image', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  try {
    const existing = await prisma.menuItem.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }
    if (existing.image_url) {
      await deleteFile(existing.image_url);
    }
    const item = await prisma.menuItem.update({ where: { id: id as string }, data: { image_url: null } });
    res.json({ success: true, data: formatItemWithUrl(item) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete image' } });
  }
});

// PATCH /api/menu/items/:id/status
router.patch('/items/:id/status', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  const { is_available } = req.body;
  try {
    const existing = await prisma.menuItem.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }

    const item = await prisma.menuItem.update({
      where: { id: id as string },
      data: { is_available }
    });
    res.json({ success: true, data: formatItemWithUrl(item) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update item status' } });
  }
});

// DELETE /api/menu/items/:id
router.delete('/items/:id', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  try {
    const existing = await prisma.menuItem.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }

    // Delete storage image
    if (existing.image_url) {
      await deleteFile(existing.image_url);
    }

    await prisma.menuItem.update({
      where: { id: id as string },
      data: { is_deleted: true }
    });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete item' } });
  }
});

// ─── DUPLICATE ITEM ───────────────────────────────────────────────────────────

// POST /api/menu/items/:id/duplicate — quickly clone a menu item
router.post('/items/:id/duplicate', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  try {
    const existing = await prisma.menuItem.findFirst({
      where: { id: id as string, restaurant_id: restaurant_id as string },
      include: { customizations: { include: { options: true } } }
    });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }

    const { id: _, created_at, updated_at, customizations, ...itemData } = existing as any;
    const newItem = await prisma.menuItem.create({
      data: {
        ...itemData,
        name: `${existing.name} (Copy)`,
        image_url: null, // Don't duplicate the image path — it's shared storage
      }
    });

    // Duplicate customizations/variants
    for (const group of customizations) {
      const { id: gId, menu_item_id, options, ...groupData } = group;
      const newGroup = await prisma.menuItemCustomization.create({
        data: { ...groupData, menu_item_id: newItem.id }
      });
      for (const opt of options) {
        const { id: oId, customization_id, ...optData } = opt;
        await prisma.menuItemCustomizationOption.create({
          data: { ...optData, customization_id: newGroup.id }
        });
      }
    }

    res.status(201).json({ success: true, data: formatItemWithUrl(newItem) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to duplicate item' } });
  }
});

// ─── VARIANTS ─────────────────────────────────────────────────────────────────

// GET /api/menu/items/:id/variants
router.get('/items/:id/variants', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  try {
    const item = await prisma.menuItem.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!item) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }
    const variants = await prisma.menuItemCustomization.findMany({
      where: { menu_item_id: id as string, variant_group: true },
      include: { options: { orderBy: { additional_price: 'asc' } } }
    });
    res.json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch variants' } });
  }
});

// POST /api/menu/items/:id/variants — create a variant group with options
// Body: { group_name: "Size", options: [{ label: "Small", additional_price: 0 }, ...] }
router.post('/items/:id/variants', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { id } = req.params;
  const { group_name, options } = req.body;
  if (!group_name || !Array.isArray(options) || options.length === 0) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'group_name and at least one option are required' } });
    return;
  }
  try {
    const item = await prisma.menuItem.findFirst({ where: { id: id as string, restaurant_id: restaurant_id as string } });
    if (!item) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }
    const group = await prisma.menuItemCustomization.create({
      data: {
        menu_item_id: id as string,
        group_name,
        is_required: true,
        is_multi_select: false,
        variant_group: true,
        is_addon: false,
        options: {
          create: options.map((o: any) => ({
            label: o.label,
            additional_price: parseFloat(o.additional_price) || 0,
            is_available: o.is_available !== false
          }))
        }
      },
      include: { options: true }
    });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create variant group' } });
  }
});

// PUT /api/menu/items/:itemId/variants/:groupId — update variant group + options
router.put('/items/:itemId/variants/:groupId', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { itemId, groupId } = req.params;
  const { group_name, options } = req.body;
  try {
    const item = await prisma.menuItem.findFirst({ where: { id: itemId as string, restaurant_id: restaurant_id as string } });
    if (!item) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }
    const existing = await prisma.menuItemCustomization.findFirst({ where: { id: groupId as string, menu_item_id: itemId as string } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Variant group not found' } });
      return;
    }

    // Delete old options and recreate
    await prisma.menuItemCustomizationOption.deleteMany({ where: { customization_id: groupId as string } });
    const updated = await prisma.menuItemCustomization.update({
      where: { id: groupId as string },
      data: {
        group_name: group_name || existing.group_name,
        options: {
          create: (options || []).map((o: any) => ({
            label: o.label,
            additional_price: parseFloat(o.additional_price) || 0,
            is_available: o.is_available !== false
          }))
        }
      },
      include: { options: true }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update variant group' } });
  }
});

// DELETE /api/menu/items/:itemId/variants/:groupId
router.delete('/items/:itemId/variants/:groupId', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { itemId, groupId } = req.params;
  try {
    const item = await prisma.menuItem.findFirst({ where: { id: itemId as string, restaurant_id: restaurant_id as string } });
    if (!item) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }
    await prisma.menuItemCustomizationOption.deleteMany({ where: { customization_id: groupId as string } });
    await prisma.menuItemCustomization.delete({ where: { id: groupId as string } });
    res.json({ success: true, message: 'Variant group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete variant group' } });
  }
});

// PATCH /api/menu/variants/options/:optionId/status — enable/disable individual variant option
router.patch('/variants/options/:optionId/status', async (req: Request, res: Response) => {
  const { optionId } = req.params;
  const { is_available } = req.body;
  try {
    const option = await prisma.menuItemCustomizationOption.update({
      where: { id: optionId as string },
      data: { is_available }
    });
    res.json({ success: true, data: option });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update option status' } });
  }
});

// ─── ADD-ONS ─────────────────────────────────────────────────────────────────

// GET /api/menu/addons — fetch all add-on groups for this restaurant
router.get('/addons', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  try {
    // Add-ons are stored as customization groups with is_addon=true
    // They're attached to a "container" menu item per restaurant
    // We query all is_addon groups for this restaurant's items
    const addonGroups = await prisma.menuItemCustomization.findMany({
      where: {
        is_addon: true,
        menu_item: { restaurant_id: restaurant_id as string, is_deleted: false }
      },
      include: {
        options: { orderBy: { additional_price: 'asc' } },
        menu_item: { select: { id: true, name: true } }
      }
    });
    res.json({ success: true, data: addonGroups });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch add-ons' } });
  }
});

// POST /api/menu/addons — create a new add-on group
// Body: { group_name: "Beverages", options: [{ label: "Water Bottle", additional_price: 20 }, ...] }
// Add-ons are attached to the first non-deleted menu item of the restaurant as a container
router.post('/addons', async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const { group_name, options } = req.body;
  if (!group_name || !Array.isArray(options) || options.length === 0) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'group_name and options are required' } });
    return;
  }
  try {
    // Find or use any non-deleted item as the container
    const containerItem = await prisma.menuItem.findFirst({
      where: { restaurant_id: restaurant_id as string, is_deleted: false }
    });
    if (!containerItem) {
      res.status(400).json({ success: false, error: { code: 'NO_MENU_ITEMS', message: 'Add at least one regular menu item before adding add-ons' } });
      return;
    }
    const group = await prisma.menuItemCustomization.create({
      data: {
        menu_item_id: containerItem.id,
        group_name,
        is_required: false,
        is_multi_select: true,
        variant_group: false,
        is_addon: true,
        options: {
          create: options.map((o: any) => ({
            label: o.label,
            additional_price: parseFloat(o.additional_price) || 0,
            is_available: o.is_available !== false
          }))
        }
      },
      include: { options: true }
    });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create add-on group' } });
  }
});

// PUT /api/menu/addons/:groupId — update add-on group
router.put('/addons/:groupId', async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { group_name, options } = req.body;
  try {
    await prisma.menuItemCustomizationOption.deleteMany({ where: { customization_id: groupId as string } });
    const updated = await prisma.menuItemCustomization.update({
      where: { id: groupId as string },
      data: {
        group_name,
        options: {
          create: (options || []).map((o: any) => ({
            label: o.label,
            additional_price: parseFloat(o.additional_price) || 0,
            is_available: o.is_available !== false
          }))
        }
      },
      include: { options: true }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update add-on group' } });
  }
});

// DELETE /api/menu/addons/:groupId
router.delete('/addons/:groupId', async (req: Request, res: Response) => {
  const { groupId } = req.params;
  try {
    await prisma.menuItemCustomizationOption.deleteMany({ where: { customization_id: groupId as string } });
    await prisma.menuItemCustomization.delete({ where: { id: groupId as string } });
    res.json({ success: true, message: 'Add-on group deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete add-on' } });
  }
});

// ─── BULK IMPORT ──────────────────────────────────────────────────────────────

// POST /api/menu/bulk-import — import menu items from CSV
// CSV format: Name,Description,Price,Category,IsVeg,PrepTimeMins
// First line is header. If category doesn't exist, it will be created.
router.post('/bulk-import', upload.single('file'), async (req: Request, res: Response) => {
  const restaurant_id = (req as any).restaurant_id;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FILE', message: 'CSV file is required' } });
    return;
  }

  if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
    res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'Only CSV files are supported' } });
    return;
  }

  try {
    const csv = file.buffer.toString('utf-8');
    const lines = csv.split(/\r?\n/).filter(l => l.trim());

    if (lines.length < 2) {
      res.status(400).json({ success: false, error: { code: 'EMPTY_FILE', message: 'CSV must have a header row and at least one data row' } });
      return;
    }

    // Skip header line
    const dataLines = lines.slice(1);

    const created: any[] = [];
    const failed: { row: number; reason: string }[] = [];

    // Cache category name → id to avoid repeated lookups
    const categoryCache: Record<string, string> = {};

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]!.trim();
      if (!line) continue;

      // Parse CSV line (basic — handles quoted fields)
      const fields = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
      const [nameRaw, descRaw, priceRaw, categoryRaw, isVegRaw, prepTimeRaw] = fields.map(f =>
        f.replace(/^"|"$/g, '').trim()
      );

      const name = nameRaw || '';
      const description = descRaw || '';
      const price = parseFloat(priceRaw || '0');
      const categoryName = categoryRaw || 'General';
      const isVeg = ['true', '1', 'yes', 'veg', 'vegetarian'].includes((isVegRaw || '').toLowerCase());
      const prepTime = parseInt(prepTimeRaw || '0') || null;

      if (!name) {
        failed.push({ row: i + 2, reason: 'Name is required' });
        continue;
      }
      if (isNaN(price) || price < 0) {
        failed.push({ row: i + 2, reason: `Invalid price: "${priceRaw}"` });
        continue;
      }

      try {
        // Get or create category
        let category_id = categoryCache[categoryName.toLowerCase()];
        if (!category_id) {
          const existingCat = await prisma.menuCategory.findFirst({
            where: { restaurant_id: restaurant_id as string, name: { equals: categoryName, mode: 'insensitive' } }
          });
          if (existingCat) {
            category_id = existingCat.id;
          } else {
            const count = await prisma.menuCategory.count({ where: { restaurant_id: restaurant_id as string } });
            const newCat = await prisma.menuCategory.create({
              data: { restaurant_id: restaurant_id as string, name: categoryName, display_order: count }
            });
            category_id = newCat.id;
          }
          categoryCache[categoryName.toLowerCase()] = category_id;
        }

        const item = await prisma.menuItem.create({
          data: {
            restaurant_id: restaurant_id as string,
            category_id,
            name,
            description: description || undefined,
            price,
            is_veg: isVeg,
            is_available: true,
            preparation_time_mins: prepTime
          }
        });
        created.push({ row: i + 2, id: item.id, name: item.name });
      } catch (itemError: any) {
        failed.push({ row: i + 2, reason: itemError.message || 'Unknown error' });
      }
    }

    res.json({
      success: true,
      data: {
        total: dataLines.filter(l => l.trim()).length,
        created: created.length,
        failed: failed.length,
        created_items: created,
        errors: failed
      }
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process CSV file' } });
  }
});

export default router;

