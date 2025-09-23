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
exports.facebookCallback = exports.facebookAuth = exports.googleCallback = exports.googleAuth = void 0;
exports.oauthMock = oauthMock;
const passport_1 = __importDefault(require("../config/passport"));
const authService = __importStar(require("../services/auth.service"));
const oauth_service_1 = require("../services/oauth.service");
/**
 * NOTE:
 * - The actual redirect to provider is handled by passport.authenticate.
 * - The callback route uses passport.authenticate to validate and retrieve user (req.user).
 * - After we have user object we create access/refresh tokens and set cookie.
 */
/**
 * GET /api/v1/auth/oauth/google
 * -> redirects to Google consent screen
 */
exports.googleAuth = passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false });
/**
 * GET /api/v1/auth/oauth/google/callback
 */
exports.googleCallback = [
    passport_1.default.authenticate('google', { session: false, failureRedirect: '/auth/oauth/failure' }),
    async (req, res) => {
        try {
            const user = req.user;
            if (!user)
                return res.redirect('/auth/oauth/failure');
            // create session tokens (access + refresh)
            const tokens = await authService.createSessionTokens(user.id);
            // set cookie
            const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
            const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
            const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
            const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
            const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);
            res.cookie(COOKIE_NAME, tokens.refreshToken, {
                httpOnly: COOKIE_HTTP_ONLY,
                secure: COOKIE_SECURE,
                sameSite: COOKIE_SAME_SITE,
                maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
                path: '/',
            });
            // For API usage we return JSON. For web app you may redirect with tokens.
            return res.json({
                user: { id: user.id, email: user.email, name: user.name },
                accessToken: tokens.accessToken,
            });
        }
        catch (err) {
            console.error('OAuth callback error:', err);
            return res.status(500).json({ error: 'OAuth callback failed' });
        }
    },
];
/**
 * Facebook routes
 */
exports.facebookAuth = passport_1.default.authenticate('facebook', { scope: ['email'], session: false });
exports.facebookCallback = [
    passport_1.default.authenticate('facebook', { session: false, failureRedirect: '/auth/oauth/failure' }),
    async (req, res) => {
        try {
            const user = req.user;
            if (!user)
                return res.redirect('/auth/oauth/failure');
            const tokens = await authService.createSessionTokens(user.id);
            const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
            const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
            const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
            const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
            const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);
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
            console.error('OAuth callback error:', err);
            return res.status(500).json({ error: 'OAuth callback failed' });
        }
    },
];
/**
 * Mock route for local testing: POST /api/v1/auth/oauth/mock
 * body: { provider, providerId, email, name }
 * This simulates provider callback (useful when you don't have real client id/secret).
 */
async function oauthMock(req, res) {
    try {
        const { provider, providerId, email, name } = req.body;
        if (!provider || !providerId)
            return res.status(400).json({ error: 'provider and providerId required' });
        // Create or find user via same logic
        const user = await (0, oauth_service_1.findOrCreateUserFromOAuth)({ provider, providerId, email, name });
        // create session tokens
        const tokens = await authService.createSessionTokens(user.id);
        const COOKIE_NAME = process.env.COOKIE_NAME || 'rb_refresh';
        const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || false;
        const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
        const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
        const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);
        res.cookie(COOKIE_NAME, tokens.refreshToken, {
            httpOnly: COOKIE_HTTP_ONLY,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAME_SITE,
            maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken: tokens.accessToken });
    }
    catch (err) {
        console.error('OAuth mock error:', err);
        return res.status(500).json({ error: err.message || 'OAuth mock failed' });
    }
}
