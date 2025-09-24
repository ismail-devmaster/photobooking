'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');

    if (!token || !uid) {
      setError('Invalid verification link. Missing token or uid parameters.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        // استدعاء API للتحقق من البريد
        const response = await verifyEmail(token, uid);

        // حفظ token من الواجهة الخلفية
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }

        setSuccess(true);
      } catch (err: any) {
        console.error('Email verification error:', err);
        setError(err.message || 'Email verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams]);

  const handleRedirect = () => {
    router.push('/auth/login?verified=true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 text-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              Email Verification
            </h2>
            <p className="text-gray-600">Verifying your email address</p>
          </div>

          {loading && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p>Verifying your email...</p>
            </div>
          )}

          {success && (
            <div>
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                <p>Email verified successfully!</p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Your email has been verified. You can now access your account.
              </p>
              <button
                onClick={handleRedirect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 font-medium"
              >
                Continue to Login
              </button>
            </div>
          )}

          {error && (
            <div>
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                There was a problem verifying your email. Please try again.
              </p>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors duration-300 font-medium"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
