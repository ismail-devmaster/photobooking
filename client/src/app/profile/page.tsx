'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserProfile } from '@/lib/profile';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    locale: 'en',
    stateId: '',
  });
  const [photographerData, setPhotographerData] = useState({
    bio: '',
    priceBaseline: 0,
    tags: [] as string[],
    serviceIds: [] as string[],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);

        // تعبئة بيانات النموذج
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          locale: data.locale || 'en',
          stateId: data.state?.id || '',
        });

        // تعبئة بيانات المصور إذا كان مستخدم مصورًا
        if (data.photographer) {
          setPhotographerData({
            bio: data.photographer.bio || '',
            priceBaseline: data.photographer.priceBaseline || 0,
            tags: data.photographer.tags || [],
            serviceIds: data.photographer.serviceIds || [],
          });
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotographerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setPhotographerData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    setPhotographerData(prev => ({ ...prev, tags }));
  };

  const handleServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const serviceIds = e.target.value
      .split(',')
      .map(id => id.trim())
      .filter(id => id);
    setPhotographerData(prev => ({ ...prev, serviceIds }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const profileData = {
        ...formData,
        photographer:
          profile?.role === 'PHOTOGRAPHER' ? photographerData : undefined,
      };

      await updateUserProfile(profileData);
      setSuccess('Profile updated successfully!');

      // تحديث البيانات المحلية
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
    } catch (err: any) {
      setError(err.message);
      console.error('Profile update error:', err);
    } finally {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <p>{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Profile Settings
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="locale"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Language
                  </label>
                  <select
                    id="locale"
                    name="locale"
                    value={formData.locale}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Photographer Section (if user is photographer) */}
            {profile?.role === 'PHOTOGRAPHER' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Photographer Profile
                </h2>

                <div className="space-y-4">
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
                      value={photographerData.bio}
                      onChange={handlePhotographerChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="priceBaseline"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Base Price (cents)
                    </label>
                    <input
                      type="number"
                      id="priceBaseline"
                      name="priceBaseline"
                      value={photographerData.priceBaseline}
                      onChange={handlePhotographerChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      value={photographerData.tags.join(', ')}
                      onChange={handleTagsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="wedding, portrait, drone"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="serviceIds"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Service IDs (comma separated)
                    </label>
                    <input
                      type="text"
                      id="serviceIds"
                      value={photographerData.serviceIds.join(', ')}
                      onChange={handleServicesChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="svc_1, svc_2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photographer Onboarding Section (if user is not photographer) */}
            {profile?.role === 'CLIENT' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Become a Photographer
                </h2>

                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800 mb-3">
                    Want to become a photographer on our platform? Complete your
                    photographer profile to start accepting bookings.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      // تغيير الدور إلى مصور وتحديث الحقول
                      setPhotographerData({
                        bio: '',
                        priceBaseline: 0,
                        tags: [],
                        serviceIds: [],
                      });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Photographer Onboarding
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
