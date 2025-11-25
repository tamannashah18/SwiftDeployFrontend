import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavigationBar } from '../Components/NavigationBar';
import { getDeploymentStatus, pollDeployment } from '../api/deployments';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

function DeploymentMonitor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const startPolling = async () => {
      try {
        setLoading(true);
        await pollDeployment(
          projectId,
          (status) => {
            setDeployment(status);
            setLoading(false);
          },
          3000
        );
      } catch (err) {
        setError('Failed to fetch deployment status');
        console.error(err);
        setLoading(false);
      }
    };

    startPolling();
  }, [projectId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle size={48} className="text-success" />;
      case 'Failed':
        return <FaTimesCircle size={48} className="text-danger" />;
      default:
        return <FaSpinner size={48} className="text-primary spinner-border" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Failed':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const deploymentSteps = [
    'Uploading',
    'Processing',
    'CreatingRepo',
    'PushingCode',
    'GeneratingConfig',
    'Deploying',
    'Completed',
  ];

  const getCurrentStepIndex = () => {
    if (!deployment) return 0;
    const stepIndex = deploymentSteps.indexOf(deployment.status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  if (loading && !deployment) {
    return (
      <div className="min-vh-100 bg-light">
        <NavigationBar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <NavigationBar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  {getStatusIcon(deployment?.status)}
                  <h2 className="mt-4 mb-2">
                    {deployment?.status === 'Completed'
                      ? 'Deployment Successful!'
                      : deployment?.status === 'Failed'
                      ? 'Deployment Failed'
                      : 'Deploying Your Project'}
                  </h2>
                  <p className="text-muted">{deployment?.message || 'Please wait...'}</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {deployment && (
                  <>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-bold">Progress</span>
                        <span className="text-muted">{deployment.progress || 0}%</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div
                          className={`progress-bar bg-${getStatusColor(deployment.status)}`}
                          role="progressbar"
                          style={{ width: `${deployment.progress || 0}%` }}
                          aria-valuenow={deployment.progress || 0}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="mb-3">Deployment Steps</h5>
                      <div className="list-group">
                        {deploymentSteps.map((step, index) => {
                          const currentIndex = getCurrentStepIndex();
                          const isCompleted = index < currentIndex;
                          const isCurrent = index === currentIndex;

                          return (
                            <div
                              key={step}
                              className={`list-group-item ${
                                isCompleted
                                  ? 'list-group-item-success'
                                  : isCurrent
                                  ? 'list-group-item-warning'
                                  : ''
                              }`}
                            >
                              <div className="d-flex align-items-center">
                                {isCompleted && <FaCheckCircle className="text-success me-2" />}
                                {isCurrent && <FaSpinner className="text-warning me-2 spinner-border spinner-border-sm" />}
                                {!isCompleted && !isCurrent && (
                                  <div
                                    className="rounded-circle bg-secondary me-2"
                                    style={{ width: '16px', height: '16px' }}
                                  />
                                )}
                                <span className={isCurrent ? 'fw-bold' : ''}>
                                  {step.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {deployment.currentStep && (
                      <div className="alert alert-info" role="alert">
                        <strong>Current Step:</strong> {deployment.currentStep}
                      </div>
                    )}

                    {deployment.githubRepoUrl && (
                      <div className="mb-3">
                        <strong>GitHub Repository:</strong>{' '}
                        <a href={deployment.githubRepoUrl} target="_blank" rel="noopener noreferrer">
                          {deployment.githubRepoUrl}
                        </a>
                      </div>
                    )}

                    {deployment.deploymentUrl && deployment.status === 'Completed' && (
                      <div className="mb-4">
                        <strong>Deployment URL:</strong>{' '}
                        <a href={deployment.deploymentUrl} target="_blank" rel="noopener noreferrer" className="text-success">
                          {deployment.deploymentUrl}
                        </a>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary" onClick={() => navigate('/projects')}>
                        Back to Projects
                      </button>
                      {deployment.status === 'Completed' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => window.open(deployment.deploymentUrl, '_blank')}
                        >
                          View Deployment
                        </button>
                      )}
                      {deployment.status === 'Failed' && (
                        <button className="btn btn-danger" onClick={() => navigate('/new-project')}>
                          Try Again
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeploymentMonitor;
