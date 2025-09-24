'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPhotographerProfile } from '@/lib/profile';

interface Photographer {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  bio: string;
  priceBaseline: number;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  services: Array<{
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  }>;
  state: {
    id: string;
    name: string;
  };
  packages: Array<{
    id: string;
    title: string;
    description: string;
    priceCents: number;
  }>;
  gallery: Array<{
    id: string;
    url: string;
    meta?: any;
  }>;
}

export default function PhotographerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photographer, setPhotographer] = useState<Photographer | null>(null);

  useEffect(() => {
    const fetchPhotographer = async () => {
      try {
        const data = await getPhotographerProfile(params.id);
        setPhotographer(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Photographer fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotographer();
  }, [params.id]);

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
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Photographer not found
          </h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Photographer Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {photographer.user.name.charAt(0)}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {photographer.user.name}
              </h1>

              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(photographer.ratingAvg)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-gray-600">
                    {photographer.ratingAvg.toFixed(1)} (
                    {photographer.ratingCount} reviews)
                  </span>
                </div>
              </div>

              <p className="mt-2 text-gray-600">
                Base price: ${photographer.priceBaseline / 100}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {photographer.services.map(service => (
                  <span
                    key={service.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {photographer.bio}
          </p>
        </div>

        {/* Packages Section */}
        {photographer.packages && photographer.packages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photographer.packages.map(pkg => (
                <div
                  key={pkg.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-bold text-gray-900">{pkg.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    {pkg.description}
                  </p>
                  <p className="mt-3 font-bold text-blue-600">
                    ${pkg.priceCents / 100}
                  </p>
                  <button className="mt-3 w-full bg-gray-100 text-gray-800 py-2 rounded-md hover:bg-gray-200 transition-colors">
                    Select Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {photographer.gallery && photographer.gallery.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photographer.gallery.map(image => (
                <div
                  key={image.id}
                  className="aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={image.url}
                    alt="Portfolio"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
