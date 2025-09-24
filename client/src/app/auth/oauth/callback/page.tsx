'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processOAuthCallback } from '@/lib/oauth';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!provider || !code) {
      setError('Missing OAuth parameters');
      setLoading(false);
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        // في الحقيقة، الواجهة الخلفية سترجع JSON مباشرة بعد callback
        // لذا نحتاج إلى معالجة هذا بشكل مختلف
        // نحن نحتاج إلى التوجيه إلى الواجهة الخلفية أولاً
        window.location.href = `${
          process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1'
        }/auth/oauth/${provider}/callback?code=${code}${
          state ? `&state=${state}` : ''
        }`;
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'OAuth login failed');
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  // في الواقع، الواجهة الخلفية ستعيد التوجيه تلقائيًا إلى الواجهة الأمامية
  // مع token، لذا هذه الصفحة قد لا تكون ضرورية
  // لكن نحتفظ بها كنقطة وصول للـ callback

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 text-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Social Login</h2>
            <p className="text-gray-600">Processing your login...</p>
          </div>

          {loading && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p>Completing your login...</p>
            </div>
          )}

          {error && (
            <div>
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
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
