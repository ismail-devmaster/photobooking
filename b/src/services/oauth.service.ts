// src/services/oauth.service.ts
import { prisma } from '../config/prisma';

type OAuthInput = {
  provider: string; // e.g. 'google' | 'facebook'
  providerId: string;
  email?: string | null;
  name?: string | null;
};

/**
 * Attempts to find an existing OAuthAccount, otherwise:
 * - if email exists and a user exists with that email -> link OAuthAccount to that user
 * - if email exists and no user -> create user (emailVerified=true) + OAuthAccount
 * - if no email -> throw (for now) - instruct front-end to request email (provider sometimes doesn't return email)
 */
export async function findOrCreateUserFromOAuth({ provider, providerId, email, name }: OAuthInput) {
  // 1) try find oauth account
  const existingOauth = await prisma.oAuthAccount.findFirst({
    where: { provider, providerAccountId: providerId },
    include: { user: true },
  });

  if (existingOauth && existingOauth.user) {
    return existingOauth.user;
  }

  // 2) If provider gave email, try to find user by email
  if (email) {
    const lower = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: lower } });
    if (existingUser) {
      // create OAuthAccount linking to this existing user
      await prisma.oAuthAccount.create({
        data: {
          provider,
          providerAccountId: providerId,
          userId: existingUser.id,
        },
      });
      return existingUser;
    }

    // 3) No existing user: create new user and link OAuthAccount
    const newUser = await prisma.user.create({
      data: {
        email: lower,
        name: name ?? undefined,
        emailVerified: true, // mark as verified because provider gave the email
      },
    });

    await prisma.oAuthAccount.create({
      data: {
        provider,
        providerAccountId: providerId,
        userId: newUser.id,
      },
    });

    return newUser;
  }

  // 4) No email from provider: we can't create a user without email (schema requires it)
  // Alternative flows: send back profile and ask client for email to link (not implemented here)
  throw new Error(
    `OAuth provider (${provider}) did not return an email. Please use email signup or link an email to your account.`,
  );
}
