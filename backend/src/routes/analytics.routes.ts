import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();

router.use(authenticate, authorizeRole(['admin']));

// GET /api/analytics/admin
router.get('/admin', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Get orders from last 30 days
    const recentOrders = await prisma.order.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
        status: 'delivered'
      },
      select: {
        total_amount: true,
        created_at: true,
      }
    });

    // Group by day for the chart
    const dailyData: Record<string, { revenue: number, orders: number }> = {};
    
    // Initialize last 30 days with 0
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { revenue: 0, orders: 0 };
    }

    recentOrders.forEach(o => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += Number(o.total_amount);
        dailyData[dateStr].orders += 1;
      }
    });

    const chartData = Object.keys(dailyData).sort().map(date => ({
      date,
      revenue: dailyData[date].revenue,
      orders: dailyData[date].orders
    }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } });
  }
});

export default router;
