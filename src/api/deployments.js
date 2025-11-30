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

      // Check for completion conditions (handle both raw and normalized status)
      const rawStatus = status.Status || status.status;
      const isSuccess = status.success === true || status.Success === true;
      
      // Check if deployment is completed
      const isCompleted = 
        rawStatus === 'Completed' || 
        rawStatus === 'completed' || 
        rawStatus === 'COMPLETED' ||
        (typeof rawStatus === 'number' && rawStatus >= 6) ||
        isSuccess;
      
      // Check if deployment failed
      const isFailed = 
        rawStatus === 'Failed' || 
        rawStatus === 'failed' || 
        rawStatus === 'FAILED' ||
        (typeof rawStatus === 'number' && rawStatus < 0);

      if (isCompleted || isFailed) {
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

export const regenerateConfig = async (projectId, config, projectName = null) => {
  try {
    // Map projectType string to number if needed
    let projectType = 0;
    if (config?.projectType !== undefined) {
      if (typeof config.projectType === 'string') {
        projectType = config.projectType === 'Static' ? 0 : 1;
      } else {
        projectType = config.projectType;
      }
    } else if (config?.ProjectType !== undefined) {
      if (typeof config.ProjectType === 'string') {
        projectType = config.ProjectType === 'Static' ? 0 : 1;
      } else {
        projectType = config.ProjectType;
      }
    }

    // Normalize config to ensure it's in the correct format (camelCase)
    // Handle both PascalCase and camelCase properties
    const normalizedConfig = {
      projectName: projectName || config?.projectName || config?.ProjectName || 'your-project-name',
      buildCommand: config?.buildCommand || config?.BuildCommand || '',
      outputDirectory: config?.outputDirectory || config?.OutputDirectory || '.',
      installCommand: config?.installCommand || config?.InstallCommand || '',
      nodeVersion: config?.nodeVersion || config?.NodeVersion || '',
      domain: config?.domain || config?.Domain || '',
      environmentVariables: config?.environmentVariables || config?.EnvironmentVariables || {},
      redirects: config?.redirects || config?.Redirects || [],
      headers: config?.headers || config?.Headers || [],      
      projectType: projectType,
    };

    // Send the config directly, not wrapped in a config object
    const response = await apiClient.post(`/unifieddeployment/regenerate-config/${projectId}`, normalizedConfig);
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

export const getDeploymentsByRepoId = async (repoId) => {
  try {
    const response = await apiClient.post('/deployments/repo', {
      repoId: repoId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateDeploymentStatus = async (deploymentId, status) => {
  try {
    // Backend expects status as a JSON string in the body (e.g., "completed")
    const response = await apiClient.put(
      `/deployments/${deploymentId}/status`,
      JSON.stringify(status), // Send as JSON string
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

export const deleteDeployment = async (deploymentId) => {
  try {
    const response = await apiClient.delete(`/deployments/${deploymentId}`);
    return response.data;
  } catch (error) {
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
    const githubToken = localStorage.getItem('github_access_token');

    const repoName = deploymentData.repoName || deploymentData.repo;
    const repoId = deploymentData.repoId || `${deploymentData.owner}/${repoName}`;

    const config = deploymentData.config || {};
    
    // For static sites, keep build config empty
    const isStaticSite = config.framework === 'static' || config.projectType === 'Static';
    const buildCommand = isStaticSite ? '' : (config.buildCommand || '');

    const formattedConfig = {
      ProjectName: config.projectName || deploymentData.projectId || 'Deployed Project',
      BuildCommand: buildCommand,
      OutputDirectory: config.outputDirectory || (deploymentData.platform === 'githubpages' ? '/' : '.'),
      InstallCommand: config.installCommand || ''
    };

    if (config.nodeVersion) {
      formattedConfig.NodeVersion = config.nodeVersion;
    }
    if (config.domain) {
      formattedConfig.Domain = config.domain;
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

    // Call deploy-with-github first
    let response;
    try {
      response = await apiClient.post('/unifieddeployment/deploy-with-github', payload);
    } catch (deployError) {
      throw deployError.response?.data || deployError;
    }
    
    // After successful deployment response, create MongoDB deployment record
    let mongoDeploymentId = null;
    if (response.data) {
      const responseData = response.data;
      
      // Check for success (handle both lowercase and uppercase)
      const isSuccess = responseData.success === true || responseData.Success === true || 
                       (responseData.success !== false && responseData.Success !== false);
      
      // Handle status - can be number (6 = completed) or string
      let deploymentStatus = 'completed';
      if (!isSuccess) {
        deploymentStatus = 'failed';
      } else if (responseData.status !== undefined) {
        // Status 6 typically means completed, 0-5 are in-progress states
        if (typeof responseData.status === 'number') {
          deploymentStatus = responseData.status >= 6 ? 'completed' : 'processing';
        } else if (typeof responseData.status === 'string') {
          const statusLower = responseData.status.toLowerCase();
          if (statusLower === 'completed' || statusLower === 'success') {
            deploymentStatus = 'completed';
          } else if (statusLower === 'failed' || statusLower === 'error') {
            deploymentStatus = 'failed';
          } else {
            deploymentStatus = 'processing';
          }
        }
      }
      
      const deploymentUrl = responseData.DeploymentUrl || responseData.deploymentUrl;
      const projectId = responseData.ProjectId || responseData.projectId;
      
      // Create MongoDB deployment record with the response data
      try {
        const mongoDeployment = await createDeployment({
          repoId: repoId,
          serviceId: projectId || deploymentData.projectId || config.projectName || 'deployed-project',
          serviceUrl: deploymentUrl || null,
          status: deploymentStatus
        });
        mongoDeploymentId = mongoDeployment.id || mongoDeployment._id || mongoDeployment.Id;
      } catch (mongoError) {
        console.warn('Failed to create MongoDB deployment record:', mongoError);
        // Continue even if MongoDB record creation fails
      }
    }

    // Include MongoDB deployment ID in response
    return {
      ...response.data,
      MongoDeploymentId: mongoDeploymentId
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};
