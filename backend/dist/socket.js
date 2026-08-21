import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
let io;
export const initSocket = (server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                : '*',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // Roles join their respective rooms
        socket.on('join', (data) => {
            const room = `${data.role}_${data.id}`;
            socket.join(room);
            if (data.role === 'admin') {
                socket.join('admin');
            }
            console.log(`Socket ${socket.id} joined room ${room}`);
        });
        // Restaurant partners also join their restaurant-specific room
        socket.on('join_restaurant', (data) => {
            const room = `restaurant_${data.restaurant_id}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined restaurant room ${room}`);
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
        // Relay rider's live location to the specific customer
        socket.on('update_location', (data) => {
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
//# sourceMappingURL=socket.js.map