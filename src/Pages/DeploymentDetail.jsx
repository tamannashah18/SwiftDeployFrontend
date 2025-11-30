import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { FaExternalLinkAlt, FaTrash, FaGithub } from 'react-icons/fa';
import { getDeploymentById, deleteDeployment } from '../api/deployments';
import { NavigationBar } from '../Components/NavigationBar';
import '../css/ProjectDetail.css';

const DeploymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeploymentDetails();
  }, [id]);

  const fetchDeploymentDetails = async () => {
    try {
      setLoading(true);
      const data = await getDeploymentById(id);
      setDeployment(data);
    } catch (err) {
      setError('Failed to load deployment details');
      console.error('Error fetching deployment details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this deployment? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDeployment(id);
      navigate('/deployments');
    } catch (err) {
      setError('Failed to delete deployment');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return 'success';
    if (statusLower === 'failed') return 'danger';
    if (statusLower === 'queued') return 'info';
    if (statusLower === 'processing') return 'warning';
    return 'secondary';
  };

  const getDeploymentId = (deployment) => {
    return deployment?.id || deployment?._id || deployment?.Id || id;
  };

  if (loading && !deployment) {
    return (
      <div className="project-loading">
        <NavigationBar />
        <div className="spinner-container">
          <Spinner animation="border" role="status" variant="light" />
        </div>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="project-not-found">
        <NavigationBar />
        <div className="not-found-container">
          <Alert variant="danger">Deployment not found</Alert>
          <Button variant="outline-light" onClick={() => navigate('/deployments')}>
            <ArrowLeft className="me-2" /> Back to Deployments
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
            <h1>Deployment Details</h1>
            <p className="project-description">
              {deployment.serviceId || deployment.repoId || 'Deployment Information'}
            </p>
          </div>
          <div className="project-actions">
            <Badge bg={getStatusBadge(deployment.status)} className="status-badge">
              {deployment.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        <div className="project-overview">
          <Card className="info-card-enhanced">
            <Card.Body>
              <div className="card-header-enhanced">
                <div className="header-icon-wrapper">
                  <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeWidth="2"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeWidth="2"/>
                    <line x1="12" y1="22.08" x2="12" y2="12" strokeWidth="2"/>
                  </svg>
                </div>
                <h5>Deployment Information</h5>
              </div>
              <div className="info-grid-enhanced">
                <div className="info-item-enhanced">
                  <div className="info-icon-label">
                    <div className="status-indicator" style={{
                      backgroundColor: deployment.status === 'completed' ? '#10b981' :
                                     deployment.status === 'failed' ? '#ef4444' : '#f59e0b'
                    }}></div>
                    <span className="info-label-enhanced">Status</span>
                  </div>
                  <div>
                    <Badge bg={getStatusBadge(deployment.status)} className="status-badge-enhanced">
                      {deployment.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {deployment.repoId && (
                  <div className="info-item-enhanced">
                    <div className="info-icon-label">
                      <FaGithub className="info-icon" />
                      <span className="info-label-enhanced">Repository ID</span>
                    </div>
                    <div className="info-value-enhanced">
                      {deployment.repoId}
                    </div>
                  </div>
                )}

                {deployment.serviceId && (
                  <div className="info-item-enhanced">
                    <div className="info-icon-label">
                      <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeWidth="2"/>
                        <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2"/>
                        <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2"/>
                      </svg>
                      <span className="info-label-enhanced">Service ID</span>
                    </div>
                    <div className="info-value-enhanced">
                      {deployment.serviceId}
                    </div>
                  </div>
                )}

                {deployment.serviceUrl && (
                  <div className="info-item-enhanced">
                    <div className="info-icon-label">
                      <FaExternalLinkAlt className="info-icon" />
                      <span className="info-label-enhanced">Service URL</span>
                    </div>
                    <div className="info-value-enhanced">
                      <a 
                        href={deployment.serviceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="deployment-link"
                        style={{ color: '#8462fc' }}
                      >
                        {deployment.serviceUrl}
                        <FaExternalLinkAlt className="ms-2" size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {deployment.deployedAt && (
                  <div className="info-item-enhanced">
                    <div className="info-icon-label">
                      <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                      </svg>
                      <span className="info-label-enhanced">Deployed At</span>
                    </div>
                    <div className="info-value-enhanced">
                      {new Date(deployment.deployedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}

                <div className="info-item-enhanced">
                  <div className="info-icon-label">
                    <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" strokeWidth="2"/>
                    </svg>
                    <span className="info-label-enhanced">Deployment ID</span>
                  </div>
                  <div className="info-value-enhanced" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {getDeploymentId(deployment)}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {deployment.serviceUrl && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Live Deployment</h5>
                <a 
                  href={deployment.serviceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="deployment-link"
                >
                  {deployment.serviceUrl}
                  <FaExternalLinkAlt className="ms-2" size={12} />
                </a>
                <Button 
                  variant="primary" 
                  className="mt-3"
                  onClick={() => window.open(deployment.serviceUrl, '_blank')}
                >
                  View Live Site
                </Button>
              </Card.Body>
            </Card>
          )}

          <div className="danger-zone">
            <h5>Danger Zone</h5>
            <p>Once you delete a deployment, there is no going back. Please be certain.</p>
            <Button 
              variant="outline-danger" 
              onClick={handleDelete}
              className="delete-button"
            >
              <FaTrash className="me-2" /> Delete Deployment
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeploymentDetail;

