"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailVerification = createEmailVerification;
exports.verifyEmailToken = verifyEmailToken;
exports.invalidateAllVerificationTokens = invalidateAllVerificationTokens;
// src/services/verification.service.ts
const prisma_1 = require("../config/prisma");
const crypto_1 = require("../utils/crypto");
const date_fns_1 = require("date-fns");
const EXPIRES_HOURS = Number(process.env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24);
async function createEmailVerification(userId) {
    const plainToken = (0, crypto_1.randomToken)(32); // base64url token
    const tokenHash = (0, crypto_1.sha256hex)(plainToken);
    const expiresAt = (0, date_fns_1.addHours)(new Date(), EXPIRES_HOURS);
    // create record
    const rec = await prisma_1.prisma.emailVerification.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });
    return { id: rec.id, token: plainToken, expiresAt };
}
async function verifyEmailToken(userId, plainToken) {
    const hash = (0, crypto_1.sha256hex)(plainToken);
    // find record by userId and tokenHash
    const rec = await prisma_1.prisma.emailVerification.findFirst({
        where: { userId, tokenHash: hash },
    });
    if (!rec)
        throw new Error('Invalid or missing verification token');
    if (rec.used)
        throw new Error('Token already used');
    if (rec.expiresAt < new Date())
        throw new Error('Token expired');
    // mark used
    await prisma_1.prisma.emailVerification.update({
        where: { id: rec.id },
        data: { used: true },
    });
    // mark user verified
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
    return true;
}
async function invalidateAllVerificationTokens(userId) {
    await prisma_1.prisma.emailVerification.updateMany({
        where: { userId, used: false },
        data: { used: true },
    });
}
