import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { createLinkedAccount, triggerPayout } from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate);

router.post('/linked-account', authorizeRole(['restaurant_partner']), createLinkedAccount);
router.post('/payout', authorizeRole(['admin']), triggerPayout);

export default router;
