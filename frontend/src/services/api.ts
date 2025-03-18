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
    try {
      const response = await fetch(`${API_BASE_URL}/properties?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText
        }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw API Response:", data);
      
      // Format the response properly
      return {
        success: true,
        rows: data.rows || data.properties || data,
        count: data.count || (data.rows ? data.rows.length : 0) || (data.properties ? data.properties.length : 0) || (Array.isArray(data) ? data.length : 0),
        totalPages: data.totalPages || Math.ceil((data.count || 1) / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },
  
  getPropertyById: async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText
        }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw property data:", data);
      
      // Check if response contains property directly or in a property field
      let propertyData;
      if (data.property) {
        propertyData = data.property;
      } else if (data.id) {
        propertyData = data;
      } else {
        throw new Error('Invalid property data received');
      }
      
      return {
        success: true,
        property: propertyData
      };
    } catch (error) {
      console.error(`Error fetching property with ID ${id}:`, error);
      throw error;
    }
  },
  
// For searchProperties function in api.ts
searchProperties: async (query: string, limit: number = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/properties/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw search API response:', data);
    
    // Handle different response formats (with results or directly as array)
    let searchResults = [];
    
    if (data.results && Array.isArray(data.results)) {
      searchResults = data.results;
    } else if (Array.isArray(data)) {
      searchResults = data;
    } else {
      console.error('Unexpected search results format:', data);
      return [];
    }
    
    console.log('Search results before returning:', searchResults);
    return searchResults;
  } catch (error) {
    console.error('Error searching properties:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
},
  
  createProperty: async (propertyData: any) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });
  },
  
  updateProperty: async (id: number, propertyData: any) => {
    try {
      // Properly format the property data
      const formattedData = {
        ...(propertyData.firstName !== undefined && { firstName: propertyData.firstName }),
        ...(propertyData.lastName !== undefined && { lastName: propertyData.lastName }),
        ...(propertyData.propertyAddress !== undefined && { propertyAddress: propertyData.propertyAddress }),
        ...(propertyData.propertyCity !== undefined && { propertyCity: propertyData.propertyCity }),
        ...(propertyData.propertyState !== undefined && { propertyState: propertyData.propertyState }),
        ...(propertyData.propertyZip !== undefined && { propertyZip: propertyData.propertyZip }),
        ...(propertyData.offer !== undefined && { offer: Number(propertyData.offer) })
      };
  
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText
        }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for different response formats and normalize
      if (data.property) {
        return data.property;
      } else if (data.id) {
        return data;
      } else if (data.success) {
        return data.property || data;
      }
      
      throw new Error('Invalid property data received');
    } catch (error) {
      console.error(`Error updating property with ID ${id}:`, error);
      throw error;
    }
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
