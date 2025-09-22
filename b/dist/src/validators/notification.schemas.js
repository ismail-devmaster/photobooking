"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationIdParam = exports.listNotificationsQuery = void 0;
// src/validators/notification.schemas.ts
const zod_1 = require("zod");
exports.listNotificationsQuery = zod_1.z.object({
    page: zod_1.z.preprocess((v) => (v === undefined ? 1 : Number(v)), zod_1.z.number().int().positive().default(1)),
    perPage: zod_1.z.preprocess((v) => (v === undefined ? 20 : Number(v)), zod_1.z.number().int().positive().default(20)),
});
exports.notificationIdParam = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
