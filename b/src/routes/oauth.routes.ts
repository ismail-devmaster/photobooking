// src/routes/oauth.routes.ts
import { Router } from 'express';
import passport from '../config/passport';
import {
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  oauthMock,
} from '../controllers/oauth.controller';

const router = Router();

// Google
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Facebook
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookCallback);

// Mock (POST) for dev/testing
router.post('/mock', oauthMock);

export default router;
