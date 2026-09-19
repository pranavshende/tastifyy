import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from './utils/jwt.js';
import { prisma } from './utils/prisma.js';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
        : '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const authToken = socket.handshake.auth?.token;
    let authenticatedUser: any = null;
    if (authToken) {
      try {
        const claims: any = verifyToken(authToken);
        authenticatedUser = { id: claims.sub || claims.id, role: claims.role };
      } catch {
        socket.disconnect(true);
        return;
      }
    }

    // Roles join their respective rooms
    socket.on('join', (data: { role: string, id: string }) => {
      if (!authenticatedUser || data.id !== authenticatedUser.id || data.role !== authenticatedUser.role) return;
      const room = `${data.role}_${data.id}`;
      socket.join(room);
      if (data.role === 'admin') {
        socket.join('admin');
      }
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Restaurant partners also join their restaurant-specific room
    socket.on('join_restaurant', async (data: { restaurant_id: string }) => {
      if (!authenticatedUser || authenticatedUser.role !== 'restaurant_partner') return;
      const partner = await prisma.restaurantPartner.findFirst({
        where: { restaurant_id: data.restaurant_id, is_active: true, OR: [{ phone: (await prisma.user.findUnique({ where: { id: authenticatedUser.id } }))?.phone || '' }] }
      });
      if (!partner) return;
      const room = `restaurant_${data.restaurant_id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined restaurant room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Relay rider's live location to the specific customer
    socket.on('update_location', (data: { customerId: string, orderId: string, lat: number, lng: number }) => {
      io.to(`customer_${data.customerId}`).emit('rider_location_update', {
        orderId: data.orderId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString()
      });
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
