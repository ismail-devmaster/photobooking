// API client للتوثيق مع CORS handling
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1';

// تسجيل الدخول
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // مهم لـ CORS و الكوكيز
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json(); // { user, accessToken }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// التسجيل
export const register = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include', // مهم لـ CORS و الكوكيز
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json(); // { message: "User created. Please check your email..." }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// التحقق من البريد
export const verifyEmail = async (token: string, uid: string) => {
  try {
    const response = await fetch(
      `${API_BASE}/auth/verify-email?token=${token}&uid=${uid}`,
      {
        method: 'GET',
        credentials: 'include', // مهم لـ CORS و الكوكيز
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email verification failed');
    }

    return response.json(); // { accessToken, message }
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

// تسجيل الخروج
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // لارسال الكوكيز
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return response.json(); // { ok: true }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// الحصول على بيانات المستخدم
export const getUser = async () => {
  try {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include', // مهم لـ CORS
    });

    if (!response.ok) {
      throw new Error('Failed to get user data');
    }

    return response.json(); // { id, name, email, role, locale, ... }
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// تحديث token
export const refreshToken = async () => {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // لارسال الكوكيز
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json(); // { accessToken }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

// OAuth Google
export const getGoogleAuthUrl = () => {
  return `${API_BASE}/auth/oauth/google`;
};

// OAuth Facebook
export const getFacebookAuthUrl = () => {
  return `${API_BASE}/auth/oauth/facebook`;
};
