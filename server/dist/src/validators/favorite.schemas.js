"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFavoritesQuery = exports.photographerIdParam = void 0;
const zod_1 = require("zod");
exports.photographerIdParam = zod_1.z.object({
    photographerId: zod_1.z.string().cuid(),
});
exports.listFavoritesQuery = zod_1.z.object({
    page: zod_1.z.preprocess((v) => Number(v), zod_1.z.number().int().positive().optional()),
    perPage: zod_1.z.preprocess((v) => Number(v), zod_1.z.number().int().positive().optional()),
});
