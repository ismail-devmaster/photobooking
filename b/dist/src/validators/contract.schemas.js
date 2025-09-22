"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractIdParam = exports.signContractSchema = exports.generateContractSchema = void 0;
// src/validators/contract.schemas.ts
const zod_1 = require("zod");
exports.generateContractSchema = zod_1.z.object({
    bookingId: zod_1.z.string().cuid(),
});
exports.signContractSchema = zod_1.z.object({
    signatureDataUrl: zod_1.z.string().min(20), // data:image/png;base64,.... or raw base64
    // optional typed name:
    signerName: zod_1.z.string().max(200).optional(),
});
exports.contractIdParam = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
