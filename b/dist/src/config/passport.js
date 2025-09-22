"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/passport.ts
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const oauth_service_1 = require("../services/oauth.service");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4000';
/**
 * We register strategies only if credentials exist.
 * The verify callback returns a user object (prisma user) to req.user.
 */
// Google
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${APP_BASE_URL}/api/v1/auth/oauth/google/callback`,
    }, 
    // verify callback
    async (accessToken, refreshToken, profile, done) => {
        try {
            const provider = 'google';
            const providerId = profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;
            // Google usually marks email as verified in profile.emails[0].verified (but not always available)
            const name = profile.displayName || (profile.name && `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim());
            const user = await (0, oauth_service_1.findOrCreateUserFromOAuth)({ provider, providerId, email, name });
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
    console.log('✅ Google OAuth strategy registered');
}
else {
    console.warn('⚠️ Google OAuth not configured (missing client id/secret).');
}
// Facebook
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${APP_BASE_URL}/api/v1/auth/oauth/facebook/callback`,
        profileFields: ['id', 'displayName', 'email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const provider = 'facebook';
            const providerId = profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;
            const name = profile.displayName;
            const user = await (0, oauth_service_1.findOrCreateUserFromOAuth)({ provider, providerId, email, name });
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
    console.log('✅ Facebook OAuth strategy registered');
}
else {
    console.warn('⚠️ Facebook OAuth not configured (missing app id/secret).');
}
exports.default = passport_1.default;
