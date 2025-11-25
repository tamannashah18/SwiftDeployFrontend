import apiClient from './apiClient';

export const createProject = async (projectData) => {
  try {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllProjects = async () => {
  try {
    const response = await apiClient.get('/projects');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProjectByName = async (projectName) => {
  try {
    const response = await apiClient.get(`/projects/name/${projectName}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
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

export const getGitHubRepositories = async () => {
  try {
    const response = await apiClient.get('/repositories');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRepositoryByName = async (owner, repoName) => {
  try {
    const response = await apiClient.get(`/repositories/${owner}/${repoName}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRepositoryContents = async (owner, repoName, path = '') => {
  try {
    const url = path
      ? `/repositories/contents/${owner}/${repoName}/${path}`
      : `/repositories/contents/${owner}/${repoName}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getFileContent = async (owner, repoName, path) => {
  try {
    const response = await apiClient.get(`/repositories/file/${owner}/${repoName}/${path}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const analyzeAndSuggestPlatform = async (owner, repoName, branch = 'main') => {
  try {
    const response = await apiClient.post('/repositories/analyze-and-suggest', {
      owner,
      repoName,
      branch
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveRepository = async (repoData) => {
  try {
    const response = await apiClient.post('/repositories/save', repoData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSavedRepositories = async () => {
  try {
    const response = await apiClient.get('/repositories/saved');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getDeploymentsByRepo = async (repoId) => {
  try {
    const response = await apiClient.get(`/repositories/deployments/${repoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
