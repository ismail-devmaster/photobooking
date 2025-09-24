'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // التحقق من وجود رسالة من التسجيل أو التحقق
  const registered = searchParams.get('registered');
  const verified = searchParams.get('verified');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);

      // حفظ token
      localStorage.setItem('accessToken', data.accessToken);

      // إعادة التوجيه
      router.push('/dashboard'); // أو الصفحة المناسبة
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    console.log(`Social login initiated: ${provider}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      {/* الدائرة الكبيرة من التصميم */}
      <div className="absolute left-0 top-0 w-1/2 h-full bg-blue-900 rounded-br-full rounded-tr-full hidden lg:block">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="mb-6">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                className="mx-auto"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M40 60 L55 75 L80 45"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                />
                <circle cx="60" cy="40" r="8" fill="white" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Sign in</h1>
            <p className="text-lg opacity-90">Welcome back to PhotoBooking</p>
          </div>
        </div>
      </div>

      {/* نافذة تسجيل الدخول */}
      <div className="w-full max-w-md lg:ml-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              Sign in to your account
            </h2>
            <p className="text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* عرض الرسائل من التسجيل أو التحقق */}
          {registered && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              Registration successful! Please check your email to verify your
              account.
            </div>
          )}

          {verified && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              Email verified successfully! You can now log in.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* أزرار تسجيل الدخول الاجتماعي */}
          <SocialLoginButtons onSocialLogin={handleSocialLogin} />

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
