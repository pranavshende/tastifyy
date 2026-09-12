import { Router } from 'express';
import { getActiveRestaurants, registerRestaurant, updateRestaurant, getNearbyRestaurants, getRestaurantMenu, searchRestaurants } from '../controllers/restaurant.controller.js';
import { authenticate } from '../middlewares/auth.js';
const router = Router();
// Public / Customer routes
router.get('/nearby', getNearbyRestaurants);
router.get('/search', searchRestaurants);
router.get('/:id/menu', getRestaurantMenu);
router.get('/', getActiveRestaurants);
// Partner/Admin routes
router.post('/', registerRestaurant);
router.put('/:id', authenticate, updateRestaurant);
export default router;
//# sourceMappingURL=restaurant.routes.js.map