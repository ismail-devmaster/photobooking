"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackage = createPackage;
exports.updatePackage = updatePackage;
exports.deletePackage = deletePackage;
exports.listPackagesForPhotographer = listPackagesForPhotographer;
const prisma_1 = require("../config/prisma");
async function createPackage(photographerId, data) {
    return prisma_1.prisma.package.create({
        data: {
            photographerId,
            title: data.title,
            description: data.description,
            priceCents: data.priceCents,
        },
    });
}
async function updatePackage(packageId, photographerId, data) {
    // ensure ownership
    const p = await prisma_1.prisma.package.findUnique({ where: { id: packageId } });
    if (!p)
        throw new Error('Package not found');
    if (p.photographerId !== photographerId)
        throw new Error('Not authorized');
    return prisma_1.prisma.package.update({
        where: { id: packageId },
        data: {
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            priceCents: data.priceCents ?? undefined,
        },
    });
}
async function deletePackage(packageId, photographerId) {
    const p = await prisma_1.prisma.package.findUnique({ where: { id: packageId } });
    if (!p)
        throw new Error('Package not found');
    if (p.photographerId !== photographerId)
        throw new Error('Not authorized');
    return prisma_1.prisma.package.delete({ where: { id: packageId } });
}
async function listPackagesForPhotographer(photographerId) {
    return prisma_1.prisma.package.findMany({
        where: { photographerId },
        orderBy: { createdAt: 'desc' },
    });
}
