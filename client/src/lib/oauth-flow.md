# OAuth Flow Process

## Google OAuth:

1. User clicks "Sign in with Google" button
2. Redirect to: `http://localhost:5000/api/v1/auth/oauth/google`
3. Google redirects back to: `http://localhost:5000/api/v1/auth/oauth/google/callback`
4. Backend processes OAuth and returns JSON: `{ user, accessToken }`
5. Backend redirects to: `http://localhost:3000/auth/oauth/success?accessToken=xxx`
6. Frontend saves token and redirects to dashboard

## Facebook OAuth:

1. User clicks "Sign in with Facebook" button
2. Redirect to: `http://localhost:5000/api/v1/auth/oauth/facebook`
3. Facebook redirects back to: `http://localhost:5000/api/v1/auth/oauth/facebook/callback`
4. Backend processes OAuth and returns JSON: `{ user, accessToken }`
5. Backend redirects to: `http://localhost:3000/auth/oauth/success?accessToken=xxx`
6. Frontend saves token and redirects to dashboard
