"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
const authService = __importStar(require("../services/auth.service"));
const prisma_1 = require("../config/prisma");
const verification_service_1 = require("../services/verification.service");
const email_service_1 = require("../services/email.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false'; // default true
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);
async function register(req, res) {
    try {
        const { email, password, name } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password required' });
        // create user but don't create session yet
        const lowered = email.toLowerCase();
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: lowered } });
        if (existing)
            return res.status(400).json({ error: 'Email already in use' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: lowered,
                passwordHash,
                name,
                emailVerified: false,
            },
        });
        // create verification token & send email
        const { token } = await (0, verification_service_1.createEmailVerification)(user.id);
        await (0, email_service_1.sendVerificationEmail)(user.email, user.name, token, user.id);
        return res
            .status(201)
            .json({ message: 'User created. Please check your email to verify your account.' });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message || 'Registration failed' });
    }
}
async function verifyEmail(req, res) {
    try {
        const { token, uid } = req.query;
        if (!token || !uid)
            return res.status(400).json({ error: 'Missing token or uid' });
        const tokenStr = String(token);
        const userId = String(uid);
        await (0, verification_service_1.verifyEmailToken)(userId, tokenStr);
        // After successful verification, create session tokens and set cookie
        const tokens = await authService.createSessionTokens(userId);
        res.cookie(COOKIE_NAME, tokens.refreshToken, {
            httpOnly: COOKIE_HTTP_ONLY,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAME_SITE,
            maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return res.json({ message: 'Email verified', accessToken: tokens.accessToken });
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Verification failed' });
    }
}
// resend verification
async function resendVerification(req, res) {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email required' });
        const lowered = String(email).toLowerCase();
        const user = await prisma_1.prisma.user.findUnique({ where: { email: lowered } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        if (user.emailVerified)
            return res.status(400).json({ error: 'Email already verified' });
        // invalidate old tokens and create new one
        await (0, verification_service_1.invalidateAllVerificationTokens)(user.id);
        const { token } = await (0, verification_service_1.createEmailVerification)(user.id);
        await (0, email_service_1.sendVerificationEmail)(user.email, user.name, token, user.id);
        return res.json({ message: 'Verification email resent' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Could not resend verification' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password required' });
        const user = await authService.verifyPasswordAndGetUser(email, password);
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        // 🚨 منع الدخول إذا لم يتم تفعيل الإيميل
        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Email not verified. Please check your inbox to verify your account.',
            });
        }
        if (user.disabled)
            return res.status(403).json({ error: 'Account disabled' });
        const tokens = await authService.createSessionTokens(user.id);
        res.cookie(COOKIE_NAME, tokens.refreshToken, {
            httpOnly: COOKIE_HTTP_ONLY,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAME_SITE,
            maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return res.json({
            user: { id: user.id, email: user.email, name: user.name },
            accessToken: tokens.accessToken,
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Login failed' });
    }
}
async function refresh(req, res) {
    try {
        const token = req.cookies[COOKIE_NAME];
        if (!token)
            return res.status(401).json({ error: 'No refresh token' });
        const { sha256hex } = require('../utils/crypto');
        const tokenHash = sha256hex(token);
        const record = await prisma_1.prisma.refreshToken.findFirst({ where: { tokenHash: tokenHash } });
        if (!record)
            return res.status(401).json({ error: 'Invalid refresh token' });
        if (record.revoked)
            return res.status(401).json({ error: 'Refresh token is revoked' });
        if (record.expiresAt < new Date())
            return res.status(401).json({ error: 'Refresh token expired' });
        // rotate token
        const rotated = await authService.rotateRefreshToken(token, record.userId);
        // set new refresh cookie
        const COOKIE_NAME_LOCAL = COOKIE_NAME;
        res.cookie(COOKIE_NAME_LOCAL, rotated.refreshToken, {
            httpOnly: COOKIE_HTTP_ONLY,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAME_SITE,
            maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return res.json({ accessToken: rotated.accessToken });
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Could not refresh token' });
    }
}
async function logout(req, res) {
    try {
        const token = req.cookies[COOKIE_NAME];
        if (token) {
            await authService.revokeRefreshTokenByValue(token);
        }
        // clear cookie
        res.clearCookie(COOKIE_NAME, { path: '/' });
        return res.json({ ok: true });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Logout failed' });
    }
}
// Example protected endpoint to return current user
async function me(req, res) {
    // the auth middleware will attach req.user with id
    const userId = req.userId;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            photographer: {
                include: {
                    services: true,
                    portfolios: true,
                },
            },
        },
    });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    // 🚨 تأكد أن البريد مفعّل
    if (!user.emailVerified) {
        return res.status(403).json({ error: 'Email not verified' });
    }
    // Return the full user object with photographer relation
    return res.json(user);
}
