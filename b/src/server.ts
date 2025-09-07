// src/server.ts
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import profileRoutes from './routes/profile.routes';
import packageRoutes from './routes/package.routes';
import galleryRoutes from './routes/gallery.routes';
import bookingRoutes from './routes/booking.routes';
import favoritesRoutes from './routes/favorite.routes';
import reviewRoutes from './routes/review.routes';
import adminReviewRoutes from './routes/admin.review.routes';
import conversationRoutes from './routes/conversation.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import contractRoutes from './routes/contract.routes';
import adminUserRoutes from './routes/admin.users.routes';




import './config/passport'; // initialize passport strategies
import passport from 'passport';

// --- App setup ---
const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/oauth', oauthRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/gallery', galleryRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/admin', adminUserRoutes);

// --- Global error handler ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- HTTP + Socket.IO setup ---
const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: '*' }, // تقدر تخصص الدومين المسموح
});

// --- User socket mapping ---
const userSockets = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // المصادقة البسيطة عبر userId (يمكن تطويرها لاحقاً باستخدام JWT)
  socket.on('register', (userId: string) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered on socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) {
        userSockets.delete(uid);
        console.log(`User ${uid} disconnected`);
        break;
      }
    }
  });
});

// --- Emitter function to use in services ---
export function emitToUser(userId: string, event: string, payload: any) {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, payload);
  }
}

// --- Start server ---
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
