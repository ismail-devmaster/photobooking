
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { prisma } from '../config/prisma';
import { createEmailVerification, verifyEmailToken, invalidateAllVerificationTokens } from '../services/verification.service';
import { sendVerificationEmail } from '../services/email.service';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false'; // default true
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // create user but don't create session yet
    const lowered = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: lowered } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: lowered,
        passwordHash,
        name,
        emailVerified: false,
      },
    });

    // create verification token & send email
    const { token } = await createEmailVerification(user.id);
    await sendVerificationEmail(user.email, user.name, token, user.id);

    return res
      .status(201)
      .json({ message: 'User created. Please check your email to verify your account.' });
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token, uid } = req.query;
    if (!token || !uid) return res.status(400).json({ error: 'Missing token or uid' });

    const tokenStr = String(token);
    const userId = String(uid);

    await verifyEmailToken(userId, tokenStr);

    // After successful verification, create session tokens and set cookie
    const tokens = await authService.createSessionTokens(userId);

    res.cookie(COOKIE_NAME, tokens.refreshToken, {
      httpOnly: COOKIE_HTTP_ONLY,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ message: 'Email verified', accessToken: tokens.accessToken });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Verification failed' });
  }
}

// resend verification
export async function resendVerification(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const lowered = String(email).toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: lowered } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    // invalidate old tokens and create new one
    await invalidateAllVerificationTokens(user.id);
    const { token } = await createEmailVerification(user.id);
    await sendVerificationEmail(user.email, user.name, token, user.id);

    return res.json({ message: 'Verification email resent' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Could not resend verification' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await authService.verifyPasswordAndGetUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // 🚨 منع الدخول إذا لم يتم تفعيل الإيميل
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email not verified. Please check your inbox to verify your account.',
      });
    }
    if (user.disabled) return res.status(403).json({ error: 'Account disabled' });

    const tokens = await authService.createSessionTokens(user.id);

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
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const { sha256hex } = require('../utils/crypto');
    const tokenHash = sha256hex(token);
    const record = await prisma.refreshToken.findFirst({ where: { tokenHash: tokenHash } });

    if (!record) return res.status(401).json({ error: 'Invalid refresh token' });
    if (record.revoked) return res.status(401).json({ error: 'Refresh token is revoked' });
    if (record.expiresAt < new Date())
      return res.status(401).json({ error: 'Refresh token expired' });

    // rotate token
    const rotated = await authService.rotateRefreshToken(token, record.userId);

    // set new refresh cookie
    const COOKIE_NAME_LOCAL = COOKIE_NAME;
    res.cookie(COOKIE_NAME_LOCAL, rotated.refreshToken, {
      httpOnly: COOKIE_HTTP_ONLY,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ accessToken: rotated.accessToken });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (token) {
      await authService.revokeRefreshTokenByValue(token);
    }
    // clear cookie
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Logout failed' });
  }
}

// Example protected endpoint to return current user
export async function me(req: Request, res: Response) {
  // the auth middleware will attach req.user with id
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: {
      photographer: {
        include: {
          services: true,
          portfolios: true,
        },
      },
    },
  });
  
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 🚨 تأكد أن البريد مفعّل
  if (!user.emailVerified) {
    return res.status(403).json({ error: 'Email not verified' });
  }

  // Return the full user object with photographer relation
  return res.json(user);
}
