// src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { findOrCreateUserFromOAuth } from '../services/oauth.service';

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
  passport.use(
    new GoogleStrategy(
      {
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
          const user = await findOrCreateUserFromOAuth({ provider, providerId, email, name });
          return done(null, user);
        } catch (err) {
          return done(err as any);
        }
      },
    ),
  );
  console.log('✅ Google OAuth strategy registered');
} else {
  console.warn('⚠️ Google OAuth not configured (missing client id/secret).');
}

// Facebook
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${APP_BASE_URL}/api/v1/auth/oauth/facebook/callback`,
        profileFields: ['id', 'displayName', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const provider = 'facebook';
          const providerId = profile.id;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;
          const name = profile.displayName;
          const user = await findOrCreateUserFromOAuth({ provider, providerId, email, name });
          return done(null, user);
        } catch (err) {
          return done(err as any);
        }
      },
    ),
  );
  console.log('✅ Facebook OAuth strategy registered');
} else {
  console.warn('⚠️ Facebook OAuth not configured (missing app id/secret).');
}

export default passport;
