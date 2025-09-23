// src/services/verification.service.ts
import { prisma } from '../config/prisma';
import { randomToken, sha256hex } from '../utils/crypto';
import { addHours } from 'date-fns';

const EXPIRES_HOURS = Number(process.env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24);

export async function createEmailVerification(userId: string) {
  const plainToken = randomToken(32); // base64url token
  const tokenHash = sha256hex(plainToken);
  const expiresAt = addHours(new Date(), EXPIRES_HOURS);

  // create record
  const rec = await prisma.emailVerification.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { id: rec.id, token: plainToken, expiresAt };
}

export async function verifyEmailToken(userId: string, plainToken: string) {
  const hash = sha256hex(plainToken);
  // find record by userId and tokenHash
  const rec = await prisma.emailVerification.findFirst({
    where: { userId, tokenHash: hash },
  });
  if (!rec) throw new Error('Invalid or missing verification token');
  if (rec.used) throw new Error('Token already used');
  if (rec.expiresAt < new Date()) throw new Error('Token expired');

  // mark used
  await prisma.emailVerification.update({
    where: { id: rec.id },
    data: { used: true },
  });

  // mark user verified
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerifiedAt: new Date() },
  });

  return true;
}

export async function invalidateAllVerificationTokens(userId: string) {
  await prisma.emailVerification.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });
}
