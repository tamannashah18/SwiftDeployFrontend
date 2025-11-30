import axios from 'axios';

const API_BASE_URL = 'http://localhost:5280/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Check both keys for backwards compatibility
    const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const storeJwt = (token) => {
  localStorage.setItem('jwtToken', token);
};

export const getStoredJwt = () => {
  return localStorage.getItem('jwtToken');
};

export const clearAuth = () => {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('token'); // Remove old key for backwards compatibility
  localStorage.removeItem('user');
  localStorage.removeItem('github_access_token');
};

export default apiClient;
