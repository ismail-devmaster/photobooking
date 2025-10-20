// src/middlewares/isAdmin.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Ensure the current request is made by an ADMIN user.
 * - expects authenticateAccessToken to have set req.userId and optionally userRole
 * - if userRole missing, fetch user from DB and attach
 */
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // If role already attached from token middleware, use it
    let role = req.userRole;
    if (!role) {
      // fetch user role
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, disabled: true } });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      req.userRole = user.role;
      role = user.role;
    }

    if (role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }

    // also ensure admin account not disabled
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { disabled: true } });
    if (user?.disabled === true) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    return next();
  } catch (err: any) {
    console.error('isAdmin error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
