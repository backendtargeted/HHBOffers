// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Timeout duration in milliseconds
const TIMEOUT_DURATION = 30000; // 30 seconds

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<any> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_DURATION);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    // Try to parse as JSON, return empty object if there's no content
    const data = await response.json().catch(() => ({}));
    return data;
  } finally {
    clearTimeout(timeout);
  }
};

// Helper to add authorization header
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
  },
  
  register: async (userData: { name: string; email: string; password: string }) => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
  },
  
  logout: async () => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },
  
  getProfile: async () => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
};

// Property API calls
export const propertyAPI = {
  getAllProperties: async (page: number = 1, limit: number = 20) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
  
  getPropertyById: async (id: number) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
  
  searchProperties: async (query: string, limit: number = 10) => {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/properties/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    return response.results || [];
  },
  
  createProperty: async (propertyData: any) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });
  },
  
  updateProperty: async (id: number, propertyData: any) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });
  },
  
  deleteProperty: async (id: number) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },
  
  batchUpdateProperties: async (properties: any[]) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ properties })
    });
  },
};

// Upload API calls
export const uploadAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get auth token but don't include content type - browser will set it with boundary
    const headers: HeadersInit = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetchWithTimeout(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
  },
  
  getJobStatus: async (jobId: string) => {
    return fetchWithTimeout(`${API_BASE_URL}/upload/${jobId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
  
  cancelJob: async (jobId: string) => {
    return fetchWithTimeout(`${API_BASE_URL}/upload/${jobId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
  },
  
  getUserJobs: async (page: number = 1, limit: number = 10) => {
    return fetchWithTimeout(`${API_BASE_URL}/upload/jobs?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
};

// Stats API calls
export const statsAPI = {
  getSystemStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/system`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
  
  getPropertyStatsByState: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/properties/by-state`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
  
  getPropertyStatsByCity: async (state: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/properties/by-city/${state}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
  
  getUserActivityStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/users/activity`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
};

// Helper for handling API errors
export const handleApiError = (error: any): string => {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'No response from server. Please check your internet connection.';
  } else if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};

// Default export for convenience
export default {
  authAPI,
  propertyAPI,
  uploadAPI,
  statsAPI,
  handleApiError
};
