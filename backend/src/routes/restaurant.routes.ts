import { Router } from 'express';
import { getActiveRestaurants, registerRestaurant, updateRestaurant, getNearbyRestaurants, getRestaurantMenu, searchRestaurants } from '../controllers/restaurant.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// Public / Customer routes
router.get('/nearby', getNearbyRestaurants);
router.get('/search', searchRestaurants);
router.get('/:id/menu', getRestaurantMenu);
router.get('/', getActiveRestaurants);

// Partner/Admin routes
router.post('/', authenticate, authorizeRole(['admin']), registerRestaurant);
router.put('/:id', authenticate, updateRestaurant);

export default router;
