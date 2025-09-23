'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name);
      setSuccess(true);

      // إعادة توجيه بعد 3 ثواني
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-900">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mt-2">
              Please check your email to verify your account
            </p>

            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">
                Redirecting to login page...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-lg opacity-90">Join PhotoBooking today</p>
          </div>
        </div>
      </div>

      {/* نافذة التسجيل */}
      <div className="w-full max-w-md lg:ml-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              Create your account
            </h2>
            <p className="text-gray-600">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>

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
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or sign up with
              </span>
            </div>
          </div>

          {/* أزرار تسجيل الدخول الاجتماعي */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() =>
                (window.location.href = `${API_BASE}/auth/oauth/google`)
              }
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
              onClick={() =>
                (window.location.href = `${API_BASE}/auth/oauth/facebook`)
              }
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
              onClick={() => alert('Apple login will be implemented soon')}
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

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
