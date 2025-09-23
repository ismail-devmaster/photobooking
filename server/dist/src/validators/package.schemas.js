"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePackageSchema = exports.createPackageSchema = void 0;
const zod_1 = require("zod");
exports.createPackageSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().max(2000).optional(),
    priceCents: zod_1.z.number().int().nonnegative(),
});
exports.updatePackageSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200).optional(),
    description: zod_1.z.string().max(2000).optional(),
    priceCents: zod_1.z.number().int().nonnegative().optional(),
});
