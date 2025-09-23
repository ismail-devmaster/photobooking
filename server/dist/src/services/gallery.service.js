"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGalleryImage = createGalleryImage;
exports.deleteGalleryImage = deleteGalleryImage;
exports.listGalleryForPhotographer = listGalleryForPhotographer;
const prisma_1 = require("../config/prisma");
async function createGalleryImage(photographerId, url, meta) {
    return prisma_1.prisma.galleryImage.create({
        data: { photographerId, url, meta },
    });
}
async function deleteGalleryImage(id, photographerId) {
    const rec = await prisma_1.prisma.galleryImage.findUnique({ where: { id } });
    if (!rec)
        throw new Error('Image not found');
    if (rec.photographerId !== photographerId)
        throw new Error('Not authorized');
    return prisma_1.prisma.galleryImage.delete({ where: { id } });
}
async function listGalleryForPhotographer(photographerId) {
    return prisma_1.prisma.galleryImage.findMany({
        where: { photographerId },
        orderBy: { createdAt: 'desc' },
    });
}
