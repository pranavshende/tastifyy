import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import { findRestaurantPartner } from '../utils/restaurantPartner.js';
import type { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

// GET /api/analytics/admin — platform-wide revenue analytics
router.get('/admin', authorizeRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const recentOrders = await prisma.order.findMany({
      where: { created_at: { gte: thirtyDaysAgo }, status: 'delivered' },
      select: { total_amount: true, restaurant_commission: true, created_at: true }
    });

    const refundedOrders = await prisma.order.findMany({
      where: { created_at: { gte: thirtyDaysAgo }, payment_status: 'refunded' as any },
      select: { total_amount: true, created_at: true }
    });

    const dailyData: Record<string, { revenue: number; orders: number; commission: number; refunds: number }> = {};
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0] as string;
      dailyData[dateStr] = { revenue: 0, orders: 0, commission: 0, refunds: 0 };
    }

    recentOrders.forEach(o => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0] as string;
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += Number(o.total_amount);
        dailyData[dateStr].orders += 1;
        dailyData[dateStr].commission += Number(o.restaurant_commission || 0);
      }
    });

    refundedOrders.forEach(o => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0] as string;
      if (dailyData[dateStr]) {
        dailyData[dateStr].refunds += Number(o.total_amount);
      }
    });

    const chartData = Object.keys(dailyData).sort().map(date => ({
      date,
      ...dailyData[date]
    }));

    const totalRevenue = recentOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = recentOrders.length;
    const totalCommission = recentOrders.reduce((sum, o) => sum + Number(o.restaurant_commission || 0), 0);
    const totalRefunds = refundedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      success: true,
      data: { chartData, kpis: { totalRevenue, totalOrders, totalCommission, totalRefunds, aov } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } });
  }
});

// GET /api/analytics/restaurant — restaurant-scoped earnings analytics
router.get('/restaurant', authorizeRole(['restaurant_partner']), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const partner = await findRestaurantPartner(user);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a restaurant partner' } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, weekOrders, monthOrders, topItems, recentForChart] = await Promise.all([
      prisma.order.findMany({
        where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: todayStart } },
        select: { total_amount: true }
      }),
      prisma.order.count({ where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: sevenDaysAgo } } }),
      prisma.order.findMany({
        where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: thirtyDaysAgo } },
        select: { total_amount: true, created_at: true }
      }),
      prisma.orderItem.groupBy({
        by: ['name_snapshot'],
        where: { order: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: thirtyDaysAgo } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.order.findMany({
        where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: sevenDaysAgo } },
        select: { total_amount: true, created_at: true },
        orderBy: { created_at: 'asc' }
      })
    ]);

    const dailyData: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i <= 6; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0] as string;
      dailyData[dateStr] = { revenue: 0, orders: 0 };
    }
    recentForChart.forEach(o => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0] as string;
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += Number(o.total_amount);
        dailyData[dateStr].orders += 1;
      }
    });

    res.json({
      success: true,
      data: {
        kpis: {
          today_revenue: todayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          today_orders: todayOrders.length,
          week_orders: weekOrders,
          month_revenue: monthOrders.reduce((s, o) => s + Number(o.total_amount), 0),
        },
        chartData: Object.keys(dailyData).sort().map(date => ({ date, ...dailyData[date] })),
        topItems: topItems.map(i => ({ name: i.name_snapshot, sold: i._sum.quantity || 0 }))
      }
    });
  } catch (error) {
    console.error('Restaurant analytics error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } });
  }
});

export default router;
