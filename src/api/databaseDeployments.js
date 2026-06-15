import apiClient from './apiClient';

export const connectProvider = async (provider, apiToken) => {
  try {
    const response = await apiClient.post('/integrations/connect', { provider, apiToken });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getConnectedProviders = async () => {
  try {
    const response = await apiClient.get('/integrations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const disconnectProvider = async (provider) => {
  try {
    const response = await apiClient.delete(`/integrations/${provider}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deployDatabase = async (formData) => {
  try {
    const response = await apiClient.post('/database-deployments/deploy', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserDeployments = async () => {
  try {
    const response = await apiClient.get('/database-deployments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getDeploymentDetails = async (id) => {
  try {
    const response = await apiClient.get(`/database-deployments/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
