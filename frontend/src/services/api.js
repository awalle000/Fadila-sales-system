import axios from 'axios';

// ✅ Use environment variable for API URL in production
const getBaseURL = () => {
  // Check if running in production (Vercel)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development fallback
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 30000 // 30 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.'
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Authentication failed. Redirecting to login...');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('loginLogId');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle CORS errors
    if (error.message === 'Network Error' && error.config) {
      console.error('CORS Error: Backend may not be accessible or CORS is not configured');
    }

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    return Promise.reject(error);
  }
);

// Helper to check API health
export const checkAPIHealth = async () => {
  try {
    const response = await axios.get(`${getBaseURL().replace('/api', '')}/health`, {
      timeout: 5000
    });
    console.log('✅ API Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    return false;
  }
};

export default api;