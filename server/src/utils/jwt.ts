// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';
const ACCESS_EXPIRES = (process.env.ACCESS_TOKEN_EXPIRES_IN ||
  '15m') as jwt.SignOptions['expiresIn'];

export interface AccessTokenPayload {
  sub: string; // user id
  email?: string;
  role?: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
