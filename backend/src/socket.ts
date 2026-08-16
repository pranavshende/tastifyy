import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // For MVP, allow all origins
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Roles join their respective rooms
    socket.on('join', (data: { role: string, id: string }) => {
      const room = `${data.role}_${data.id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
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
