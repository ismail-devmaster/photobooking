"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.photographerListQuery = void 0;
const zod_1 = require("zod");
exports.photographerListQuery = zod_1.z.object({
    stateId: zod_1.z.string().cuid().optional(),
    serviceId: zod_1.z.string().cuid().optional(),
    minPrice: zod_1.z.preprocess((v) => v === undefined || v === '' ? undefined : Number(v), zod_1.z.number().int().min(0).optional()),
    maxPrice: zod_1.z.preprocess((v) => v === undefined || v === '' ? undefined : Number(v), zod_1.z.number().int().min(0).optional()),
    q: zod_1.z.string().max(200).optional(),
    tags: zod_1.z.string().optional(), // comma separated
    sort: zod_1.z.enum(['rating_desc', 'price_asc', 'price_desc', 'newest']).optional(),
    // Ensure undefined/empty strings use defaults instead of NaN failing validation
    page: zod_1.z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), zod_1.z.number().int().positive().default(1)),
    perPage: zod_1.z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), zod_1.z.number().int().positive().default(12)),
});
