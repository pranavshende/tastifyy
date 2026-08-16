import { Router } from 'express';
import { checkout, verifyPayment, updateOrderStatus, getOrderById, rateOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/checkout', authenticate, checkout);
router.post('/verify-payment', authenticate, verifyPayment);
router.put('/:id/status', authenticate, updateOrderStatus);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/rate', authenticate, rateOrder);

export default router;
