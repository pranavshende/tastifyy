import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { createLinkedAccount, createStakeholder, configureRouteProduct, triggerPayout } from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate);

// Restaurant Route onboarding — 3-step sequence
router.post('/linked-account', authorizeRole(['restaurant_partner']), createLinkedAccount);
router.post('/stakeholder', authorizeRole(['restaurant_partner']), createStakeholder);
router.post('/product-config', authorizeRole(['restaurant_partner']), configureRouteProduct);

// Admin: trigger delivery payout
router.post('/payout', authorizeRole(['admin']), triggerPayout);

export default router;
