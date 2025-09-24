// OAuth service layer
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1';

// Google OAuth
export const getGoogleAuthUrl = () => {
  return `${API_BASE}/auth/oauth/google`;
};

// Facebook OAuth
export const getFacebookAuthUrl = () => {
  return `${API_BASE}/auth/oauth/facebook`;
};

// Google OAuth callback handler
export const handleGoogleCallback = async (code: string, state?: string) => {
  try {
    // الواجهة الخلفية ستعالج callback وترجع JSON
    // نحتاج إلى معالجة redirect في الواجهة الأمامية
    const callbackUrl = `${API_BASE}/auth/oauth/google/callback?code=${code}${
      state ? `&state=${state}` : ''
    }`;

    // نستخدم window.location ل redirects لأن OAuth يتطلب redirect
    window.location.href = callbackUrl;
    return null; // لا نحتاج للعودة لأن الواجهة الخلفية ستعيد التوجيه
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    throw error;
  }
};

// Facebook OAuth callback handler
export const handleFacebookCallback = async (code: string, state?: string) => {
  try {
    const callbackUrl = `${API_BASE}/auth/oauth/facebook/callback?code=${code}${
      state ? `&state=${state}` : ''
    }`;
    window.location.href = callbackUrl;
    return null;
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    throw error;
  }
};

// OAuth callback handler (للمعالجة بعد redirect من الواجهة الخلفية)
export const processOAuthCallback = async (
  code: string,
  provider: 'google' | 'facebook'
) => {
  try {
    // في الواقع، الواجهة الخلفية ستعالج callback وترجع JSON مباشرة
    // لذا نحتاج إلى معالجة هذا في الواجهة الأمامية
    const response = await fetch(
      `${API_BASE}/auth/oauth/${provider}/callback?code=${code}`,
      {
        method: 'GET',
        credentials: 'include', // مهم لـ cookies
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `${provider} OAuth failed`);
    }

    return response.json(); // { user, accessToken }
  } catch (error) {
    console.error(`${provider} OAuth error:`, error);
    throw error;
  }
};
