import { notificationQueue } from '../jobs/queues.js';
import { findRestaurantUserByRestaurantId } from '../utils/restaurantPartner.js';
import { prisma } from '../utils/prisma.js';

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  restaurant_confirmed: { title: 'Order Confirmed', body: 'The restaurant confirmed your order.' },
  preparing: { title: 'Preparing Your Food', body: 'Your food is being prepared.' },
  ready: { title: 'Ready for Pickup', body: 'Your order is ready for pickup.' },
  rider_assigned: { title: 'Delivery Partner Assigned', body: 'A delivery partner has been assigned to your order.' },
  picked_up: { title: 'Order Picked Up', body: 'Your delivery partner picked up the order.' },
  out_for_delivery: { title: 'Out for Delivery', body: 'Your order is on the way.' },
  delivered: { title: 'Delivered', body: 'Your order has been delivered. Enjoy your meal!' },
  cancelled: { title: 'Cancelled', body: 'Your order was cancelled.' },
  rejected: { title: 'Order Cancelled', body: 'The restaurant could not accept your order.' },
};

interface OrderNotificationDetails {
  id: string;
  customer_id: string;
  restaurant_id: string;
  total_amount: number | { toString(): string };
  customer?: { name: string };
  restaurant?: { name: string };
  order_items: Array<{ name_snapshot: string; quantity: number }>;
}

function orderReference(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

export async function notifyOrderCreated(order: OrderNotificationDetails): Promise<void> {
  const reference = orderReference(order.id);
  const amount = Number(order.total_amount).toFixed(2);
  const customerName = order.customer?.name || 'Customer';
  const itemSummary = order.order_items
    .map((item) => `${item.quantity} × ${item.name_snapshot}`)
    .join(', ')
    .slice(0, 220);
  const admins = await prisma.user.findMany({
    where: { role: 'admin', is_active: true },
    select: { id: true },
  });

  const notifications = [
    notificationQueue.add('notify', {
      type: 'both',
      userId: order.customer_id,
      userRole: 'customer',
      title: 'Order Placed',
      body: 'Your order has been sent to the restaurant.',
      notificationType: 'order_created',
      dedupeKey: `order-created:${order.id}:${order.customer_id}`,
      data: { type: 'order_created', orderId: order.id, status: 'pending' },
    }),
    ...admins.map((admin) => notificationQueue.add('notify', {
      type: 'db_only',
      userId: admin.id,
      userRole: 'admin',
      title: `New order ${reference} from ${customerName}`,
      body: `${itemSummary || 'Order received'} · ₹${amount}`,
      notificationType: 'order_created',
      dedupeKey: `order-created:${order.id}:${admin.id}`,
      data: { type: 'order_created', orderId: order.id, status: 'pending' },
    })),
  ];

  const restaurantUser = await findRestaurantUserByRestaurantId(order.restaurant_id);
  if (restaurantUser) {
    notifications.push(notificationQueue.add('notify', {
      type: 'both',
      userId: restaurantUser.id,
      userRole: 'restaurant_partner',
      title: 'New Order Received!',
      body: `${reference} has been placed for ₹${amount}.`,
      notificationType: 'order_created',
      dedupeKey: `order-created:${order.id}:${restaurantUser.id}`,
      data: { type: 'order_created', orderId: order.id, status: 'pending' },
    }));
  }

  await Promise.all(notifications);
}

export async function notifyOrderStatusChanged(
  order: Pick<OrderNotificationDetails, 'id' | 'customer_id' | 'restaurant_id'>,
  status: string,
): Promise<void> {
  const message = STATUS_MESSAGES[status];
  if (!message) return;

  const admins = await prisma.user.findMany({
    where: { role: 'admin', is_active: true },
    select: { id: true },
  });
  const restaurantUser = await findRestaurantUserByRestaurantId(order.restaurant_id);
  const data = { type: 'order_status', orderId: order.id, status };
  const dedupeSuffix = `${order.id}:${status}`;

  const notifications = [
    notificationQueue.add('notify', {
      type: 'both',
      userId: order.customer_id,
      userRole: 'customer',
      title: message.title,
      body: message.body,
      notificationType: 'order_status',
      dedupeKey: `order-status:${dedupeSuffix}:${order.customer_id}`,
      data,
    }),
    ...admins.map((admin) => notificationQueue.add('notify', {
      type: 'db_only',
      userId: admin.id,
      userRole: 'admin',
      title: `Order ${orderReference(order.id)} ${status.replaceAll('_', ' ')}`,
      body: `Order status changed to ${status.replaceAll('_', ' ')}.`,
      notificationType: 'order_status',
      dedupeKey: `order-status:${dedupeSuffix}:${admin.id}`,
      data,
    })),
  ];

  if (restaurantUser) {
    notifications.push(notificationQueue.add('notify', {
      type: 'both',
      userId: restaurantUser.id,
      userRole: 'restaurant_partner',
      title: `Order ${status.replaceAll('_', ' ')}`,
      body: `${orderReference(order.id)} status changed to ${status.replaceAll('_', ' ')}.`,
      notificationType: 'order_status',
      dedupeKey: `order-status:${dedupeSuffix}:${restaurantUser.id}`,
      data,
    }));
  }

  await Promise.all(notifications);
}
