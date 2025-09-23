"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateUserFromOAuth = findOrCreateUserFromOAuth;
// src/services/oauth.service.ts
const prisma_1 = require("../config/prisma");
/**
 * Attempts to find an existing OAuthAccount, otherwise:
 * - if email exists and a user exists with that email -> link OAuthAccount to that user
 * - if email exists and no user -> create user (emailVerified=true) + OAuthAccount
 * - if no email -> throw (for now) - instruct front-end to request email (provider sometimes doesn't return email)
 */
async function findOrCreateUserFromOAuth({ provider, providerId, email, name }) {
    // 1) try find oauth account
    const existingOauth = await prisma_1.prisma.oAuthAccount.findFirst({
        where: { provider, providerAccountId: providerId },
        include: { user: true },
    });
    if (existingOauth && existingOauth.user) {
        return existingOauth.user;
    }
    // 2) If provider gave email, try to find user by email
    if (email) {
        const lower = email.toLowerCase();
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email: lower } });
        if (existingUser) {
            // create OAuthAccount linking to this existing user
            await prisma_1.prisma.oAuthAccount.create({
                data: {
                    provider,
                    providerAccountId: providerId,
                    userId: existingUser.id,
                },
            });
            return existingUser;
        }
        // 3) No existing user: create new user and link OAuthAccount
        const newUser = await prisma_1.prisma.user.create({
            data: {
                email: lower,
                name: name ?? undefined,
                emailVerified: true, // mark as verified because provider gave the email
            },
        });
        await prisma_1.prisma.oAuthAccount.create({
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
    throw new Error(`OAuth provider (${provider}) did not return an email. Please use email signup or link an email to your account.`);
}
