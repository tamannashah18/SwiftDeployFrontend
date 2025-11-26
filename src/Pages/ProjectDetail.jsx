import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Nav, Badge } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { FaRocket } from 'react-icons/fa';
import { getProjectDetails, deleteProject, regenerateConfig } from '../api/deployments';
import { NavigationBar } from '../Components/NavigationBar';
import DeploymentModal from '../Components/DeploymentModal';
import '../css/Responsive.css';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-vh-100" style={{ backgroundColor: '#1a0033' }}>
        <NavigationBar />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" role="status" style={{ color: '#b89dff' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-vh-100" style={{ backgroundColor: '#1a0033' }}>
        <NavigationBar />
        <Container className="py-5 text-center" style={{ marginLeft: '5rem' }}>
          <Alert variant="danger">Project not found</Alert>
          <Button variant="outline-light" onClick={() => navigate('/projects')} className="mt-3">
            <ArrowLeft className="me-2" /> Back to Projects
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#1a0033' }}>
      <NavigationBar />
      <Container fluid className="py-4" style={{ marginLeft: '5rem', paddingRight: '2rem' }}>
        <div className="row mb-4 align-items-center">
          <div className="col-auto">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => navigate('/projects')}
              className="d-flex align-items-center gap-1"
              style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
            >
              <ArrowLeft size={16} /> Back
            </Button>
          </div>
          <div className="col">
            <h1 className="h4 mb-1" style={{ color: '#ffffff' }}>{project.projectName}</h1>
            <p className="mb-0 small" style={{ color: '#b8a3d9' }}>{project.description}</p>
          </div>
          <div className="col-auto d-flex align-items-center gap-2">
            <Button
              onClick={() => setShowDeployModal(true)}
              style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5', fontSize: '0.875rem' }}
              className="d-flex align-items-center gap-2"
              size="sm"
            >
              <FaRocket size={14} /> Deploy
            </Button>
            <Badge bg={getStatusBadge(project.status)} style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
              {project.status}
            </Badge>
          </div>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        <Card className="mb-4" style={{ backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5' }}>
          <Card.Body className="p-0">
            <Nav variant="tabs" defaultActiveKey="overview" onSelect={(k) => setActiveTab(k)} style={{ borderBottom: '1px solid #6c3fb5' }}>
              <Nav.Item>
                <Nav.Link
                  eventKey="overview"
                  className={activeTab === 'overview' ? 'active' : ''}
                  style={{ color: activeTab === 'overview' ? '#ffffff' : '#b8a3d9', backgroundColor: activeTab === 'overview' ? '#6c3fb5' : 'transparent' }}
                >
                  Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="deployment"
                  className={activeTab === 'deployment' ? 'active' : ''}
                  style={{ color: activeTab === 'deployment' ? '#ffffff' : '#b8a3d9', backgroundColor: activeTab === 'deployment' ? '#6c3fb5' : 'transparent' }}
                >
                  Deployment Info
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="configuration"
                  className={activeTab === 'configuration' ? 'active' : ''}
                  style={{ color: activeTab === 'configuration' ? '#ffffff' : '#b8a3d9', backgroundColor: activeTab === 'configuration' ? '#6c3fb5' : 'transparent' }}
                >
                  Configuration
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <div className="p-4" style={{ color: '#ffffff' }}>
              {activeTab === 'overview' && (
                <div>
                  <h5 className="mb-4" style={{ color: '#ffffff' }}>Project Information</h5>
                  <Row>
                    <Col sm={12} md={6} lg={6} className="mb-3">
                      <strong style={{ color: '#b89dff' }}>Platform:</strong>
                      <div className="text-capitalize" style={{ color: '#b8a3d9' }}>{project.platform}</div>
                    </Col>
                    <Col sm={12} md={6} lg={6} className="mb-3">
                      <strong style={{ color: '#b89dff' }}>Status:</strong>
                      <div style={{ color: '#b8a3d9' }}>{project.statusMessage || project.status}</div>
                    </Col>
                    <Col sm={12} md={6} lg={6} className="mb-3">
                      <strong style={{ color: '#b89dff' }}>Created:</strong>
                      <div style={{ color: '#b8a3d9' }}>{new Date(project.createdAt).toLocaleString()}</div>
                    </Col>
                    <Col sm={12} md={6} lg={6} className="mb-3">
                      <strong style={{ color: '#b89dff' }}>Progress:</strong>
                      <div className="progress mt-2">
                        <div
                          className={`progress-bar bg-${getStatusBadge(project.status)}`}
                          role="progressbar"
                          style={{ width: `${project.progress || 0}%` }}
                        >
                          {project.progress || 0}%
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {project.currentStep && (
                    <Alert variant="info" className="mt-3">
                      <strong>Current Step:</strong> {project.currentStep}
                    </Alert>
                  )}
                </div>
              )}

              {activeTab === 'deployment' && (
                <div>
                  <h5 className="mb-4" style={{ color: '#ffffff' }}>Deployment Details</h5>

                  {project.githubRepoUrl && (
                    <div className="mb-3">
                      <strong style={{ color: '#b89dff' }}>GitHub Repository:</strong>
                      <div>
                        <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#b89dff' }}>
                          {project.githubRepoName || project.githubRepoUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {project.deploymentUrl && (
                    <div className="mb-3">
                      <strong style={{ color: '#b89dff' }}>Deployment URL:</strong>
                      <div>
                        <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#b89dff' }}>
                          {project.deploymentUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {project.status === 'Completed' && project.deploymentUrl && (
                    <Button
                      onClick={() => window.open(project.deploymentUrl, '_blank')}
                      className="mt-3"
                      style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5', color: '#ffffff' }}
                    >
                      View Live Site
                    </Button>
                  )}

                  {project.status === 'Failed' && (
                    <Alert variant="danger" className="mt-3">
                      Deployment failed. Please check your configuration and try again.
                    </Alert>
                  )}
                </div>
              )}

              {activeTab === 'configuration' && (
                <div>
                  <h5 className="mb-4" style={{ color: '#ffffff' }}>Configuration</h5>

                  {project.config && (
                    <div className="bg-dark text-light p-3 rounded mb-3" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                      <pre className="mb-0">
                        <code>{JSON.stringify(project.config, null, 2)}</code>
                      </pre>
                    </div>
                  )}

                  <Button
                    variant="outline-light"
                    onClick={handleRegenerateConfig}
                    size="sm"
                  >
                    Regenerate Configuration
                  </Button>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        <Card className="border-danger" style={{ backgroundColor: '#2d1b4e', borderColor: '#dc3545 !important' }}>
          <Card.Body>
            <h5 className="mb-3" style={{ color: '#ff6b6b' }}>Danger Zone</h5>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1" style={{ color: '#ffffff' }}>Delete this project</h6>
                <p className="small mb-0" style={{ color: '#b8a3d9' }}>
                  Once you delete a project, there is no going back. Please be certain.
                </p>
              </div>
              <Button variant="outline-danger" size="sm" onClick={handleDelete}>
                Delete Project
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>

      <DeploymentModal
        show={showDeployModal}
        onHide={() => setShowDeployModal(false)}
        project={project}
      />
    </div>
  );
};

export default ProjectDetail;
