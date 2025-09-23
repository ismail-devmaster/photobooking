"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.verifyPasswordAndGetUser = verifyPasswordAndGetUser;
exports.createSessionTokens = createSessionTokens;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeRefreshTokenByValue = revokeRefreshTokenByValue;
exports.revokeAllRefreshTokensForUser = revokeAllRefreshTokensForUser;
// src/services/auth.service.ts
const prisma_1 = require("../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("../utils/crypto");
const date_fns_1 = require("date-fns");
const jwt_1 = require("../utils/jwt");
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);
async function registerUser(email, password, name) {
    const lowered = email.toLowerCase();
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: lowered } });
    if (existing)
        throw new Error('Email already taken');
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: lowered,
            passwordHash,
            name,
        },
    });
    return user;
}
async function verifyPasswordAndGetUser(email, password) {
    const lowered = email.toLowerCase();
    const user = await prisma_1.prisma.user.findUnique({ where: { email: lowered } });
    if (!user || !user.passwordHash)
        return null;
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return null;
    return user;
}
async function createSessionTokens(userId) {
    // Generate a refresh token (random), store its hash in DB with expiry
    const plainToken = (0, crypto_1.randomToken)(64);
    const tokenHash = (0, crypto_1.sha256hex)(plainToken);
    const expiresAt = (0, date_fns_1.addDays)(new Date(), REFRESH_DAYS);
    const tokenRecord = await prisma_1.prisma.refreshToken.create({
        data: {
            tokenHash,
            userId,
            expiresAt,
        },
    });
    // create access token
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    const accessToken = (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role, email: user.email });
    return {
        accessToken,
        refreshToken: plainToken, // return plain to client via cookie
        refreshTokenId: tokenRecord.id,
        refreshTokenExpiresAt: expiresAt,
    };
}
async function rotateRefreshToken(oldPlainToken, userId) {
    const oldHash = (0, crypto_1.sha256hex)(oldPlainToken);
    const oldRecord = await prisma_1.prisma.refreshToken.findFirst({
        where: { tokenHash: oldHash, userId },
    });
    if (!oldRecord)
        throw new Error('Invalid refresh token');
    if (oldRecord.revoked)
        throw new Error('Refresh token revoked');
    if (oldRecord.expiresAt < new Date())
        throw new Error('Refresh token expired');
    // revoke the old token and create a new one
    await prisma_1.prisma.refreshToken.update({
        where: { id: oldRecord.id },
        data: { revoked: true },
    });
    const newPlain = (0, crypto_1.randomToken)(64);
    const newHash = (0, crypto_1.sha256hex)(newPlain);
    const newExpiresAt = (0, date_fns_1.addDays)(new Date(), REFRESH_DAYS);
    const newRecord = await prisma_1.prisma.refreshToken.create({
        data: {
            tokenHash: newHash,
            userId,
            expiresAt: newExpiresAt,
            replacedById: null,
        },
    });
    // set replacedById for traceability
    await prisma_1.prisma.refreshToken.update({
        where: { id: oldRecord.id },
        data: { replacedById: newRecord.id },
    });
    // new access token
    const accessToken = (0, jwt_1.signAccessToken)({ sub: userId });
    return {
        accessToken,
        refreshToken: newPlain,
        refreshTokenId: newRecord.id,
        expiresAt: newExpiresAt,
    };
}
async function revokeRefreshTokenByValue(plainToken) {
    const hash = (0, crypto_1.sha256hex)(plainToken);
    const rec = await prisma_1.prisma.refreshToken.findFirst({ where: { tokenHash: hash } });
    if (!rec)
        return false;
    await prisma_1.prisma.refreshToken.update({ where: { id: rec.id }, data: { revoked: true } });
    return true;
}
// helper to revoke all tokens for a user (logout everywhere)
async function revokeAllRefreshTokensForUser(userId) {
    await prisma_1.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
}
