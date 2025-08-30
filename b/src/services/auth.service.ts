// src/services/auth.service.ts
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { randomToken, sha256hex } from '../utils/crypto';
import { addDays } from 'date-fns';
import { signAccessToken } from '../utils/jwt';

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

export async function registerUser(email: string, password: string, name?: string) {
  const lowered = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: lowered } });
  if (existing) throw new Error('Email already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: lowered,
      passwordHash,
      name,
    },
  });
  return user;
}

export async function verifyPasswordAndGetUser(email: string, password: string) {
  const lowered = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lowered } });
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createSessionTokens(userId: string) {
  // Generate a refresh token (random), store its hash in DB with expiry
  const plainToken = randomToken(64);
  const tokenHash = sha256hex(plainToken);
  const expiresAt = addDays(new Date(), REFRESH_DAYS);

  const tokenRecord = await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  // create access token
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });


  return {
    accessToken,
    refreshToken: plainToken, // return plain to client via cookie
    refreshTokenId: tokenRecord.id,
    refreshTokenExpiresAt: expiresAt,
  };
}

export async function rotateRefreshToken(oldPlainToken: string, userId: string) {
  const oldHash = sha256hex(oldPlainToken);
  const oldRecord = await prisma.refreshToken.findFirst({
    where: { tokenHash: oldHash, userId },
  });
  if (!oldRecord) throw new Error('Invalid refresh token');

  if (oldRecord.revoked) throw new Error('Refresh token revoked');
  if (oldRecord.expiresAt < new Date()) throw new Error('Refresh token expired');

  // revoke the old token and create a new one
  await prisma.refreshToken.update({
    where: { id: oldRecord.id },
    data: { revoked: true },
  });

  const newPlain = randomToken(64);
  const newHash = sha256hex(newPlain);
  const newExpiresAt = addDays(new Date(), REFRESH_DAYS);

  const newRecord = await prisma.refreshToken.create({
    data: {
      tokenHash: newHash,
      userId,
      expiresAt: newExpiresAt,
      replacedById: null,
    },
  });

  // set replacedById for traceability
  await prisma.refreshToken.update({
    where: { id: oldRecord.id },
    data: { replacedById: newRecord.id },
  });

  // new access token
  const accessToken = signAccessToken({ sub: userId });

  return {
    accessToken,
    refreshToken: newPlain,
    refreshTokenId: newRecord.id,
    expiresAt: newExpiresAt,
  };
}

export async function revokeRefreshTokenByValue(plainToken: string) {
  const hash = sha256hex(plainToken);
  const rec = await prisma.refreshToken.findFirst({ where: { tokenHash: hash } });
  if (!rec) return false;
  await prisma.refreshToken.update({ where: { id: rec.id }, data: { revoked: true } });
  return true;
}

// helper to revoke all tokens for a user (logout everywhere)
export async function revokeAllRefreshTokensForUser(userId: string) {
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
}
