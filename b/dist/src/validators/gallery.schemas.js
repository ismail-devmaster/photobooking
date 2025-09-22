"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageSchema = void 0;
const zod_1 = require("zod");
exports.uploadImageSchema = zod_1.z.object({
    // file validated by multer; optional meta as JSON string in body
    meta: zod_1.z.string().optional(),
});
