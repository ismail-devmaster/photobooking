import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

/**
 * Verifies Bearer token, loads user from DB and attaches:
 *  - req.userId
 *  - req.userRole
 *  - req.user (full user record)
 *
 * This guarantees requireRole will always have a reliable value.
 */
export async function authenticateAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyAccessToken(token);
    if (!payload || !payload.sub) return res.status(401).json({ error: 'Invalid or expired token' });

    // Load user from DB to ensure role and emailVerified are fresh
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Optional: block access if email not verified (project requirement)
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Attach strongly to request for downstream middlewares/controllers
    req.userId = user.id;
    req.userRole = user.role as Role;
    req.user = user;

    next();
  } catch (err: any) {
    console.error('authenticateAccessToken error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
