import apiClient, { storeJwt, getStoredJwt, clearAuth } from './apiClient';

export const startGitHubLogin = () => {
  window.location.href = 'http://localhost:5280/api/auth/github/login';
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
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logout = () => {
  clearAuth();
};

export const startNetlifyLogin = () => {
  window.location.href = 'http://localhost:5280/api/auth/netlify/login';
};

export const getUserTokens = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      throw new Error('User not found');
    }
    const response = await apiClient.get(`/user/${user.id}/all-tokens`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const savePlatformToken = async (platform, token) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      throw new Error('User not found. Please log in again.');
    }

    const response = await apiClient.post(
      `/user/${user.id}/tokens/${platform}`,
      JSON.stringify(token),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving token:', error);
    throw error.response?.data || error;
  }
};
export { storeJwt, getStoredJwt };
