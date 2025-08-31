// src/server.ts
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import profileRoutes from './routes/profile.routes';
import packageRoutes from './routes/package.routes';
import galleryRoutes from './routes/gallery.routes';
import path from 'path';
import bookingRoutes from './routes/booking.routes';


import './config/passport'; // initialize passport strategies
import passport from 'passport';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/oauth', oauthRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/gallery', galleryRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/v1/bookings', bookingRoutes);




// global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
