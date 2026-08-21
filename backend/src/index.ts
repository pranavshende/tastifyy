import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import { prisma } from './utils/prisma.js';

import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import customerRoutes from './routes/customer.routes.js';

import passport from './config/passport.js';

import reviewRoutes from './routes/review.routes.js';
import supportRoutes from './routes/support.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import aiRoutes from './routes/ai.routes.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);

// Standard Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
}));
app.use(express.json());

// Security Middleware
app.use(helmet());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use(limiter);

// Auth Specific Rate Limiting (Stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  standardHeaders: true, 
  legacyHeaders: false,
});

app.use(passport.initialize());

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check (Root)
app.get('/', (_req, res) => {
  res.json({ message: 'Tastifyy API is running!', version: '2.0.0' });
});

// Deep Health Check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'healthy', 
      database: 'connected', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected', 
      timestamp: new Date().toISOString() 
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
