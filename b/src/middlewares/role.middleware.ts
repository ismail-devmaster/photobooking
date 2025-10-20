import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

// keep behavior: expects authenticateAccessToken to have set req.userRole
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.userRole;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
