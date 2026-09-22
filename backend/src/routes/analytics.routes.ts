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

// ─── Helper: parse date range from query params ─────────────────────────────

function parseDateRange(query: any): { from: Date; to: Date } {
  const period = query.period as string;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (period === 'today') {
    return { from: todayStart, to: todayEnd };
  }
  if (period === 'yesterday') {
    const yStart = new Date(todayStart);
    yStart.setDate(yStart.getDate() - 1);
    const yEnd = new Date(todayStart);
    yEnd.setMilliseconds(-1);
    return { from: yStart, to: yEnd };
  }
  if (period === '7d') {
    const from = new Date(todayStart);
    from.setDate(from.getDate() - 6);
    return { from, to: todayEnd };
  }
  if (period === 'custom' && query.from && query.to) {
    return {
      from: new Date(query.from as string),
      to: new Date(query.to as string)
    };
  }
  // Default: last 30 days
  const from = new Date(todayStart);
  from.setDate(from.getDate() - 29);
  return { from, to: todayEnd };
}

// GET /api/analytics/restaurant — restaurant-scoped earnings analytics
// Supports: ?period=today|yesterday|7d|30d|custom&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/restaurant', authorizeRole(['restaurant_partner']), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const partner = await findRestaurantPartner(user);
    if (!partner) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a restaurant partner' } }) as any;

    const { from, to } = parseDateRange(req.query);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Base filter for the selected date range (delivered + successful payment)
    const rangeOrderFilter = {
      restaurant_id: partner.restaurant_id,
      status: 'delivered' as const,
      created_at: { gte: from, lte: to },
      payment_status: 'success'
    };

    const [
      rangeOrders,
      menuItemEarningsRaw,
      todayOrders,
      weekOrders,
      monthOrders,
      allTimeStats,
      totalOrdersCount,
      cancelledOrdersCount,
      pendingOrdersCount,
      recentForChart
    ] = await Promise.all([
      // Orders in selected range for KPIs
      prisma.order.findMany({
        where: rangeOrderFilter,
        select: {
          total_amount: true,
          item_subtotal: true,
          discount_amount: true,
          restaurant_discount_share: true,
          restaurant_commission: true,
          restaurant_transfer: true
        }
      }),

      // Menu item earnings in selected range
      prisma.orderItem.findMany({
        where: {
          order: rangeOrderFilter
        },
        select: {
          menu_item_id: true,
          name_snapshot: true,
          price_snapshot: true,
          quantity: true,
          subtotal: true,
          order: {
            select: {
              item_subtotal: true,
              restaurant_discount_share: true
            }
          }
        }
      }),

      // Today's stats
      prisma.order.findMany({
        where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: todayStart } },
        select: { total_amount: true }
      }),
      prisma.order.count({ where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: sevenDaysAgo } } }),
      prisma.order.findMany({
        where: { restaurant_id: partner.restaurant_id, status: 'delivered', created_at: { gte: thirtyDaysAgo } },
        select: { total_amount: true }
      }),
      prisma.order.aggregate({
        where: { restaurant_id: partner.restaurant_id, status: 'delivered' },
        _sum: { total_amount: true },
        _count: { id: true }
      }),
      prisma.order.count({ where: { restaurant_id: partner.restaurant_id } }),
      prisma.order.count({ where: { restaurant_id: partner.restaurant_id, status: { in: ['cancelled', 'rejected'] } } }),
      prisma.order.count({ where: { restaurant_id: partner.restaurant_id, status: { notIn: ['delivered', 'cancelled', 'rejected'] } } }),

      // Chart data for selected range (daily breakdown)
      prisma.order.findMany({
        where: rangeOrderFilter,
        select: { total_amount: true, restaurant_transfer: true, created_at: true },
        orderBy: { created_at: 'asc' }
      })
    ]);

    // ─── Menu Item Earnings Aggregation ─────────────────────────────────────
    // Group by menu_item_id + name_snapshot
    const itemMap: Record<string, {
      menu_item_id: string;
      name: string;
      units_sold: number;
      gross_revenue: number;
      discount_share: number;
    }> = {};

    for (const item of menuItemEarningsRaw) {
      const key = item.menu_item_id;
      if (!itemMap[key]) {
        itemMap[key] = {
          menu_item_id: item.menu_item_id,
          name: item.name_snapshot,
          units_sold: 0,
          gross_revenue: 0,
          discount_share: 0
        };
      }
      const subtotal = Number(item.subtotal);
      const orderSubtotal = Number(item.order.item_subtotal);
      const orderDiscountShare = Number(item.order.restaurant_discount_share);

      // Pro-rate discount share based on item's proportion of the order
      const itemDiscountShare = orderSubtotal > 0
        ? (subtotal / orderSubtotal) * orderDiscountShare
        : 0;

      itemMap[key].units_sold += item.quantity;
      itemMap[key].gross_revenue += subtotal;
      itemMap[key].discount_share += itemDiscountShare;
    }

    const totalGrossRevenue = Object.values(itemMap).reduce((s, i) => s + i.gross_revenue, 0);

    const menuItemEarnings = Object.values(itemMap)
      .sort((a, b) => b.gross_revenue - a.gross_revenue)
      .map(item => {
        const net_revenue = item.gross_revenue - item.discount_share;
        return {
          menu_item_id: item.menu_item_id,
          name: item.name,
          units_sold: item.units_sold,
          gross_revenue: Math.round(item.gross_revenue * 100) / 100,
          discount_share: Math.round(item.discount_share * 100) / 100,
          net_revenue: Math.round(net_revenue * 100) / 100,
          contribution_pct: totalGrossRevenue > 0
            ? Math.round((item.gross_revenue / totalGrossRevenue) * 1000) / 10
            : 0
        };
      });

    // ─── Chart Data ─────────────────────────────────────────────────────────
    // Build day-by-day map for the selected range
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const dailyData: Record<string, { revenue: number; net_revenue: number; orders: number }> = {};
    for (let i = 0; i <= Math.min(diffDays, 365); i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0] as string;
      dailyData[dateStr] = { revenue: 0, net_revenue: 0, orders: 0 };
    }
    recentForChart.forEach(o => {
      const dateStr = new Date(o.created_at).toISOString().split('T')[0] as string;
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += Number(o.total_amount);
        dailyData[dateStr].net_revenue += Number(o.restaurant_transfer || 0);
        dailyData[dateStr].orders += 1;
      }
    });

    // ─── KPIs for selected range ─────────────────────────────────────────────
    const rangeRevenue = rangeOrders.reduce((s, o) => s + Number(o.item_subtotal), 0);
    const rangeOrders_ = rangeOrders.length;
    const rangeNetRevenue = rangeOrders.reduce((s, o) => s + Number(o.restaurant_transfer || 0), 0);
    const rangeDiscounts = rangeOrders.reduce((s, o) => s + Number(o.restaurant_discount_share || 0), 0);
    const rangeCommission = rangeOrders.reduce((s, o) => s + Number(o.restaurant_commission || 0), 0);
    const rangeAOV = rangeOrders_ > 0 ? rangeRevenue / rangeOrders_ : 0;
    const rangeItemsSold = menuItemEarningsRaw.reduce((s, i) => s + i.quantity, 0);

    res.json({
      success: true,
      data: {
        period: { from: from.toISOString(), to: to.toISOString() },
        kpis: {
          // Range-specific
          range_revenue: Math.round(rangeRevenue * 100) / 100,
          range_orders: rangeOrders_,
          range_net_revenue: Math.round(rangeNetRevenue * 100) / 100,
          range_discounts: Math.round(rangeDiscounts * 100) / 100,
          range_commission: Math.round(rangeCommission * 100) / 100,
          range_aov: Math.round(rangeAOV * 100) / 100,
          range_items_sold: rangeItemsSold,
          // Fixed stats (always shown)
          today_revenue: todayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          today_orders: todayOrders.length,
          week_orders: weekOrders,
          month_revenue: monthOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          month_orders: monthOrders.length,
          total_sales: Number(allTimeStats._sum.total_amount || 0),
          total_orders: totalOrdersCount,
          completed_orders: allTimeStats._count.id,
          cancelled_orders: cancelledOrdersCount,
          pending_orders: pendingOrdersCount
        },
        chartData: Object.keys(dailyData).sort().map(date => ({ date, ...dailyData[date] })),
        menuItemEarnings,
      }
    });
  } catch (error) {
    console.error('Restaurant analytics error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' } });
  }
});

export default router;
