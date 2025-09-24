'use client';

import React from 'react';
import { getGoogleAuthUrl, getFacebookAuthUrl } from '@/lib/oauth';

interface SocialLoginButtonsProps {
  onSocialLogin?: (provider: 'google' | 'facebook') => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onSocialLogin,
}) => {
  const handleGoogleLogin = () => {
    if (onSocialLogin) {
      onSocialLogin('google');
    }
    // التوجيه إلى الواجهة الخلفية
    window.location.href = getGoogleAuthUrl();
  };

  const handleFacebookLogin = () => {
    if (onSocialLogin) {
      onSocialLogin('facebook');
    }
    // التوجيه إلى الواجهة الخلفية
    window.location.href = getFacebookAuthUrl();
  };

  const handleAppleLogin = () => {
    alert('Apple login will be implemented soon');
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full py-2 px-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
      >
        <svg
          className="h-5 w-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleFacebookLogin}
        className="w-full py-2 px-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
      >
        <svg
          className="h-5 w-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleAppleLogin}
        className="w-full py-2 px-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
      >
        <svg
          className="h-5 w-5 text-gray-800"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.05 12.04C17.02 8.77 19.69 7.08 19.82 7 18.6 5.26 16.7 5.08 16.07 5.06 14.22 4.94 12.54 6.28 11.6 6.28 10.66 6.28 9.24 5.02 7.76 5.06 5.88 5.11 4 6.95 2.92 9.81 1.84 12.85 2.66 16.11 3.77 17.61 4.88 19.02 6.16 19.23 6.32 19.25 7.49 18.53 8.87 17.72 10.25 17.72 11.61 17.72 12.97 18.53 14.22 17.72 15.28 17.08 17.11 17.02 17.69 15.8 17.72 14.58 17.81 13.36 17.08 12.04H17.05ZM14.88 4.34C15.55 3.48 16 2.28 15.92 1 14.79 1.04 13.52 1.73 12.75 2.64 12.06 3.43 11.47 4.72 11.56 5.97 12.85 6.05 14.11 5.28 14.88 4.34Z" />
        </svg>
      </button>
    </div>
  );
};
