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
export const getLatestDeployment = async (repoId) => {
  try {
    const response = await apiClient.post('/deployments/latest',
      JSON.stringify({ repoId }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching latest deployment:', error);
    console.error('Error details:', error.response?.data);
    throw error.response?.data || error;
  }
};

export const pollDeployment = async (projectId, onUpdate, interval = 3000) => {
  let shouldStop = false;
  let pollTimeout;

  const poll = async () => {
    if (shouldStop) {
      if (pollTimeout) clearTimeout(pollTimeout);
      return null;
    }

    try {
      const statusData = await getDeploymentStatus(projectId);

      // Check if deployment is completed or failed BEFORE calling onUpdate
      // Handle both numeric status (6 = Completed) and string status
      const rawStatus = statusData.status || statusData.Status;
      const currentStep = statusData.currentStep || statusData.CurrentStep;
      const isSuccess = statusData.success === true || statusData.Success === true;

      // Check completion conditions
      const isCompleted =
        rawStatus === 'Completed' ||
        rawStatus === 'completed' ||
        rawStatus === 'COMPLETED' ||
        (typeof rawStatus === 'number' && rawStatus >= 6) ||
        currentStep === 'Completed' ||
        currentStep === 'completed' ||
        isSuccess;

      // Check failure conditions
      const isFailed =
        rawStatus === 'Failed' ||
        rawStatus === 'failed' ||
        rawStatus === 'FAILED' ||
        (typeof rawStatus === 'number' && rawStatus < 0) ||
        currentStep === 'Failed' ||
        currentStep === 'failed';

      // Call onUpdate with the status data
      if (onUpdate) {
        await onUpdate(statusData);
      }

      // If completed or failed, stop polling
      if (isCompleted || isFailed) {
        shouldStop = true;
        return statusData;
      }

      // Only continue polling if not stopped
      if (!shouldStop) {
        // Clear any existing timeout to prevent multiple timeouts
        if (pollTimeout) clearTimeout(pollTimeout);

        // Create a promise that will resolve after the interval
        await new Promise((resolve) => {
          pollTimeout = setTimeout(async () => {
            if (!shouldStop) {
              try {
                await poll();
              } catch (err) {
                console.error('Error in polling:', err);
              }
            }
            resolve();
          }, interval);
        });
      }

      return statusData;
    } catch (error) {
      console.error('Error in deployment polling:', error);
      shouldStop = true;
      if (pollTimeout) clearTimeout(pollTimeout);
      throw error;
    }
  };

  // Add cleanup function to the returned promise
  const pollPromise = poll();
  pollPromise.catch(() => { }); // Prevent unhandled promise rejection

  // Return an object with the promise and a stop function
  return {
    promise: pollPromise,
    stop: () => {
      shouldStop = true;
      if (pollTimeout) clearTimeout(pollTimeout);
    }
  };
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
    const response = await apiClient.post(
      `/unifieddeployment/regenerate-config/${projectId}`,
      {config:config},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
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

export const getAllDeployments = async (userId) => {
  try {
    const url = userId
      ? `/deployments/user/${userId}`
      : '/deployments';
    const response = await apiClient.get(url);
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

export const getDeploymentsByRepoId = async (repoId) => {
  try {
    const response = await apiClient.post(`/deployments/repo`, { repoId: repoId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateDeploymentStatus = async (deploymentId, deploymentStatus) => {
  try {
    const response = await apiClient.put(`/deployments/${deploymentId}/status`, { status: deploymentStatus });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteDeployment = async (deploymentId) => {
  try {
    // ⭐ FIXED: Use the correct UnifiedDeployment endpoint
    const response = await apiClient.delete(`/unifieddeployment/deployments/${deploymentId}`);
    return response.data;
  } catch (error) {
    console.error('Delete deployment error:', error);
    throw error.response?.data || error;
  }
};

export const analyzeAndSuggest = async (owner, repo, branch, token) => {
  try {
    const response = await apiClient.post('/repositories/analyze-and-suggest', {
      owner,
      repoName: repo,
      branch,
      token
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deployToUnifiedPlatform = async (deploymentData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));

    const repoName = deploymentData.repoName || deploymentData.repo;

    const config = deploymentData.config || {};

    const formattedConfig = {
      ProjectName: config.projectName || deploymentData.projectId || 'Deployed Project',
      BuildCommand: config.buildCommand || '',
      OutputDirectory: config.outputDirectory || (deploymentData.platform === 'githubpages' ? '/' : '.'),
      InstallCommand: config.installCommand || ''
    };

    if (config.nodeVersion) {
      formattedConfig.NodeVersion = config.nodeVersion;
    }
    if (config.domain) {
      formattedConfig.Domain = config.domain;
    }
    if (config.framework) {
      formattedConfig.Framework = config.framework;
    }
    if (config.enableHttps !== undefined) {
      formattedConfig.EnableHttps = config.enableHttps;
    }
    if (config.environmentVariables && Object.keys(config.environmentVariables).length > 0) {
      formattedConfig.EnvironmentVariables = config.environmentVariables;
    }
    if (config.redirects && config.redirects.length > 0) {
      formattedConfig.Redirects = config.redirects.map(r => ({
        From: r.from,
        To: r.to,
        Status: r.status
      }));
    }
    if (config.headers && config.headers.length > 0) {
      formattedConfig.Headers = config.headers.map(h => ({
        Source: h.source,
        Headers: h.headers
      }));
    }

    const payload = {
      userId: user.id,
      ProjectName: formattedConfig.ProjectName,
      description: deploymentData.description || 'Deployed via SwiftDeploy',
      platform: deploymentData.platform,
      gitHubRepo: `${deploymentData.owner}/${repoName}`,
      branch: deploymentData.branch || 'main',
      config: formattedConfig
    };

    console.log('📤 Sending deployment request:', payload);

    const response = await apiClient.post('/unifieddeployment/deploy-with-github', payload);

    console.log('✅ Deployment response:', response.data);

    // Normalize response format
    const normalizedResponse = {
      success: response.data.success || false,
      message: response.data.message || 'Deployment initiated',
      projectId: response.data.projectId || response.data.ProjectId,
      gitHubRepoUrl: response.data.gitHubRepoUrl || response.data.GitHubRepoUrl,
      deploymentUrl: response.data.deploymentUrl || response.data.DeploymentUrl,
      configFileUrl: response.data.configFileUrl || response.data.ConfigFileUrl,
      status: response.data.status || response.data.Status,
      progress: response.data.progress || response.data.Progress || 0,
      currentStep: response.data.currentStep || response.data.CurrentStep
    };

    return normalizedResponse;
  } catch (error) {
    console.error('❌ Deployment error:', error);

    // Better error handling
    if (error.response) {
      // Server responded with error
      console.error('Server error response:', error.response.data);
      throw {
        success: false,
        message: error.response.data.message || error.response.data.Message || 'Deployment failed',
        ...error.response.data
      };
    } else if (error.request) {
      // Request made but no response
      console.error('No response received:', error.request);
      throw {
        success: false,
        message: 'No response from server. Please check your connection.'
      };
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
      throw {
        success: false,
        message: error.message || 'Failed to send deployment request'
      };
    }
  }
};

export const getFileContent = async (owner, repoName, path) => {
  try {
    const response = await apiClient.get(`/unifieddeployment/file/${owner}/${repoName}/${path}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};