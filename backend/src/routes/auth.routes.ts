import { Router } from 'express';
import { register, login, me, logout, sendOtp, verifyOtp } from '../controllers/auth.controller.js';

const router = Router();

import { authenticate } from '../middlewares/auth.js';

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.get('/me', me);
router.post('/logout', logout);

// FCM Token Registration
router.post('/fcm-token', authenticate, async (req, res) => {
  const { token } = req.body;
  const user = (req as any).user;
  
  if (!token) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Token is required' } });
    return;
  }

  try {
    const { prisma } = await import('../utils/prisma.js');
    await prisma.user.update({
      where: { id: user.id },
      data: { fcm_token: token }
    });
    res.json({ success: true, message: 'FCM Token saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save FCM token' } });
  }
});

export default router;
