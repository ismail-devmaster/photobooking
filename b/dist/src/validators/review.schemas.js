"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewIdParam = exports.adminReviewActionSchema = exports.createReviewSchema = void 0;
// src/validators/review.schemas.ts
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    bookingId: zod_1.z.string().cuid(),
    rating: zod_1.z.number().int().min(1).max(5),
    text: zod_1.z.string().max(2000).optional(),
});
exports.adminReviewActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['approve', 'reject']),
    reason: zod_1.z.string().max(1000).optional(),
});
exports.reviewIdParam = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
