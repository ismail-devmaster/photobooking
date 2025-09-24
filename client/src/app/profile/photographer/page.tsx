'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserProfile } from '@/lib/profile';

export default function PhotographerOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bio: '',
    priceBaseline: 0,
    tags: [] as string[],
    serviceIds: [] as string[],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();

        // تحقق من أن المستخدم ليس مصورًا بالفعل
        if (data.photographer) {
          router.push('/profile');
          return;
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'tags' || name === 'serviceIds') {
      const values = value
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
      setFormData(prev => ({ ...prev, [name]: values }));
    } else if (name === 'priceBaseline') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // تحديث الملف الشخصي مع معلومات المصور
      await updateUserProfile({
        photographer: {
          bio: formData.bio,
          priceBaseline: formData.priceBaseline,
          tags: formData.tags,
          serviceIds: formData.serviceIds,
        },
      });

      // إعادة توجيه إلى صفحة الملف
      router.push('/profile');
    } catch (err: any) {
      setError(err.message);
      console.error('Photographer onboarding error:', err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Photographer Onboarding
          </h1>
          <p className="text-gray-600 mb-6">
            Complete your photographer profile to start accepting bookings
          </p>

          <div className="mb-6">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 ${
                  step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <div
                className={`flex-1 h-1 ${
                  step >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h2>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself and your photography style..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Pricing & Services
                </h2>

                <div>
                  <label
                    htmlFor="priceBaseline"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Base Price (in cents)
                  </label>
                  <input
                    type="number"
                    id="priceBaseline"
                    name="priceBaseline"
                    value={formData.priceBaseline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="50000 for $500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter price in cents (e.g., 50000 for $500)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="serviceIds"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Service IDs
                  </label>
                  <input
                    type="text"
                    id="serviceIds"
                    name="serviceIds"
                    value={formData.serviceIds.join(', ')}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="svc_1, svc_2, svc_3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma separated service IDs
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Tags & Final Review
                </h2>

                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags.join(', ')}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="wedding, portrait, drone, outdoor"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma separated tags to help clients find you
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Review Your Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Bio:</span> {formData.bio}
                    </div>
                    <div>
                      <span className="font-medium">Base Price:</span>{' '}
                      {formData.priceBaseline} cents
                    </div>
                    <div>
                      <span className="font-medium">Tags:</span>{' '}
                      {formData.tags.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Services:</span>{' '}
                      {formData.serviceIds.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Complete Onboarding'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
