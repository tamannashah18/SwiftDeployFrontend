import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { FaRocket, FaGithub, FaExternalLinkAlt, FaTrash, FaCloudflare } from 'react-icons/fa';
import { SiNetlify, SiVercel } from 'react-icons/si';
import { getProjectDetails, deleteProject, regenerateConfig, getDeploymentsByRepoId, getLatestDeployment, getFileContent, getScheduledDeployments, getProjectConfigurations, getProjectConfigurationFile, regenerateProjectConfiguration, previewProjectConfiguration } from '../api/deployments';
import { NavigationBar } from '../Components/NavigationBar';
import DeploymentModal from '../Components/DeploymentModal';
import DeploymentMonitorEmbedded from '../Components/DeploymentMonitorEmbedded';
import ConfigViewer from '../Components/ConfigViewer';
import ConfigRegenModal from '../Components/ConfigRegenModal';
import DeploymentLogsEmbedded from '../Components/DeploymentLogsEmbedded';
import { FaClock, FaCalendarAlt } from 'react-icons/fa';
import { useDeploymentNotifications } from '../hooks/useDeploymentNotifications';
import '../css/ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState(null);
  const [allDeployments, setAllDeployments] = useState([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [latestDeployment, setLatestDeployment] = useState(null);
  const [configContent, setConfigContent] = useState('');
  const [configFilePath, setConfigFilePath] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [scheduledDeployments, setScheduledDeployments] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // States for Configuration Management UI
  const [configsList, setConfigsList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [regeneratingFile, setRegeneratingFile] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');   // inline success banner
  const [configError, setConfigError] = useState('');       // inline error banner (config-tab scoped)

  // States for Configuration Diff Modal
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenTarget, setRegenTarget] = useState('');
  const [regenPreview, setRegenPreview] = useState(null);
  const [loadingRegenPreview, setLoadingRegenPreview] = useState(false);
  const [regenPreviewError, setRegenPreviewError] = useState(null);


  // Get userId for SignalR subscription
  const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.id || JSON.parse(localStorage.getItem('user'))?.userId || JSON.parse(localStorage.getItem('user'))?._id; } catch { return null; } })();
  const { notifications } = useDeploymentNotifications(userId);
  const prevNotifCount = useRef(0);

  // ⭐ 1. Fetch project details on mount
  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // ⭐ 2. Initialize deployment info from project
  useEffect(() => {
    if (project && project._id && !deploymentInfo) {
      if (project.deploymentUrl || project.status) {
        setDeploymentInfo({
          projectId: project._id,
          deploymentUrl: project.deploymentUrl,
          githubRepoUrl: project.githubRepoUrl,
          status: project.status
        });
      }
    }
  }, [project]);

  // ⭐ SignalR: Auto-refresh history when webhook fires a DeploymentStatusUpdated event
  useEffect(() => {
    if (notifications.length > prevNotifCount.current && project?.repoId) {
      prevNotifCount.current = notifications.length;
      // A new event arrived — re-fetch the deployment history
      getDeploymentsByRepoId(project.repoId)
        .then(deployments => {
          if (Array.isArray(deployments)) setAllDeployments(deployments);
          else if (deployments) setAllDeployments([deployments]);
        })
        .catch(console.warn);
    }
  }, [notifications, project?.repoId]);

  // ⭐ 3. Fetch deployments when deployment tab is active
  const fetchDeploymentsNow = async () => {
    if (project?.repoId) {
      try {
        setLoadingDeployments(true);
        const deployments = await getDeploymentsByRepoId(project.repoId);
        if (Array.isArray(deployments)) setAllDeployments(deployments);
        else if (deployments) setAllDeployments([deployments]);
        else setAllDeployments([]);
      } catch (err) {
        console.warn('Failed to fetch deployments:', err);
        setAllDeployments([]);
      } finally {
        setLoadingDeployments(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'deployment' && project?.repoId) {
      fetchDeploymentsNow();
    }
  }, [activeTab, project?.repoId]);

  // ⭐ Auto-poll every 30s on deployment tab while any entry is still "processing"
  useEffect(() => {
    if (activeTab !== 'deployment' || !project?.repoId) return;
    const hasProcessing = allDeployments.some(d => (d.status || '').toLowerCase() === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      getDeploymentsByRepoId(project.repoId)
        .then(deployments => {
          if (Array.isArray(deployments)) setAllDeployments(deployments);
          else if (deployments) setAllDeployments([deployments]);
        })
        .catch(console.warn);
    }, 30000); // poll every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab, project?.repoId, allDeployments]);

  const fetchLatestDeployment = async () => {
    if (project?.repoId) {
      try {
        const data = await getLatestDeployment(project.repoId);
        setLatestDeployment(data);
      } catch (err) {
        console.warn('Failed to fetch latest deployment:', err);
      }
    }
  };

  // ⭐ 4. Fetch latest deployment
  useEffect(() => {
    fetchLatestDeployment();
  }, [project?.repoId]);

  // ⭐ 5. Check for deploy modal flag
  useEffect(() => {
    const shouldOpenDeployModal = localStorage.getItem('open_deploy_modal_netlify');
    if (shouldOpenDeployModal === 'true' && project) {
      setShowDeployModal(true);
      localStorage.removeItem('open_deploy_modal_netlify');
    }
  }, [project]);

  // ⭐ 6. Refresh project details and load configurations when switching to configuration tab
  useEffect(() => {
    const refreshProjectForConfig = async () => {
      if (activeTab === 'configuration') {
        if (!project?.config && !loading) {
          console.log('Config missing, refreshing project details...');
          await fetchProjectDetails();
        }
        loadConfigurations(true);
      }
    };

    refreshProjectForConfig();
  }, [activeTab, id]);

  const parseGitHubUrl = (url) => {
    try {
      // Handle raw GitHub URLs
      if (url.includes('raw.githubusercontent.com')) {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        // Format: /owner/repo/branch/path/to/file
        if (parts.length >= 4) {
          return {
            owner: parts[0],
            repo: parts[1],
            path: parts.slice(3).join('/')
          };
        }
      } 
      // Handle GitHub blob URLs
      else {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        // Format: /owner/repo/blob/branch/path/to/file
        if (parts.length >= 5 && parts[2] === 'blob') {
          return {
            owner: parts[0],
            repo: parts[1],
            path: parts.slice(4).join('/')
          };
        }
      }
      return {};
    } catch (e) {
      console.error('Error parsing GitHub URL:', e);
      return {};
    }
  };

  const fetchConfigContent = async () => {
    if (activeTab !== 'configuration') return;

    try {
      setLoadingConfig(true);
      setError('');
      fetchLatestDeployment();
      let configUrl = latestDeployment?.configFileUrl;
      
      if (!configUrl && project?.repoId) {
        try {
          console.log('Fetching deployments by repoId for configuration:', project.repoId);
          const deployments = await getDeploymentsByRepoId(project.repoId);
          console.log('Deployments returned for configuration:', deployments);

          const list = Array.isArray(deployments) ? deployments : (deployments ? [deployments] : []);

          const getConfigUrlFromDeployment = (d) => {
            if (!d) return null;
            return (
              d.configFileUrl ||
              d.ConfigFileUrl ||
              d.configUrl ||
              d.ConfigUrl ||
              d.configurationUrl ||
              d.ConfigurationUrl ||
              (d.config && (d.config.fileUrl || d.config.configFileUrl || d.config.url)) ||
              null
            );
          };

          const deploymentWithConfig = list.find(d => !!getConfigUrlFromDeployment(d));

          if (deploymentWithConfig) {
            configUrl = getConfigUrlFromDeployment(deploymentWithConfig);
            console.log('Found configuration URL from repo endpoint:', configUrl, deploymentWithConfig);

            setDeploymentInfo(prev => ({
              ...(prev || {}),
              configFileUrl: configUrl
            }));
            setProject(prev => prev ? ({ ...prev, configFileUrl: configUrl }) : prev);
          } else {
            console.warn('No deployment with any configuration URL field found for repo:', project.repoId);
          }
        } catch (repoErr) {
          console.warn('Failed to fetch deployments for configuration via repo endpoint:', repoErr);
        }
      }

      if (!configUrl) {
        setConfigContent('');
        return;
      }

       console.log('Fetching config from URL (final):', configUrl);
       const { owner, repo, path } = parseGitHubUrl(configUrl);
       console.log('Parsed URL for config:', { owner, repo, path });
       if (path) {
         setConfigFilePath(path);
       } else {
         setConfigFilePath('');
       }

      if (owner && repo && path) {
        console.log('Fetching file content for configuration...');
        const content = await getFileContent(owner, repo, path);
        console.log('Received configuration content:', content);

        if (typeof content === 'string') {
          setConfigContent(content);
        } else if (content && typeof content === 'object' && 'content' in content) {
          setConfigContent(content.content);
        } else {
          setConfigContent(JSON.stringify(content, null, 2));
        }
      } else {
        console.warn('Missing required GitHub parameters from URL for configuration:', { owner, repo, path });
        setConfigContent('');
      }
    } catch (err) {
      console.error('Failed to fetch config file content:', err);
      setError(`Failed to load configuration: ${err.message || 'Unknown error'}`);
      setConfigContent('');
    } finally {
      setLoadingConfig(false);
    }
  };

  // ⭐ 7. Fetch config file content from GitHub
  useEffect(() => {
    fetchConfigContent();
  }, [activeTab, project?.configFileUrl, deploymentInfo?.configFileUrl]);

  // ⭐ 8. Fetch and poll scheduled deployments
  useEffect(() => {
    let interval;
    if (activeTab === 'upcoming' && id) {
      const fetchScheduled = async () => {
        try {
          if (scheduledDeployments.length === 0) setLoadingScheduled(true);
          const data = await getScheduledDeployments(id);
          setScheduledDeployments(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Failed to fetch scheduled deployments:', err);
        } finally {
          setLoadingScheduled(false);
        }
      };

      fetchScheduled();
      interval = setInterval(fetchScheduled, 10000); // Poll every 10 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab, id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const data = await getProjectDetails(id);
      console.log('Fetched project details:', data);
      setProject(data);
      setError('');
      return data;
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error fetching project details:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const projectIdToUse =
    project?._id ||     // Mongo ID (correct)
    project?.id ||
    project?.projectId ||
    id;

  console.log("FINAL DELETE ID:", projectIdToUse);

      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError('Failed to delete project');
      console.error(err);
    }
  };

  const handleRegenerateConfig = async () => {
    console.log('Current project config:', project?.config);
    console.log('Current project object:', project);
  
    if (!window.confirm('Are you sure you want to regenerate the configuration? This will overwrite the existing configuration file.')) {
      return;
    }
  
    try {
      setLoadingConfig(true);
      setError('');
      
      // Get project name from multiple possible sources
      const projectName = 
        (project?.projectName && project.projectName.trim()) ||
        (project?.ProjectName && project.ProjectName.trim()) ||
        (project?.config?.ProjectName && project.config.ProjectName.trim()) ||
        (project?.config?.projectName && project.config.projectName.trim()) ||
        (project?.name && project.name.trim()) ||
        'Deployed Project';
      
      // Validate that ProjectName is not empty
      if (!projectName || projectName.trim() === '') {
        setError('Project name is required but not found. Please ensure the project has a valid name.');
        setLoadingConfig(false);
        return;
      }
      
      // ⭐ BUILD COMPLETE CONFIG OBJECT matching backend CommonConfig structure
      const configToSend = {
        ProjectName: projectName.trim(),
        BuildCommand: project?.config?.BuildCommand || project?.config?.buildCommand || '',
        OutputDirectory: project?.config?.OutputDirectory || project?.config?.outputDirectory || '.',
        InstallCommand: project?.config?.InstallCommand || project?.config?.installCommand || '',
        Framework: project?.config?.Framework || project?.config?.framework || 'static',
        // Optional fields
        ...(project?.config?.NodeVersion && { NodeVersion: project.config.NodeVersion }),
        ...(project?.config?.Domain && { Domain: project.config.Domain }),
        ...(project?.config?.EnableHttps !== undefined && { EnableHttps: project.config.EnableHttps }),
        ...(project?.config?.EnvironmentVariables && { EnvironmentVariables: project.config.EnvironmentVariables }),
        ...(project?.config?.Redirects && { Redirects: project.config.Redirects }),
        ...(project?.config?.Headers && { Headers: project.config.Headers })
      };
      
      console.log('Project name resolved to:', projectName);
      console.log('Regenerating config with:', configToSend);
      console.log('Project ID being sent:', id);
      console.log('Full project object:', project);
      
      // ⭐ USE THE CORRECT PROJECT ID
      // Try different ID fields that might exist
      const projectIdToUse = project?._id || project?.id || project?.projectId || project?.ProjectId || id;
      
      console.log('Using project ID:', projectIdToUse);
      
      await regenerateConfig(projectIdToUse, configToSend);
      
      // Refresh project details
      await fetchProjectDetails();
      
      // Refresh config content if URL exists
      if (project?.configFileUrl) {
        const { owner, repo, path } = parseGitHubUrl(project.configFileUrl);
        if (owner && repo && path) {
          const content = await getFileContent(owner, repo, path);
          setConfigContent(content);
        }
      }
      
      alert('Configuration regenerated successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to regenerate configuration: ${errorMessage}`);
      console.error('Regenerate config error:', err);
      console.error('Error response:', err.response);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadConfigurations = async (selectFirst = false) => {
    try {
      setLoadingConfigs(true);
      setError('');
      const projectIdToUse = project?._id || project?.id || project?.projectId || id;
      const data = await getProjectConfigurations(projectIdToUse);
      if (Array.isArray(data)) {
        setConfigsList(data);
        if (data.length > 0) {
          if (selectFirst || !selectedFile) {
            setSelectedFile(data[0]);
          } else {
            const currentSelectedName = selectedFile.fileName || selectedFile.FileName;
            const updatedSelected = data.find(f => (f.fileName || f.FileName) === currentSelectedName);
            if (updatedSelected) {
              setSelectedFile(updatedSelected);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load configurations:', err);
      setError(err?.message || 'Failed to load project configuration files.');
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleRegenerateFile = async (fileName) => {
    setRegenTarget(fileName);
    setRegenPreview(null);
    setRegenPreviewError(null);
    setLoadingRegenPreview(true);
    setShowRegenModal(true);

    try {
      const projectIdToUse = project?._id || project?.id || project?.projectId || id;
      const result = await previewProjectConfiguration(projectIdToUse, fileName);
      if (result && result.content) {
        setRegenPreview(result.content);
      } else {
        setRegenPreviewError('Empty content received from preview generator.');
      }
    } catch (err) {
      console.error(`Failed to fetch preview for configuration ${fileName}:`, err);
      const backendMsg = err?.response?.data?.message || err?.response?.data || err?.message;
      setRegenPreviewError(typeof backendMsg === 'string' ? backendMsg : 'Failed to generate preview content.');
    } finally {
      setLoadingRegenPreview(false);
    }
  };

  const confirmRegenerateFile = async () => {
    const fileName = regenTarget;
    if (!fileName) return;

    try {
      setRegeneratingFile(fileName);
      setConfigError('');
      setConfigSuccess('');
      setShowRegenModal(false);

      const projectIdToUse = project?._id || project?.id || project?.projectId || id;
      const result = await regenerateProjectConfiguration(projectIdToUse, fileName);
      const commitSha = result?.commitSha || result?.data?.commitSha;
      const shortSha = commitSha ? commitSha.substring(0, 7) : null;
      setConfigSuccess(
        shortSha
          ? `✅ ${fileName} regenerated and committed successfully! (commit: ${shortSha})`
          : `✅ ${fileName} regenerated and committed successfully!`
      );
      // Auto-dismiss success after 6 seconds
      setTimeout(() => setConfigSuccess(''), 6000);
      await loadConfigurations(false);
    } catch (err) {
      console.error(`Failed to regenerate configuration ${fileName}:`, err);
      const backendMsg = err?.response?.data?.message || err?.response?.data || err?.message;
      setConfigError(typeof backendMsg === 'string' ? backendMsg : `Failed to regenerate ${fileName}. Check console for details.`);
    } finally {
      setRegeneratingFile('');
      setRegenTarget('');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Completed: 'success',
      completed: 'success',
      Success: 'success',
      success: 'success',
      Failed: 'danger',
      failed: 'danger',
      Error: 'danger',
      error: 'danger',
      Deploying: 'warning',
      deploying: 'warning',
      Uploading: 'info',
      Processing: 'info',
    };
    return statusMap[status] || 'secondary';
  };

  if (loading && !project) {
    return (
      <div className="project-loading">
        <NavigationBar />
        <div className="spinner-container">
          <Spinner animation="border" role="status" variant="light" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-not-found">
        <NavigationBar />
        <div className="not-found-container">
          <Alert variant="danger">Project not found</Alert>
          <Button variant="outline-light" onClick={() => navigate('/projects')}>
            <ArrowLeft className="me-2" /> Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <NavigationBar />
      <main className="project-main-content">
        <div className="project-header">
          <div className="project-title-container">
            <button onClick={() => navigate(-1)} className="back-button">
              <ArrowLeft size={20} /> Back
            </button>
            <h1>{project.projectName || 'Unnamed Project'}</h1>
            <p className="project-description">{project.description || 'No description available'}</p>
          </div>
          <div className="project-actions">
            <Badge bg={getStatusBadge(project.status)} className="status-badge">
              {project.status}
            </Badge>
            <Button
              variant="primary"
              onClick={() => setShowDeployModal(true)}
              className="deploy-button"
            >
              <FaRocket className="me-2" /> Deploy
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="project-tabs">
          <div 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </div>
          <div 
            className={`tab ${activeTab === 'deployment' ? 'active' : ''}`}
            onClick={() => setActiveTab('deployment')}
          >
            Deployment Info
          </div>
          <div 
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Deployment Logs
          </div>
          <div 
            className={`tab ${activeTab === 'configuration' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuration')}
          >
            Configuration
          </div>
          <div 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Deployments
          </div>
        </div>

        <div className="project-tab-content">
          {activeTab === 'overview' && (
            <div className="project-overview">
              <Card className="info-card-enhanced">
                <Card.Body>
                  <div className="card-header-enhanced">
                    <div className="header-icon-wrapper">
                      <FaRocket className="header-icon" />
                    </div>
                    <h5>Project Information</h5>
                  </div>
                  <div className="info-grid-enhanced">
                    <div className="info-item-enhanced">
                      <div className="info-icon-label">
                        <FaExternalLinkAlt className="info-icon" />
                        <span className="info-label-enhanced">Platform</span>
                      </div>
                      <div className="info-value-enhanced">
                        {latestDeployment?.platform === 'netlify' ? 'Netlify' :
                         latestDeployment?.platform === 'vercel' ? 'Vercel' :
                         latestDeployment?.platform === 'cloudflare' ? 'Cloudflare' :
                         latestDeployment?.platform || project.platform || 'N/A'}
                      </div>
                    </div>
                    <div className="info-item-enhanced">
                      <div className="info-icon-label">
                        <div className="status-indicator" style={{
                          backgroundColor: (latestDeployment?.status || project.status) === 'Completed' ? '#10b981' :
                                         (latestDeployment?.status || project.status) === 'completed' ? '#10b981' :
                                         (latestDeployment?.status || project.status) === 'Failed' ? '#ef4444' :
                                         (latestDeployment?.status || project.status) === 'failed' ? '#ef4444' : '#f59e0b'
                        }}></div>
                        <span className="info-label-enhanced">Status</span>
                      </div>
                      <div>
                        <Badge bg={getStatusBadge(latestDeployment?.status || project.status)} className="status-badge-enhanced">
                          {latestDeployment?.status || project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="info-item-enhanced">
                      <div className="info-icon-label">
                        <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                        </svg>
                        <span className="info-label-enhanced">Created</span>
                      </div>
                      <div className="info-value-enhanced">
                        {latestDeployment?.deployedAt ? new Date(latestDeployment.deployedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'N/A'}
                      </div>
                    </div>
                    <div className="info-item-enhanced">
                      <div className="info-icon-label">
                        <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                          <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                        </svg>
                        <span className="info-label-enhanced">Last Updated</span>
                      </div>
                      <div className="info-value-enhanced">
                        {latestDeployment?.deployedAt ? new Date(latestDeployment.deployedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <div className="danger-zone">
                <h5>Danger Zone</h5>
                <p>Once you delete a project, there is no going back. Please be certain.</p>
                <Button 
                  variant="outline-danger" 
                  onClick={handleDelete}
                  className="delete-button"
                >
                  <FaTrash className="me-2" /> Delete Project
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="deployment-info">
              {deploymentInfo?.projectId ? (
                <DeploymentMonitorEmbedded
                  projectId={deploymentInfo.projectId}
                  mongoDeploymentId={deploymentInfo.mongoDeploymentId}
                  onStatusUpdate={(status) => {
                    setDeploymentInfo(prev => ({ ...prev, ...status }));

                    setProject(prev => {
                      if (!prev) return prev;

                      return {
                        ...prev,
                        deploymentUrl: status.deploymentUrl || prev.deploymentUrl,
                        githubRepoUrl: status.githubRepoUrl || prev.githubRepoUrl,
                        configFileUrl: status.configFileUrl || prev.configFileUrl,
                        status: status.status === 'Completed' ? 'Completed' : prev.status
                      };
                    });

                    if (project?.repoId) {
                      getDeploymentsByRepoId(project.repoId).then(deployments => {
                        if (Array.isArray(deployments)) {
                          setAllDeployments(deployments);
                        } else if (deployments) {
                          setAllDeployments([deployments]);
                        }
                      }).catch(console.warn);
                    }
                  }}
                />
              ) : (
                <>
                  {project.githubRepoUrl && (
                    <Card className="mb-4">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <FaGithub className="me-2" size={20} />
                          <h5 className="mb-0">GitHub Repository</h5>
                        </div>
                        <a 
                          href={project.githubRepoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="deployment-link"
                        >
                          {project.githubRepoName || project.githubRepoUrl}
                          <FaExternalLinkAlt className="ms-2" size={12} />
                        </a>
                      </Card.Body>
                    </Card>
                  )}

                  {project.deploymentUrl && (
                    <Card className="mb-4">
                      <Card.Body>
                        <h5 className="mb-3">Deployment URL</h5>
                        <a 
                          href={project.deploymentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="deployment-link"
                        >
                          {project.deploymentUrl}
                          <FaExternalLinkAlt className="ms-2" size={12} />
                        </a>
                        {project.status === 'Completed' && (
                          <Button 
                            variant="primary" 
                            className="mt-3"
                            onClick={() => window.open(project.deploymentUrl, '_blank')}
                          >
                            View Live Site
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                  {project.status === 'Failed' && (
                    <Alert variant="danger">
                      <strong>Deployment Failed</strong>
                      <p className="mb-0 mt-2">
                        The deployment encountered an error. Please check your configuration and try again.
                      </p>
                    </Alert>
                  )}

                  {!project.githubRepoUrl && !project.deploymentUrl && (
                    <Alert variant="info">
                      No deployment information available. Click "Deploy" to start a new deployment.
                    </Alert>
                  )}
                </>
              )}

              {/* Deployment History */}
              <div className="mt-4" style={{ width: '100%', maxWidth: '100%', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
                <h5 className="mb-3" style={{ color: '#ffffff' }}>Deployment History</h5>
                {loadingDeployments ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                  </div>
                ) : allDeployments.length > 0 ? (
                  <div className="d-flex flex-column gap-3" style={{ width: '100%', maxWidth: '100%', marginLeft: 0, marginRight: 0 }}>
                    {allDeployments.map((deployment, index) => {
                      const deploymentId = deployment.id || deployment._id || deployment.Id;
                      const status = deployment.status || 'unknown';
                      const statusLower = status.toLowerCase();
                      const isSuccess = statusLower === 'completed' || statusLower === 'success';
                      const isFailed = statusLower === 'failed' || statusLower === 'error';
                      const deployedAt = deployment.deployedAt ? new Date(deployment.deployedAt) : null;
                      
                      const getPlatformInfo = (platform) => {
                        if (!platform) return { name: 'Unknown', icon: null };
                        const platformLower = platform.toLowerCase();
                        switch (platformLower) {
                          case 'vercel':
                            return { name: 'Vercel', icon: SiVercel };
                          case 'netlify':
                            return { name: 'Netlify', icon: SiNetlify };
                          case 'cloudflare':
                            return { name: 'Cloudflare', icon: FaCloudflare };
                          case 'githubpages':
                          case 'github':
                            return { name: 'GitHub Pages', icon: FaGithub };
                          default:
                            return { name: platform.charAt(0).toUpperCase() + platform.slice(1), icon: null };
                        }
                      };
                      
                      const platformInfo = getPlatformInfo(deployment.platform);
                      const PlatformIcon = platformInfo.icon;
                      
                      return (
                        <Card
                          key={deploymentId || index}
                          style={{
                            backgroundColor: '#2d1b4e',
                            border: '1px solid #6c3fb5',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '100%',
                            margin: 0,
                            marginLeft: 0,
                            marginRight: 0,
                            boxSizing: 'border-box'
                          }}
                        >
                          <Card.Body style={{ width: '100%', padding: '1.25rem', boxSizing: 'border-box' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <Badge
                                bg={isSuccess ? 'success' : isFailed ? 'danger' : 'secondary'}
                                style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                              {deployedAt && (
                                <span style={{ color: '#ffffff', fontSize: '1rem' }}>
                                  {deployedAt.toLocaleString()}
                                </span>
                              )}
                            </div>
                            
                            {deployment.serviceUrl && (
                              <div className="mb-3">
                                <a
                                  href={deployment.serviceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '1rem',
                                    transition: 'color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#b89dff';
                                    e.target.style.textDecoration = 'underline';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = '#ffffff';
                                    e.target.style.textDecoration = 'none';
                                  }}
                                >
                                  {deployment.serviceUrl}
                                  <FaExternalLinkAlt size={14} />
                                </a>
                              </div>
                            )}
                            
                            {deployment.repoId && (
                              <div style={{ color: '#b8a3d9', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                                Repo: {deployment.repoId}
                              </div>
                            )}
                            
                            {deployment.platform && (
                              <div className="d-flex align-items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                                {PlatformIcon && (
                                  <PlatformIcon size={22} style={{ color: '#ffffff' }} />
                                )}
                                <span style={{ color: '#ffffff', fontSize: '1rem' }}>
                                  {platformInfo.name}
                                </span>
                              </div>
                            )}
                            
                            {deploymentId && (
                              <div style={{ color: '#b8a3d9', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                                ID: {deploymentId}
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Alert variant="info" className="mb-0">
                    No deployment history found for this project.
                  </Alert>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="deployment-logs-tab">
              <DeploymentLogsEmbedded 
                deploymentId={latestDeployment?.id || latestDeployment?._id || latestDeployment?.Id || deploymentInfo?.mongoDeploymentId || (allDeployments.length > 0 ? (allDeployments[0].id || allDeployments[0]._id || allDeployments[0].Id) : null)} 
                platform={latestDeployment?.platform || project?.platform}
              />
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="upcoming-deployments">
              <h5 className="mb-3" style={{ color: '#ffffff' }}>Upcoming Deployments</h5>
              {loadingScheduled && scheduledDeployments.length === 0 ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2" style={{ color: '#b8a3d9' }}>Checking for scheduled deployments...</p>
                </div>
              ) : scheduledDeployments.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {scheduledDeployments.map((deployment, index) => {
                    const scheduledTime = deployment.scheduledTime ? new Date(deployment.scheduledTime) : null;
                    const isExecuted = deployment.isExecuted;
                    const status = deployment.status || 'Pending';
                    const statusLower = status.toLowerCase();
                    const getScheduledBadgeVariant = () => {
                      if (statusLower === 'failed' || statusLower === 'error') return 'danger';
                      if (statusLower === 'completed' || statusLower === 'success') return 'success';
                      if (statusLower === 'deploying' || statusLower === 'pending') return 'warning';
                      if (isExecuted) return 'success';
                      return 'info';
                    };
                    
                    return (
                      <Card 
                        key={deployment.id || index}
                        style={{
                          backgroundColor: '#2d1b4e',
                          border: '1px solid #6c3fb5',
                          borderRadius: '12px'
                        }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <Badge bg={getScheduledBadgeVariant()} className="mb-2">
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                              <h6 style={{ color: '#ffffff' }} className="mb-1">
                                {deployment.platform?.toUpperCase() || 'UNKNOWN PLATFORM'} Deployment
                              </h6>
                            </div>
                            <div className="text-end">
                              <div className="d-flex align-items-center gap-2" style={{ color: '#b89dff' }}>
                                <FaClock size={14} />
                                <span style={{ fontSize: '0.9rem' }}>
                                  {scheduledTime ? scheduledTime.toLocaleString() : 'Not set'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ color: '#b8a3d9', fontSize: '0.9rem' }}>
                            <FaCalendarAlt size={14} className="me-2" />
                            Target: {deployment.platform}
                          </div>
                          {deployment.isExecuted && (
                            <div className="mt-2 text-success" style={{ fontSize: '0.85rem' }}>
                              ✓ Executed - Refreh implementation to see in history.
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-5 text-center">
                  <FaCalendarAlt size={48} style={{ color: '#b8a3d9', opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ color: '#b8a3d9' }}>No upcoming deployments scheduled for this project.</p>
                  <Button variant="outline-primary" onClick={() => setShowDeployModal(true)} size="sm">
                    Schedule One Now
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="configuration-info">
              <Card className="config-card-enhanced">
                <Card.Body>
                  {/* ── Header ─────────────────────────────────────────── */}
                  <div className="config-header-enhanced">
                    <div className="config-header-left">
                      <div className="config-icon-wrapper">
                        <svg className="config-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                          <path d="M12 1v6m0 6v6M1 12h6m6 0h6" strokeWidth="2"/>
                          <path d="M4.22 4.22l4.24 4.24m7.08 0l4.24-4.24m0 15.56l-4.24-4.24m-7.08 0l-4.24 4.24" strokeWidth="2"/>
                        </svg>
                        <h5 className="mb-0">Project Configuration</h5>
                      </div>
                      <p className="config-subtitle">
                        Manage, preview, and safely regenerate your repository configuration files.
                        {!loadingConfigs && configsList.length > 0 && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600 }}>
                            {configsList.length} file{configsList.length !== 1 ? 's' : ''} found
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Reload button */}
                    <div style={{ flexShrink: 0 }}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={loadingConfigs}
                        onClick={() => { setConfigSuccess(''); setConfigError(''); loadConfigurations(false); }}
                        style={{ fontSize: '0.8rem', borderColor: 'rgba(108,63,181,0.5)', color: '#b89dff' }}
                      >
                        {loadingConfigs ? <Spinner animation="border" size="sm" /> : '↺ Refresh'}
                      </Button>
                    </div>
                  </div>

                  {/* ── Notification banners ────────────────────────────── */}
                  {error && !configError && (
                    <Alert variant="danger" className="mt-3 mb-0" dismissible onClose={() => setError('')}>
                      <strong>Error:</strong> {error}
                    </Alert>
                  )}
                  {configError && (
                    <Alert variant="danger" className="mt-3 mb-0" dismissible onClose={() => setConfigError('')}>
                      <strong>Regeneration failed:</strong> {configError}
                    </Alert>
                  )}
                  {configSuccess && (
                    <Alert variant="success" className="mt-3 mb-0" dismissible onClose={() => setConfigSuccess('')}
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#86efac' }}>
                      {configSuccess}
                    </Alert>
                  )}

                  {/* ── Loading state ───────────────────────────────────── */}
                  {loadingConfigs && configsList.length === 0 ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" style={{ color: '#8b5cf6' }} />
                      <p className="mt-3" style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        Scanning repository for configuration files...
                      </p>
                    </div>
                  ) : !loadingConfigs && configsList.length === 0 ? (
                    /* ── Empty state — no config files found ──────────────── */
                    <div className="config-sidebar-empty" style={{ padding: '4rem 2rem' }}>
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        style={{ opacity: 0.25, marginBottom: '1rem' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                        <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                      </svg>
                      <p style={{ color: '#9ca3af', fontSize: '0.95rem', fontWeight: 600 }}>
                        No configuration files found in this repository.
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: '380px', textAlign: 'center' }}>
                        Deploy your project first to generate configuration files, or add a supported config file
                        (e.g. <code>vercel.json</code>, <code>netlify.toml</code>) to the repository root.
                      </p>
                    </div>
                  ) : (
                    /* ── Split layout ─────────────────────────────────────── */
                    <div className="config-split-layout mt-3">

                      {/* ── Left Sidebar ───────────────────────────────── */}
                      <div className="config-sidebar">
                        <div className="config-sidebar-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          Config Files
                          <span style={{
                            marginLeft: 'auto',
                            background: 'rgba(139,92,246,0.25)',
                            color: '#c4b5fd',
                            borderRadius: '10px',
                            padding: '1px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {configsList.length}
                          </span>
                        </div>

                        <ul className="config-sidebar-list">
                          {configsList.map((file) => {
                            const name = file.fileName || file.FileName;
                            const isSelected = selectedFile && (selectedFile.fileName || selectedFile.FileName) === name;
                            const isRegenerating = regeneratingFile === name;

                            // Determine file type icon
                            const ext = name.split('.').pop().toLowerCase();
                            const isJson = ext === 'json';
                            const isYaml = ext === 'yml' || ext === 'yaml';
                            const isToml = ext === 'toml';

                            return (
                              <li
                                key={name}
                                className={`config-sidebar-item ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedFile(file)}
                              >
                                <div className="config-sidebar-item-header">
                                  <span className="config-file-name">
                                    {/* File type color tag */}
                                    <span style={{
                                      display: 'inline-block',
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      marginRight: 6,
                                      background: isJson ? '#f59e0b' : isYaml ? '#3b82f6' : isToml ? '#10b981' : '#8b5cf6',
                                      flexShrink: 0
                                    }} />
                                    {name}
                                  </span>
                                  <Badge
                                    className="config-status-badge"
                                    style={{ background: 'rgba(34,197,94,0.18)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }}
                                  >
                                    In Repo
                                  </Badge>
                                </div>

                                <div className="config-sidebar-item-actions">
                                  <button
                                    className="config-item-btn-regen"
                                    disabled={isRegenerating || regeneratingFile !== ''}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegenerateFile(name);
                                    }}
                                    title={`Safely regenerate ${name} — existing values will be preserved`}
                                  >
                                    {isRegenerating ? (
                                      <><Spinner animation="border" size="sm" /> Regenerating...</>
                                    ) : (
                                      '↺ Regenerate'
                                    )}
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* ── Right: File Content Viewer ──────────────────── */}
                      <div className="config-main-viewer">
                        {selectedFile ? (
                          <>
                            <div className="config-viewer-header">
                              <span className="config-viewer-title">
                                {selectedFile.fileName || selectedFile.FileName}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 4,
                                  background: 'rgba(34,197,94,0.18)',
                                  color: '#86efac',
                                  border: '1px solid rgba(34,197,94,0.3)',
                                  fontWeight: 600
                                }}>
                                  In Repo
                                </span>
                                {project?.githubRepoUrl && (
                                  <a
                                    href={`${project.githubRepoUrl}/blob/${project.branch || 'main'}/${selectedFile.fileName || selectedFile.FileName}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '0.78rem',
                                      color: '#60a5fa',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <FaGithub size={12} /> View on GitHub
                                  </a>
                                )}
                              </div>
                            </div>
                            {/* Custom-designed scrollable line-numbered ConfigViewer */}
                            <ConfigViewer
                              content={selectedFile.content || selectedFile.Content || ''}
                              fileName={selectedFile.fileName || selectedFile.FileName}
                            />
                          </>
                        ) : (
                          <div className="config-viewer-empty">
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              style={{ opacity: 0.2 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5"/>
                              <polyline points="14 2 14 8 20 8" strokeWidth="1.5"/>
                              <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5"/>
                              <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5"/>
                              <polyline points="10 9 9 9 8 9" strokeWidth="1.5"/>
                            </svg>
                            <p style={{ fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>No file selected</p>
                            <p style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                              Click a file from the sidebar to preview its content.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      </main>

      <DeploymentModal
        show={showDeployModal}
        onHide={() => setShowDeployModal(false)}
        project={project}
        latestDeployment={latestDeployment}
        onDeploymentStart={(deploymentData) => {
          setDeploymentInfo(deploymentData);
          setActiveTab('deployment');
          fetchProjectDetails();
          fetchLatestDeployment();
        }}
      />

      <ConfigRegenModal
        show={showRegenModal}
        onHide={() => { setShowRegenModal(false); setRegenTarget(''); }}
        onConfirm={confirmRegenerateFile}
        fileName={regenTarget}
        currentContent={(() => {
          const targetFile = configsList.find(f => (f.fileName || f.FileName) === regenTarget);
          return targetFile ? (targetFile.content || targetFile.Content || '') : null;
        })()}
        previewContent={regenPreview}
        loading={loadingRegenPreview}
        regenerating={regeneratingFile !== ''}
        error={regenPreviewError}
      />
    </div>
  );
};

export default ProjectDetail;