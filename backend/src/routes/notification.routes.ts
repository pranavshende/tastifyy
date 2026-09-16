import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();
router.use(authenticate);

function recipientType(role: string) {
  return role === 'restaurant_partner' || role === 'delivery_partner' || role === 'admin' ? role : 'customer';
}

router.get('/', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipient_id: user.id, recipient_type: recipientType(user.role) },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } });
  }
});

router.patch('/read-all', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    await prisma.notification.updateMany({
      where: { recipient_id: user.id, recipient_type: recipientType(user.role), is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notifications' } });
  }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
  const user = req.user as any;
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id as string, recipient_id: user.id, recipient_type: recipientType(user.role) },
      data: { is_read: true },
    });
    if (!notification.count) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification' } });
  }
});

export default router;