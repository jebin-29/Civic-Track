// API Service for Civic Zone Connect
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string | { id: number; name: string; description?: string; icon?: string; color?: string; is_active?: boolean };
  status: 'reported' | 'progress' | 'resolved';
  location: string;
  latitude?: number;
  longitude?: number;
  reported_by?: string;
  reporter_name?: string;
  created_at?: string;
  reported_at?: string;
  photos?: string[];
  primary_photo?: string;
  flags?: number;
  flag_instances?: any[];
  distance?: string;
  distance_km?: number;
  coordinates?: { lat: number; lng: number };
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const userData = localStorage.getItem('civictrack_user');
  if (userData) {
    const user = JSON.parse(userData);
    return user.token || null;
  }
  return null;
};

// Helper function to make API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<any> => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token && !skipAuth) {
    defaultHeaders['Authorization'] = `Token ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  let message = "";
  if (typeof errorData === "object") {
    message = errorData.message 
      || errorData.error 
      || errorData.detail
      || (errorData.non_field_errors && errorData.non_field_errors[0])
      || "";
    if (!message) {
      for (const key of Object.keys(errorData)) {
        const val = errorData[key];
        if (Array.isArray(val) && val.length > 0) { message = val[0]; break; }
        if (typeof val === "string") { message = val; break; }
      }
    }
  }
  if (!message) message = `HTTP ${response.status}`;
  throw { message, status: response.status, errors: errorData } as ApiError;
}

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return response;
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    throw {
      message: 'Network error or server unavailable',
      status: 0,
    } as ApiError;
  }
};

// Auth API
export const authAPI = {
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    return apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true);
  },

  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    return apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, true);
  },

  logout: async (): Promise<void> => {
    await apiRequest('/auth/logout/', {
      method: 'POST',
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest('/current-user/');
  },
};

// Issues API
export const issuesAPI = {
  getIssues: async (params?: {
    page?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<{
    results: Issue[];
    count: number;
    next: string | null;
    previous: string | null;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/issues/?${queryString}` : '/issues/';

    return apiRequest(endpoint);
  },

  getIssue: async (id: string): Promise<Issue> => {
    return apiRequest(`/issues/${id}/`);
  },

  createIssue: async (formData: FormData): Promise<Issue> => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/issues/create/`, {
      method: "POST",
      headers: {
        Authorization: token ? `Token ${token}` : "",
        // ❗ DO NOT set Content-Type manually for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message:
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}`,
        status: response.status,
        errors: errorData,
      } as ApiError;
    }

    return response.json();
  },

  updateIssue: async (id: string, formData: FormData): Promise<Issue> => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/issues/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: token ? `Token ${token}` : "",
      // ❗ DO NOT set Content-Type manually for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.message || errorData.error || `HTTP ${response.status}`,
      status: response.status,
      errors: errorData,
    } as ApiError;
  }

  return response.json();
},


  getMyIssues: async (): Promise<Issue[]> => {
    return apiRequest('/my-issues/');
  },

  getNearbyIssues: async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
  }): Promise<Issue[]> => {
    const searchParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) searchParams.append('radius', params.radius.toString());

    return apiRequest(`/nearby-issues/?${searchParams.toString()}`);
  },
};



// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<Category[]> => {
    return apiRequest('/categories/');
  },
};

// User Profile API
export const profileAPI = {
  getProfile: async (): Promise<User> => {
    return apiRequest('/profile/');
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    return apiRequest('/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Admin API
export const adminAPI = {
  getStatistics: async (): Promise<{
    total_issues: number;
    reported_issues: number;
    progress_issues: number;
    resolved_issues: number;
    total_users: number;
    active_users: number;
    flagged_issues: number;
  }> => {
    return apiRequest('/admin/statistics/');
  },

  getUsers: async (): Promise<User[]> => {
    return apiRequest('/admin/users/');
  },

  getIssues: async (): Promise<Issue[]> => {
    return apiRequest('/admin/issues/');
  },

  updateIssueStatus: async (id: string, status: string) => {
    return apiRequest(`/admin/issues/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  toggleUserStatus: async (id: number) => {
    return apiRequest(`/admin/users/${id}/toggle-status/`, {
      method: "POST",
    });
  },
  

  verifyUser: async (id: number) => {
    return apiRequest(`/admin/users/${id}/verify/`, {
      method: "POST",
    });
  },

  hideIssue: async (id: string) => {
  return apiRequest(`/admin/issues/${id}/toggle-visibility/`, {
    method: "POST",
  });
},
};

export default {
  auth: authAPI,
  issues: issuesAPI,
  categories: categoriesAPI,
  profile: profileAPI,
  admin: adminAPI,
};
