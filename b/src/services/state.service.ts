// src/services/state.service.ts
import { prisma } from '../config/prisma';

export async function listStates(opts?: { search?: string | null; page?: number; perPage?: number }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(200, Number(opts?.perPage || 100));
  const skip = (page - 1) * perPage;

  const where: any = {};
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { code: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.state.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: perPage,
      select: { id: true, name: true, code: true },
    }),
    prisma.state.count({ where }),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

export async function listAllStates() {
  return prisma.state.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
}


