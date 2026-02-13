// src/server.ts - REPLACE COMPLETE FILE
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes';
import reviewRoutes from './routes/reviewRoutes';
import dynamicLinkRoutes from './routes/dynamicLinkRoutes';
import heroSlideRoutes from './routes/heroSlideRoutes';
import offerBannerRoutes from './routes/offerBannerRoutes';
import countdownTimerRoutes from './routes/countdownTimerRoutes';


dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// ✨ Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.CLIENT_URL || '*'
    ],
    credentials: true,
  },
});

// Store admin socket connections
const adminSockets = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Admin joins
  socket.on('admin:join', (data) => {
    const adminId = data?.adminId || data?.id || socket.id;
    console.log('👤 Admin joined:', adminId);
    adminSockets.set(adminId, socket.id);
    socket.join('admins');
  });

  // Admin leaves
  socket.on('admin:leave', (data) => {
    const adminId = data?.adminId || data?.id || socket.id;
    console.log('👋 Admin left:', adminId);
    adminSockets.delete(adminId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    // Remove from adminSockets if it was an admin
    for (const [adminId, socketId] of adminSockets.entries()) {
      if (socketId === socket.id) {
        adminSockets.delete(adminId);
        break;
      }
    }
  });
});

// Make io accessible to routes
app.set('io', io);

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

app.use('/api/', apiLimiter);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero-slides', heroSlideRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dynamic-links', dynamicLinkRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/offer-banners', offerBannerRoutes);
app.use('/api/countdown-timers', countdownTimerRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🚀 Server running in ${process.env.NODE_ENV || 'development'} mode      ║
  ║   📡 Port: ${PORT}                           ║
  ║   🌍 URL: http://localhost:${PORT}           ║
  ║   🔌 Socket.IO Ready                      ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);
});

process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

export default app;
export { io };