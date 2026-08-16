import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket.js';

import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';

import passport from './config/passport.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Tastifyy API is running!' });
});

// Create HTTP server & initialize Socket.io
const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
