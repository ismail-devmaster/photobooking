"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackage = createPackage;
exports.updatePackage = updatePackage;
exports.deletePackage = deletePackage;
exports.listPackagesForPhotographer = listPackagesForPhotographer;
exports.listAllPackages = listAllPackages;
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
async function listAllPackages(opts) {
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(200, Number(opts?.perPage || 50));
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
        prisma_1.prisma.package.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                photographer: {
                    select: { id: true }
                },
            },
            skip,
            take: perPage,
        }),
        prisma_1.prisma.package.count(),
    ]);
    return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
