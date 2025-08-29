// src/utils/crypto.ts
import crypto from 'crypto';

export function randomToken(size = 48): string {
  // returns base64url-safe token
  return crypto.randomBytes(size).toString('base64url');
}

export function sha256hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
