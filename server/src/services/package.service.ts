import { prisma } from '../config/prisma';

export async function createPackage(photographerId: string, data: { title: string; description?: string; priceCents: number }) {
  return prisma.package.create({
    data: {
      photographerId,
      title: data.title,
      description: data.description,
      priceCents: data.priceCents,
    },
  });
}

export async function updatePackage(packageId: string, photographerId: string, data: any) {
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
  });
}
