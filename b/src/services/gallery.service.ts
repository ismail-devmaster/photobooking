import { prisma } from '../config/prisma';

export async function createGalleryImage(photographerId: string, url: string, meta?: any) {
  return prisma.galleryImage.create({
    data: { photographerId, url, meta },
  });
}

export async function deleteGalleryImage(id: string, photographerId: string) {
  const rec = await prisma.galleryImage.findUnique({ where: { id } });
  if (!rec) throw new Error('Image not found');
  if (rec.photographerId !== photographerId) throw new Error('Not authorized');

  return prisma.galleryImage.delete({ where: { id } });
}

export async function listGalleryForPhotographer(photographerId: string) {
  return prisma.galleryImage.findMany({
    where: { photographerId },
    orderBy: { createdAt: 'desc' },
  });
}
