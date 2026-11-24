import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from './utils/jwt.js';
import { prisma } from './utils/prisma.js';
import { findRestaurantPartner } from './utils/restaurantPartner.js';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
        'https://www.tastifyy.in',
        'https://tastifyy.in',
      ];

  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken !== 'string' || !authToken) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const claims = verifyToken(authToken);
      if (typeof claims === 'string' || typeof claims.sub !== 'string') {
        next(new Error('Unauthorized'));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: claims.sub },
        select: { id: true, role: true, is_active: true },
      });
      if (!user || !user.is_active) {
        next(new Error('Unauthorized'));
        return;
      }

      socket.data.authenticatedUser = {
        id: user.id,
        role: user.role,
        expiresAt: typeof claims.exp === 'number' ? claims.exp * 1000 : null,
      };
      next();
    } catch (error) {
      console.error('[Socket] Authentication failed:', error);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const authenticatedUser = socket.data.authenticatedUser as { id: string; role: string; expiresAt: number | null };
    const disconnectTimer = authenticatedUser.expiresAt
      ? setTimeout(() => socket.disconnect(true), Math.max(0, authenticatedUser.expiresAt - Date.now()))
      : undefined;
    disconnectTimer?.unref();
    socket.once('disconnect', () => {
      if (disconnectTimer) clearTimeout(disconnectTimer);
    });
    socket.join(`${authenticatedUser.role}_${authenticatedUser.id}`);
    if (authenticatedUser.role === 'admin') socket.join('admin');

    // Keep the existing event compatible while deriving room access from the verified token.
    socket.on('join', (data: { role: string, id: string }) => {
      if (data.id !== authenticatedUser.id || data.role !== authenticatedUser.role) return;
      const room = `${data.role}_${data.id}`;
      socket.join(room);
    });

    // Restaurant partners also join their restaurant-specific room
    socket.on('join_restaurant', async (data: { restaurant_id: string }) => {
      if (authenticatedUser.role !== 'restaurant_partner') return;
      try {
        const partner = await findRestaurantPartner({ id: authenticatedUser.id });
        if (partner?.restaurant_id === data.restaurant_id) {
          socket.join(`restaurant_${data.restaurant_id}`);
        }
      } catch (error) {
        console.error('[Socket] Restaurant room authorization failed:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Relay rider's live location to the specific customer
    socket.on('update_location', async (data: { customerId: string, orderId: string, lat: number, lng: number }) => {
      if (
        authenticatedUser.role !== 'delivery_partner' ||
        typeof data?.customerId !== 'string' ||
        typeof data?.orderId !== 'string' ||
        !Number.isFinite(data.lat) ||
        !Number.isFinite(data.lng) ||
        Math.abs(data.lat) > 90 ||
        Math.abs(data.lng) > 180
      ) return;

      try {
        const assignment = await prisma.deliveryAssignment.findUnique({
          where: { order_id: data.orderId },
          include: {
            partner: { select: { user_id: true } },
            order: { select: { customer_id: true } },
          },
        });
        if (
          assignment?.partner.user_id !== authenticatedUser.id ||
          assignment.order.customer_id !== data.customerId
        ) return;

      io.to(`customer_${data.customerId}`).emit('rider_location_update', {
        orderId: data.orderId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString()
      });
      } catch (error) {
        console.error('[Socket] Failed to validate delivery location:', error);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
