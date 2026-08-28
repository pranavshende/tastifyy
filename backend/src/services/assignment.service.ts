import { prisma } from '../utils/prisma.js';
import { getIO } from '../socket.js';
import { sendPushNotification } from './notification.service.js';

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function assignDeliveryPartner(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, customer: true }
    });

    if (!order || order.delivery_partner_id) {
      return false; // Already assigned or doesn't exist
    }

    const restLat = Number(order.restaurant.latitude);
    const restLon = Number(order.restaurant.longitude);

    // 1. Find all active and online delivery partners who don't have an active assignment
    // (We will consider an active assignment as anything not delivered, cancelled, or rejected)
    const partners = await prisma.deliveryPartner.findMany({
      where: {
        status: 'active',
        is_online: true,
        current_latitude: { not: null },
        current_longitude: { not: null },
        assignments: {
          none: {
            status: { in: ['accepted', 'picked_up'] }
          }
        }
      }
    });

    if (partners.length === 0) {
      console.warn(`[Assignment] No available delivery partners for order ${orderId}`);
      return false;
    }

    // 2. Sort by distance (Proximity Assignment)
    const sortedPartners = partners.map(p => ({
      ...p,
      distance: calculateDistance(restLat, restLon, Number(p.current_latitude), Number(p.current_longitude))
    })).sort((a, b) => a.distance - b.distance);

    const closestPartner = sortedPartners[0];

    if (!closestPartner) {
      console.warn(`[Assignment] No closest partner could be determined for order ${orderId}`);
      return false;
    }

    console.log(`[Assignment] Found closest partner ${closestPartner.id} at distance ${closestPartner.distance.toFixed(2)}km`);

    // 3. Assign the order in DB
    await prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: order.id },
        data: { delivery_partner_id: closestPartner.id }
      });

      // Create delivery assignment (Strict forced assignment for Phase M MVP)
      await tx.deliveryAssignment.create({
        data: {
          order_id: order.id,
          partner_id: closestPartner.id,
          status: 'accepted',
          earning_amount: order.delivery_fee, // Partner gets the delivery fee in this simple model
          pickup_distance_km: closestPartner.distance
        }
      });
    });

    // 4. Emit Socket Event
    const io = getIO();
    io.to(`delivery_${closestPartner.id}`).emit('delivery:assigned', {
      orderId: order.id,
      restaurantName: order.restaurant.name,
      pickupDistance: closestPartner.distance,
      earningAmount: order.delivery_fee
    });

    // Notify Restaurant that rider is assigned
    io.to(`restaurant_${order.restaurant_id}`).emit('order:rider_assigned', {
      orderId: order.id,
      partnerName: closestPartner.name,
      partnerPhone: closestPartner.phone
    });

    // Send Push Notification via FCM
    sendPushNotification(
      closestPartner.user_id,
      'New Order Assigned!',
      `You have been assigned an order from ${order.restaurant.name}. Pickup is ${closestPartner.distance.toFixed(1)}km away.`,
      { type: 'order_assigned', orderId: order.id }
    ).catch(err => console.error('FCM Dispatch Error:', err));

    return true;
  } catch (error) {
    console.error(`[Assignment] Error assigning partner for order ${orderId}:`, error);
    return false;
  }
}
