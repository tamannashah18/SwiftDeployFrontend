import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { FaRocket, FaGithub, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';
import { getProjectDetails, deleteProject, regenerateConfig } from '../api/deployments';
import { NavigationBar } from '../Components/NavigationBar';
import DeploymentModal from '../Components/DeploymentModal';
import '../css/ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

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
      await regenerateConfig(id, project.config);
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
              <Card className="info-card">
                <Card.Body>
                  <h5>Project Information</h5>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Platform</div>
                      <div className="info-value">
                        {project.platform === 'netlify' ? 'Netlify' : project.platform || 'N/A'}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Status</div>
                      <div>
                        <Badge bg={getStatusBadge(project.status)}>{project.status}</Badge>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Created</div>
                      <div className="info-value">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Last Updated</div>
                      <div className="info-value">
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : 'N/A'}
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
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="configuration-info">
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Project Configuration</h5>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleRegenerateConfig}
                    >
                      Regenerate Configuration
                    </Button>
                  </div>
                  
                  {project.config ? (
                    <pre className="config-json">
                      <code>{JSON.stringify(project.config, null, 2)}</code>
                    </pre>
                  ) : (
                    <Alert variant="info">No configuration available for this project.</Alert>
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
      />
    </div>
  );
};

export default ProjectDetail;
