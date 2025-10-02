// src/services/adminUser.service.ts
import { prisma } from '../config/prisma';

/**
 * List users with pagination and optional filter
 */
export async function listUsers(opts?: { page?: number; perPage?: number; role?: string | null; search?: string | null }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(200, Number(opts?.perPage || 50));
  const skip = (page - 1) * perPage;

  const where: any = {};
  if (opts?.role) where.role = opts.role;
  if (opts?.search) {
    where.OR = [
      { email: { contains: opts.search, mode: 'insensitive' } },
      { name: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        disabled: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    meta: { total, page, perPage, pages: Math.ceil(total / perPage) },
  };
}

/**
 * Set disabled status for a user
 */
export async function setUserDisabled(adminId: string, userId: string, disabled: boolean) {
  // optional: prevent admin from disabling themselves
  if (adminId === userId) {
    throw new Error('Admins cannot disable their own account');
  }

  // update
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { disabled },
    select: {
      id: true,
      email: true,
      disabled: true,
      role: true,
      updatedAt: true,
    },
  });

  return updated;
}

/**
 * Delete a user permanently
 */
export async function deleteUser(adminId: string, userId: string) {
  // Prevent admin from deleting themselves
  if (adminId === userId) {
    throw new Error('Admins cannot delete their own account');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }

  // Delete the user - cascading deletes will handle related records
  await prisma.user.delete({
    where: { id: userId }
  });

  return { deletedUser: user };
}