import apiClient from './apiClient';

export const deployWithoutGitHub = async (formData) => {
  try {
    const response = await apiClient.post('/unifieddeployment/deploy-without-github', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deployWithGitHub = async (deploymentData) => {
  try {
    const response = await apiClient.post('/unifieddeployment/deploy-with-github', deploymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getDeploymentStatus = async (projectId) => {
  try {
    const response = await apiClient.get(`/unifieddeployment/status/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const pollDeployment = async (projectId, onUpdate, interval = 3000) => {
  const poll = async () => {
    try {
      const status = await getDeploymentStatus(projectId);
      onUpdate(status);

      if (status.status === 'Completed' || status.status === 'Failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
      return poll();
    } catch (error) {
      throw error;
    }
  };

  return poll();
};

export const getUserProjects = async (userId) => {
  try {
    const url = userId
      ? `/projects/user/${userId}`
      : '/projects';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProjectDetails = async (projectId) => {
  try {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const regenerateConfig = async (projectId, config) => {
  try {
    const response = await apiClient.post(`/unifieddeployment/regenerate-config/${projectId}`, {
      config,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createDeployment = async (deploymentData) => {
  try {
    const response = await apiClient.post('/deployments', deploymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllDeployments = async () => {
  try {
    const response = await apiClient.get('/deployments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getDeploymentById = async (deploymentId) => {
  try {
    const response = await apiClient.get(`/deployments/${deploymentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateDeploymentStatus = async (deploymentId, status) => {
  try {
    const response = await apiClient.put(`/deployments/${deploymentId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteDeployment = async (deploymentId) => {
  try {
    const response = await apiClient.delete(`/deployments/${deploymentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
