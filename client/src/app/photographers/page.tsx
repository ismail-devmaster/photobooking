'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPhotographers } from '@/lib/profile';

interface Photographer {
  id: string;
  user: {
    id: string;
    name: string;
  };
  bio: string;
  priceBaseline: number;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  services: Array<{
    id: string;
    name: string;
  }>;
  state: {
    id: string;
    name: string;
  };
  isFavorited: boolean;
}

export default function PhotographersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    perPage: 20,
    pages: 1,
  });

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 12,
    stateId: '',
    minPrice: '',
    maxPrice: '',
    q: '',
    tags: '',
    sort: 'rating_desc',
  });

  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        setLoading(true);
        const params = {
          ...filters,
          minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
          tags: filters.tags
            ? filters.tags.split(',').map(tag => tag.trim())
            : undefined,
        };

        const data = await getPhotographers(params);
        setPhotographers(data.items);
        setMeta(data.meta);
      } catch (err: any) {
        setError(err.message);
        console.error('Photographers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotographers();
  }, [filters]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Find a Photographer
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <div>
              <label
                htmlFor="q"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                type="text"
                id="q"
                value={filters.q}
                onChange={e => handleFilterChange('q', e.target.value)}
                placeholder="Name, bio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="stateId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="stateId"
                value={filters.stateId}
                onChange={e => handleFilterChange('stateId', e.target.value)}
                placeholder="State/City"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="minPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Min Price
              </label>
              <input
                type="number"
                id="minPrice"
                value={filters.minPrice}
                onChange={e => handleFilterChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="maxPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max Price
              </label>
              <input
                type="number"
                id="maxPrice"
                value={filters.maxPrice}
                onChange={e => handleFilterChange('maxPrice', e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="sort"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sort By
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={e => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating_desc">Rating (High to Low)</option>
                <option value="rating_asc">Rating (Low to High)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="name_asc">Name (A to Z)</option>
                <option value="name_desc">Name (Z to A)</option>
              </select>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photographers.map(photographer => (
                <div
                  key={photographer.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(`/photographers/${photographer.id}`)
                  }
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {photographer.user.name}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
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
                          </div>
                          <span className="ml-1 text-sm text-gray-600">
                            {photographer.ratingAvg.toFixed(1)} (
                            {photographer.ratingCount})
                          </span>
                        </div>
                      </div>
                      <button className="text-red-500 hover:text-red-700">
                        {photographer.isFavorited ? (
                          <svg
                            className="w-6 h-6 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                      {photographer.bio}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          ${photographer.priceBaseline / 100}
                        </p>
                        <p className="text-xs text-gray-500">Base price</p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {photographer.services.slice(0, 3).map(service => (
                          <span
                            key={service.id}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {service.name}
                          </span>
                        ))}
                        {photographer.services.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            +{photographer.services.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, filters.page - 1))
                    }
                    disabled={filters.page <= 1}
                    className={`px-3 py-2 rounded-md ${
                      filters.page <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, meta.pages) }, (_, i) => {
                    const startPage = Math.max(
                      1,
                      Math.min(filters.page - 2, meta.pages - 4)
                    );
                    const pageNum = startPage + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md ${
                          filters.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      handlePageChange(Math.min(meta.pages, filters.page + 1))
                    }
                    disabled={filters.page >= meta.pages}
                    className={`px-3 py-2 rounded-md ${
                      filters.page >= meta.pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
