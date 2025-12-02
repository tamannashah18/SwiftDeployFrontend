import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { FaRocket, FaGithub, FaExternalLinkAlt, FaTrash, FaCloudflare } from 'react-icons/fa';
import { SiNetlify, SiVercel } from 'react-icons/si';
import { getProjectDetails, deleteProject, regenerateConfig, getDeploymentsByRepoId, getLatestDeployment } from '../api/deployments';
import { NavigationBar } from '../Components/NavigationBar';
import DeploymentModal from '../Components/DeploymentModal';
import DeploymentMonitorEmbedded from '../Components/DeploymentMonitorEmbedded';
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

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    // Initialize deployment info from project if available
    if (project && project._id && !deploymentInfo) {
      // Check if project has deployment-related data
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

  useEffect(() => {
    // Fetch all deployments for this project when deployment tab is active
    const fetchDeployments = async () => {
      if (activeTab === 'deployment' && project?.repoId) {
        try {
          setLoadingDeployments(true);
          const deployments = await getDeploymentsByRepoId(project.repoId);
          // Handle both single deployment and array response
          if (Array.isArray(deployments)) {
            setAllDeployments(deployments);
          } else if (deployments) {
            setAllDeployments([deployments]);
          } else {
            setAllDeployments([]);
          }
        } catch (err) {
          console.warn('Failed to fetch deployments:', err);
          setAllDeployments([]);
        } finally {
          setLoadingDeployments(false);
        }
      }
    };

    fetchDeployments();
  }, [activeTab, project?.repoId]);

  useEffect(() => {
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
    fetchLatestDeployment();
  }, [project?.repoId]);

  useEffect(() => {
    const shouldOpenDeployModal = localStorage.getItem('open_deploy_modal_netlify');
    if (shouldOpenDeployModal === 'true' && project) {
      setShowDeployModal(true);
    }
  }, [project]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const data = await getProjectDetails(id);
      setProject(data);
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error fetching project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError('Failed to delete project');
      console.error(err);
    }
  };

  const handleRegenerateConfig = async () => {
    try {
      await regenerateConfig(id, project.config, project.projectName);
      alert('Configuration regenerated successfully!');
      fetchProjectDetails();
    } catch (err) {
      setError('Failed to regenerate configuration');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Completed: 'success',
      Failed: 'danger',
      Deploying: 'warning',
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

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

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
            className={`tab ${activeTab === 'configuration' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuration')}
          >
            Configuration
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
              {/* Show deployment monitor if there's an active deployment */}
              {deploymentInfo?.projectId ? (
                <DeploymentMonitorEmbedded
                  projectId={deploymentInfo.projectId}
                  mongoDeploymentId={deploymentInfo.mongoDeploymentId}
                  onStatusUpdate={(status) => {
                    setDeploymentInfo(prev => ({ ...prev, ...status }));
                    // Update project with latest deployment info
                    if (status.deploymentUrl) {
                      setProject(prev => ({
                        ...prev,
                        deploymentUrl: status.deploymentUrl,
                        githubRepoUrl: status.githubRepoUrl || prev.githubRepoUrl,
                        status: status.status === 'Completed' ? 'Completed' : prev.status
                      }));
                    }
                    // Refresh deployments list
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
                  {/* Static deployment info from project */}
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
                      const isSuccess = statusLower === 'completed';
                      const isFailed = statusLower === 'failed';
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
                          className="w-100"
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

          {activeTab === 'configuration' && (
            <div className="configuration-info">
              <Card className="config-card-enhanced">
                <Card.Body>
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
                      <p className="config-subtitle">Build and deployment settings</p>
                    </div>
                    <Button
                      className="regenerate-button"
                      size="sm"
                      onClick={handleRegenerateConfig}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="me-1">
                        <polyline points="23 4 23 10 17 10" strokeWidth="2"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="2"/>
                      </svg>
                      Regenerate
                    </Button>
                  </div>

                  {project.config ? (
                    <div className="config-content-enhanced">
                      <div className="config-grid">
                        {Object.entries(project.config).map(([key, value]) => (
                          <div key={key} className="config-item-enhanced">
                            <div className="config-key">
                              <code>{key}</code>
                            </div>
                            <div className="config-value">
                              <code>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="config-raw">
                        <div className="config-raw-header">
                          <span>Raw JSON</span>
                        </div>
                        <pre className="config-json-enhanced">
                          <code>{JSON.stringify(project.config, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="config-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.3">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                      </svg>
                      <p>No configuration available for this project.</p>
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
        onDeploymentStart={(deploymentData) => {
          // Set deployment info and switch to deployment tab
          setDeploymentInfo(deploymentData);
          setActiveTab('deployment');
          // Refresh project details to get latest info
          fetchProjectDetails();
        }}
      />
    </div>
  );
};

export default ProjectDetail;
