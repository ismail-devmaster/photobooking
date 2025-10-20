import type { Role, User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      userRole: Role;
      user: User;
      locale: string;
      t: (key: string, vars?: Record<string, any>) => string;
    }
  }
}
