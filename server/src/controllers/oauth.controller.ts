// src/controllers/oauth.controller.ts
import { Request, Response } from 'express';
import passport from '../config/passport';
import * as authService from '../services/auth.service';
import { findOrCreateUserFromOAuth } from '../services/oauth.service';
import { prisma } from '../config/prisma';

/**
 * NOTE:
 * - The actual redirect to provider is handled by passport.authenticate.
 * - The callback route uses passport.authenticate to validate and retrieve user (req.user).
 * - After we have user object we create access/refresh tokens and set cookie.
 */

/**
 * GET /api/v1/auth/oauth/google
 * -> redirects to Google consent screen
 */
export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

/**
 * GET /api/v1/auth/oauth/google/callback
 */
export const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: '/auth/oauth/failure' }),
  async (req: Request, res: Response) => {
    try {
      const user = (req.user as any);
      if (!user) return res.redirect('/auth/oauth/failure');

      // create session tokens (access + refresh)
      const tokens = await authService.createSessionTokens(user.id);

      // set cookie
      const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
      const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
      const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
      const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
      const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

      res.cookie(COOKIE_NAME, tokens.refreshToken, {
        httpOnly: COOKIE_HTTP_ONLY,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
      });

      // For API usage we return JSON. For web app you may redirect with tokens.
      return res.json({
        user: { id: user.id, email: user.email, name: user.name },
        accessToken: tokens.accessToken,
      });
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      return res.status(500).json({ error: 'OAuth callback failed' });
    }
  },
];

/**
 * Facebook routes
 */
export const facebookAuth = passport.authenticate('facebook', { scope: ['email'], session: false });

export const facebookCallback = [
  passport.authenticate('facebook', { session: false, failureRedirect: '/auth/oauth/failure' }),
  async (req: Request, res: Response) => {
    try {
      const user = (req.user as any);
      if (!user) return res.redirect('/auth/oauth/failure');

      const tokens = await authService.createSessionTokens(user.id);

      const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
      const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
      const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
      const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
      const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

      res.cookie(COOKIE_NAME, tokens.refreshToken, {
        httpOnly: COOKIE_HTTP_ONLY,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        user: { id: user.id, email: user.email, name: user.name },
        accessToken: tokens.accessToken,
      });
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      return res.status(500).json({ error: 'OAuth callback failed' });
    }
  },
];

/**
 * Mock route for local testing: POST /api/v1/auth/oauth/mock
 * body: { provider, providerId, email, name }
 * This simulates provider callback (useful when you don't have real client id/secret).
 */
export async function oauthMock(req: Request, res: Response) {
  try {
    const { provider, providerId, email, name } = req.body;
    if (!provider || !providerId) return res.status(400).json({ error: 'provider and providerId required' });

    // Create or find user via same logic
    const user = await findOrCreateUserFromOAuth({ provider, providerId, email, name });

    // create session tokens
    const tokens = await authService.createSessionTokens(user.id);

    const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
    const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
    const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
    const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
    const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

    res.cookie(COOKIE_NAME, tokens.refreshToken, {
      httpOnly: COOKIE_HTTP_ONLY,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken: tokens.accessToken });
  } catch (err: any) {
    console.error('OAuth mock error:', err);
    return res.status(500).json({ error: err.message || 'OAuth mock failed' });
  }
}
