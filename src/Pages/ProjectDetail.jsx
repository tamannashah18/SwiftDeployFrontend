import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Nav, Badge } from 'react-bootstrap';
import { ArrowLeft, Gear } from 'react-bootstrap-icons';
import { getProjectDetails, deleteProject, regenerateConfig } from '../api/deployments';
import { NavigationBar } from '../Components/NavigationBar';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

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
      <div className="min-vh-100 bg-light">
        <NavigationBar />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-vh-100 bg-light">
        <NavigationBar />
        <Container className="py-5 text-center">
          <Alert variant="danger">Project not found</Alert>
          <Button variant="outline-primary" onClick={() => navigate('/projects')} className="mt-3">
            <ArrowLeft className="me-2" /> Back to Projects
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <NavigationBar />
      <Container className="py-4">
        <div className="d-flex align-items-center mb-4">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-3"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft /> Back
          </Button>
          <div>
            <h1 className="h3 mb-0">{project.projectName}</h1>
            <p className="text-muted mb-0">{project.description}</p>
          </div>
          <div className="ms-auto">
            <Badge bg={getStatusBadge(project.status)} className="fs-6">
              {project.status}
            </Badge>
          </div>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        <Card className="mb-4">
          <Card.Body className="p-0">
            <Nav variant="tabs" defaultActiveKey="overview" onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="overview" className={activeTab === 'overview' ? 'active' : ''}>
                  Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="deployment" className={activeTab === 'deployment' ? 'active' : ''}>
                  Deployment Info
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="configuration" className={activeTab === 'configuration' ? 'active' : ''}>
                  Configuration
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <div className="p-4">
              {activeTab === 'overview' && (
                <div>
                  <h5 className="mb-4">Project Information</h5>
                  <Row>
                    <Col md={6} className="mb-3">
                      <strong>Platform:</strong>
                      <div className="text-capitalize">{project.platform}</div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Status:</strong>
                      <div>{project.statusMessage || project.status}</div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Created:</strong>
                      <div>{new Date(project.createdAt).toLocaleString()}</div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Progress:</strong>
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
                  <h5 className="mb-4">Deployment Details</h5>

                  {project.githubRepoUrl && (
                    <div className="mb-3">
                      <strong>GitHub Repository:</strong>
                      <div>
                        <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer">
                          {project.githubRepoName || project.githubRepoUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {project.deploymentUrl && (
                    <div className="mb-3">
                      <strong>Deployment URL:</strong>
                      <div>
                        <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                          {project.deploymentUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {project.status === 'Completed' && project.deploymentUrl && (
                    <Button
                      variant="primary"
                      onClick={() => window.open(project.deploymentUrl, '_blank')}
                      className="mt-3"
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
                  <h5 className="mb-4">Configuration</h5>

                  {project.config && (
                    <div className="bg-dark text-light p-3 rounded mb-3" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                      <pre className="mb-0">
                        <code>{JSON.stringify(project.config, null, 2)}</code>
                      </pre>
                    </div>
                  )}

                  <Button
                    variant="outline-primary"
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

        <Card className="border-danger">
          <Card.Body>
            <h5 className="text-danger mb-3">Danger Zone</h5>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Delete this project</h6>
                <p className="text-muted small mb-0">
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
    </div>
  );
};

export default ProjectDetail;
