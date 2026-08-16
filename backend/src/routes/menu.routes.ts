import { Router } from 'express';
import { createCategory, createMenuItem } from '../controllers/menu.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/categories', authenticate, createCategory);
router.post('/items', authenticate, createMenuItem);

export default router;
