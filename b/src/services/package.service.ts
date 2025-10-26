// package.service.ts
import { prisma } from '../config/prisma';
import { CreatePackageData, UpdatePackageData } from '../types/package';

export async function createPackage(photographerId: string, data: CreatePackageData) {
  return prisma.package.create({
    data: {
      photographerId,
      title: data.title,
      description: data.description,
      priceCents: data.priceCents,
      images: data.imageUrls ? {
        create: data.imageUrls.map((url, index) => ({
          url,
          order: index,
        })),
      } : undefined,
    },
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    },
  });
}

export async function updatePackage(packageId: string, photographerId: string, data: UpdatePackageData) {
  // ensure ownership
  const p = await prisma.package.findUnique({ where: { id: packageId } });
  if (!p) throw new Error('Package not found');
  if (p.photographerId !== photographerId) throw new Error('Not authorized');

  return prisma.package.update({
    where: { id: packageId },
    data: {
      title: data.title ?? undefined,
      description: data.description ?? undefined,
      priceCents: data.priceCents ?? undefined,
      ...(data.imageUrls !== undefined && {
        images: {
          deleteMany: {}, // Remove existing images
          create: data.imageUrls.map((url, index) => ({
            url,
            order: index,
          })),
        },
      }),
    },
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    },
  });
}

export async function deletePackage(packageId: string, photographerId: string) {
  const p = await prisma.package.findUnique({ where: { id: packageId } });
  if (!p) throw new Error('Package not found');
  if (p.photographerId !== photographerId) throw new Error('Not authorized');

  return prisma.package.delete({ where: { id: packageId } });
}

export async function listPackagesForPhotographer(photographerId: string) {
  return prisma.package.findMany({
    where: { photographerId },
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    },
  });
}

export async function listAllPackages(opts?: { page?: number; perPage?: number }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(200, Number(opts?.perPage || 50));
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        photographer: {
          select: { id: true }
        },
        images: {
          orderBy: { order: 'asc' }
        },
      },
      skip,
      take: perPage,
    }),
    prisma.package.count(),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}