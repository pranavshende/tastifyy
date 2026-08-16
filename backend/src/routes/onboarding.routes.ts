import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();

// All onboarding routes require authentication
router.use(authenticate);

// ─── CUSTOMER ONBOARDING ─────────────────────────────────────────────────────

// PATCH /onboarding/customer — update customer profile (location, preferences)
router.patch('/customer', async (req: Request, res: Response) => {
  const user = req.user as any;
  const { dob, address, preferences } = req.body;

  try {
    // We will save the address and mark some onboarding flags if needed.
    // Address format: { label, address_line, city, state, pincode, latitude, longitude }
    if (address) {
      await prisma.address.create({
        data: {
          user_id: user.id,
          label: address.label || 'home',
          address_line: address.address_line || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
          latitude: address.latitude || 0,
          longitude: address.longitude || 0,
          is_default: true,
        }
      });
    }

    if (dob) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dob: new Date(dob) }
      });
    }

    // Since preferences are not yet explicitly modelled in DB for user, 
    // we can either add them to the User model as JSON or skip for now. 
    // The PRD mentions dietary preferences, favourite cuisines, etc.

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    res.json({ success: true, data: updatedUser, message: 'Customer profile updated' });
  } catch (error: any) {
    console.error('Customer onboarding error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update customer profile', details: error.message } });
  }
});

// ─── RESTAURANT ONBOARDING ───────────────────────────────────────────────────

// POST /onboarding/restaurant — start or update restaurant onboarding
router.post('/restaurant', async (req: Request, res: Response) => {
  const user = req.user as any;
  const {
    name, type, owner_name, phone, email, address_line, city, state, pincode,
    latitude, longitude, service_radius_km, avg_preparation_time_mins,
    is_pure_veg, cuisine_tags, description, onboarding_step
  } = req.body;

  try {
    // Check if restaurant already exists for this user (via RestaurantPartner link)
    const existingPartner = await prisma.restaurantPartner.findFirst({
      where: { phone: user.phone }
    });

    if (existingPartner) {
      // Update existing restaurant
      const restaurant = await prisma.restaurant.update({
        where: { id: existingPartner.restaurant_id },
        data: {
          name, type, owner_name, phone, email, address_line, city, state, pincode,
          latitude, longitude, service_radius_km, avg_preparation_time_mins,
          is_pure_veg, cuisine_tags, description
        }
      });
      res.json({ success: true, data: restaurant, onboarding_step });
    } else {
      // Create new restaurant and link partner
      const restaurant = await prisma.restaurant.create({
        data: {
          name: name || 'My Restaurant',
          type: type || 'restaurant',
          owner_name: owner_name || user.name,
          phone: phone || user.phone,
          email: email || user.email,
          address_line: address_line || '',
          city: city || '',
          state: state || '',
          pincode: pincode || '',
          latitude: latitude || 0,
          longitude: longitude || 0,
          service_radius_km: service_radius_km || 5,
          avg_preparation_time_mins,
          is_pure_veg: is_pure_veg || false,
          cuisine_tags: cuisine_tags || [],
          commission_rate: 15.0,
          partners: {
            create: {
              name: owner_name || user.name,
              phone: user.phone,
              email: user.email,
              role: 'owner',
            }
          }
        }
      });
      // Update user role to restaurant_partner
      await prisma.user.update({ where: { id: user.id }, data: { role: 'restaurant_partner' } });
      res.status(201).json({ success: true, data: restaurant, onboarding_step });
    }
  } catch (error: any) {
    console.error('Restaurant onboarding error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Onboarding failed', details: error.message } });
  }
});

// POST /onboarding/restaurant/submit — finalize and submit for admin review
router.post('/restaurant/submit', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.restaurantPartner.findFirst({ where: { phone: user.phone } });
    if (!partner) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant onboarding not started' } });
      return;
    }
    const restaurant = await prisma.restaurant.update({
      where: { id: partner.restaurant_id },
      data: { status: 'pending' }
    });
    res.json({ success: true, data: restaurant, message: 'Application submitted for review' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Submit failed' } });
  }
});

// GET /onboarding/restaurant/status — get application status
router.get('/restaurant/status', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.restaurantPartner.findFirst({
      where: { phone: user.phone },
      include: { restaurant: true }
    });
    if (!partner) {
      res.json({ success: true, data: null, message: 'No restaurant onboarding found' });
      return;
    }
    res.json({ success: true, data: partner.restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch status' } });
  }
});

// ─── DELIVERY ONBOARDING ─────────────────────────────────────────────────────

// POST /onboarding/delivery — start or update delivery partner onboarding
router.post('/delivery', async (req: Request, res: Response) => {
  const user = req.user as any;
  const {
    vehicle_type, vehicle_number, vehicle_model,
    license_number, bank_account_number, ifsc_code, upi_id,
    availability_type, onboarding_step
  } = req.body;

  try {
    const existing = await prisma.deliveryPartner.findFirst({ where: { user_id: user.id } });

    if (existing) {
      const updated = await prisma.deliveryPartner.update({
        where: { id: existing.id },
        data: { vehicle_type, vehicle_number, vehicle_model, license_number, availability_type }
      });
      res.json({ success: true, data: updated, onboarding_step });
    } else {
      const partner = await prisma.deliveryPartner.create({
        data: {
          user_id: user.id,
          vehicle_type: vehicle_type || '',
          vehicle_number: vehicle_number || '',
          vehicle_model: vehicle_model || '',
          license_number: license_number || '',
          bank_account_number: bank_account_number || '',
          ifsc_code: ifsc_code || '',
          upi_id,
          availability_type: availability_type || 'full_time',
        }
      });
      await prisma.user.update({ where: { id: user.id }, data: { role: 'delivery_partner' } });
      res.status(201).json({ success: true, data: partner, onboarding_step });
    }
  } catch (error: any) {
    console.error('Delivery onboarding error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Onboarding failed' } });
  }
});

// POST /onboarding/delivery/submit
router.post('/delivery/submit', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.deliveryPartner.findFirst({ where: { user_id: user.id } });
    if (!partner) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery onboarding not started' } });
      return;
    }
    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { status: 'pending' }
    });
    res.json({ success: true, data: updated, message: 'Application submitted for review' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Submit failed' } });
  }
});

// GET /onboarding/delivery/status — get application status
router.get('/delivery/status', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const partner = await prisma.deliveryPartner.findFirst({
      where: { user_id: user.id }
    });
    if (!partner) {
      res.json({ success: true, data: null, message: 'No delivery onboarding found' });
      return;
    }
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch status' } });
  }
});

export default router;
