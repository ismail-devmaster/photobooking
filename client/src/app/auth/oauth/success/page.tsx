'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // في الحقيقة، الواجهة الخلفية ستعالج OAuth وترجع JSON مع token
    // ثم ستعيد التوجيه إلى الواجهة الأمامية مع token
    // هذه الصفحة تتعامل مع الـ redirect من الواجهة الخلفية

    const accessToken = searchParams.get('accessToken');
    const provider = searchParams.get('provider');

    if (accessToken) {
      // حفظ token في localStorage
      localStorage.setItem('accessToken', accessToken);

      // إعادة التوجيه إلى dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      // إذا لم يكن هناك token، عد إلى login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 text-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              Social Login Success
            </h2>
            <p className="text-gray-600">Completing your login...</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p>Redirecting you to your account...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
