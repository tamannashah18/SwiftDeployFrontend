import apiClient, { storeJwt, getStoredJwt, clearAuth } from './apiClient';

export const startGitHubLogin = () => {
  window.location.href = 'http://localhost:5000/api/auth/github/login';
};

export const fetchGitHubCallback = async (code) => {
  try {
    const response = await apiClient.get(`/auth/github/callback?code=${code}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.token) {
      storeJwt(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      storeJwt(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logout = () => {
  clearAuth();
};

export const startNetlifyLogin = () => {
  window.location.href = 'http://localhost:5000/api/auth/netlify/login';
};

export const getUserTokens = async () => {
  try {
    const response = await apiClient.get('/auth/tokens');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export { storeJwt, getStoredJwt };
