// Profile service layer
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1';

// الحصول على بيانات المستخدم
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user profile');
    }

    return response.json(); // { id, name, email, role, locale, phone, state, photographer }
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// تحديث بيانات المستخدم
export const updateUserProfile = async (profileData: {
  name?: string;
  phone?: string;
  locale?: string;
  stateId?: string;
  photographer?: {
    bio?: string;
    priceBaseline?: number;
    tags?: string[];
    serviceIds?: string[];
  };
}) => {
  try {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE}/me`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user profile');
    }

    return response.json(); // updated user object
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// الحصول على بيانات المصور
export const getPhotographerProfile = async (photographerId: string) => {
  try {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `${API_BASE}/photographers/${photographerId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get photographer profile');
    }

    return response.json(); // { id, user, bio, priceBaseline, ratingAvg, ratingCount, verified, services, state, packages, gallery }
  } catch (error) {
    console.error('Get photographer profile error:', error);
    throw error;
  }
};

// الحصول على قائمة المصورين
export const getPhotographers = async (
  params: {
    page?: number;
    perPage?: number;
    stateId?: string;
    serviceId?: string;
    minPrice?: number;
    maxPrice?: number;
    q?: string;
    tags?: string[];
    sort?: string;
  } = {}
) => {
  try {
    const token = localStorage.getItem('accessToken');

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.perPage)
      queryParams.append('perPage', params.perPage.toString());
    if (params.stateId) queryParams.append('stateId', params.stateId);
    if (params.serviceId) queryParams.append('serviceId', params.serviceId);
    if (params.minPrice)
      queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice)
      queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.q) queryParams.append('q', params.q);
    if (params.tags) queryParams.append('tags', params.tags.join(','));
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_BASE}/photographers?${queryParams}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get photographers');
    }

    return response.json(); // { items: [], meta: { total, page, perPage, pages } }
  } catch (error) {
    console.error('Get photographers error:', error);
    throw error;
  }
};
