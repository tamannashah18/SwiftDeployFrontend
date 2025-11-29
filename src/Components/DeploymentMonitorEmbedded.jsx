import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner } from 'react-bootstrap';
import { getDeploymentStatus, pollDeployment, getDeploymentById, updateDeploymentStatus } from '../api/deployments';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const DeploymentMonitorEmbedded = ({ projectId, mongoDeploymentId, onStatusUpdate }) => {
  const [deployment, setDeployment] = useState(null);
  const [mongoDeployment, setMongoDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let pollingStopped = false;

    const startPolling = async () => {
      try {
        setLoading(true);
        
        // Fetch MongoDB deployment data if ID is available
        if (mongoDeploymentId && isMounted) {
          try {
            const mongoData = await getDeploymentById(mongoDeploymentId);
            if (isMounted) {
              setMongoDeployment(mongoData);
            }
          } catch (mongoError) {
            console.warn('Failed to fetch MongoDB deployment:', mongoError);
          }
        }

        // Check initial status before starting polling
        try {
          const initialStatus = await getDeploymentStatus(projectId);
          const rawStatus = initialStatus.Status || initialStatus.status;
          const isSuccess = initialStatus.success === true || initialStatus.Success === true;
          const isCompleted = 
            rawStatus === 'Completed' || 
            rawStatus === 'completed' || 
            rawStatus === 'COMPLETED' ||
            (typeof rawStatus === 'number' && rawStatus >= 6) ||
            isSuccess;
          
          if (isCompleted && isMounted) {
            // Already completed, just set the status and stop
            const normalizedStatus = {
              ...initialStatus,
              status: 'Completed',
              message: initialStatus.Message || initialStatus.message,
              githubRepoUrl: initialStatus.GitHubRepoUrl || initialStatus.githubRepoUrl,
              deploymentUrl: initialStatus.DeploymentUrl || initialStatus.deploymentUrl,
              configFileUrl: initialStatus.ConfigFileUrl || initialStatus.configFileUrl,
              projectId: initialStatus.ProjectId || initialStatus.projectId,
              success: true,
              progress: initialStatus.Progress || initialStatus.progress || 100,
              currentStep: initialStatus.CurrentStep || initialStatus.currentStep,
              mongoDeploymentId: initialStatus.MongoDeploymentId || initialStatus.mongoDeploymentId || mongoDeploymentId
            };
            setDeployment(normalizedStatus);
            setLoading(false);
            pollingStopped = true;
            if (onStatusUpdate) {
              onStatusUpdate(normalizedStatus);
            }
            return;
          }
        } catch (err) {
          console.warn('Failed to get initial status:', err);
        }

        if (pollingStopped || !isMounted) return;

        await pollDeployment(
          projectId,
          async (status) => {
            if (!isMounted || pollingStopped) return;

            // Normalize response format (handle both PascalCase and camelCase, and numeric status)
            const rawStatus = status.Status || status.status;
            let normalizedStatusValue = rawStatus;
            
            // Handle numeric status (6 = completed, 0-5 = in progress)
            if (typeof rawStatus === 'number') {
              if (rawStatus >= 6) {
                normalizedStatusValue = 'Completed';
              } else if (rawStatus < 0) {
                normalizedStatusValue = 'Failed';
              } else {
                normalizedStatusValue = 'Processing';
              }
            }
            
            // Check success flag (handle both lowercase and uppercase)
            const isSuccess = status.success === true || status.Success === true || 
                            (status.success !== false && status.Success !== false && normalizedStatusValue === 'Completed');
            
            // Check if deployment is completed or failed - stop polling
            const isCompleted = normalizedStatusValue === 'Completed' || isSuccess;
            const isFailed = normalizedStatusValue === 'Failed';
            
            if (isCompleted || isFailed) {
              pollingStopped = true;
            }
            
            const normalizedStatus = {
              ...status,
              status: normalizedStatusValue,
              message: status.Message || status.message,
              githubRepoUrl: status.GitHubRepoUrl || status.githubRepoUrl,
              deploymentUrl: status.DeploymentUrl || status.deploymentUrl,
              configFileUrl: status.ConfigFileUrl || status.configFileUrl,
              projectId: status.ProjectId || status.projectId,
              success: isSuccess,
              progress: status.Progress || status.progress || (isCompleted ? 100 : 0),
              currentStep: status.CurrentStep || status.currentStep,
              mongoDeploymentId: status.MongoDeploymentId || status.mongoDeploymentId || mongoDeploymentId
            };
            
            // Update MongoDB deployment status if we have the ID
            const deploymentId = normalizedStatus.mongoDeploymentId || mongoDeploymentId;
            if (deploymentId && isMounted && !pollingStopped) {
              try {
                // Map unified deployment status to MongoDB status
                let mongoStatus = 'processing';
                if (normalizedStatus.status === 'Completed' || normalizedStatus.success || 
                    (typeof rawStatus === 'number' && rawStatus >= 6)) {
                  mongoStatus = 'completed';
                } else if (normalizedStatus.status === 'Failed' || 
                          (typeof rawStatus === 'number' && rawStatus < 0)) {
                  mongoStatus = 'failed';
                } else if (normalizedStatus.status === 'queued' || normalizedStatus.status === 'Queued') {
                  mongoStatus = 'queued';
                }
                
                await updateDeploymentStatus(deploymentId, mongoStatus);
                
                // Refresh MongoDB deployment data
                const updatedMongoData = await getDeploymentById(deploymentId);
                if (isMounted) {
                  setMongoDeployment(updatedMongoData);
                }
              } catch (updateError) {
                console.warn('Failed to update MongoDB deployment status:', updateError);
              }
            }
            
            if (isMounted) {
              setDeployment(normalizedStatus);
              setLoading(false);
              if (onStatusUpdate) {
                onStatusUpdate(normalizedStatus);
              }
            }
          },
          3000
        );
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch deployment status');
          console.error(err);
          setLoading(false);
        }
      }
    };

    startPolling();

    // Cleanup function to stop polling if component unmounts
    return () => {
      isMounted = false;
      pollingStopped = true;
    };
  }, [projectId, mongoDeploymentId, onStatusUpdate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle size={32} className="text-success" />;
      case 'Failed':
        return <FaTimesCircle size={32} className="text-danger" />;
      default:
        return <FaSpinner size={32} className="text-primary spinner-border" />;
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
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" role="status" variant="primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <Alert variant="info">
        No deployment in progress. Click "Deploy" to start a new deployment.
      </Alert>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {deployment && (
        <>
          <div className="text-center mb-4">
            {getStatusIcon(deployment?.status === 'Completed' || deployment?.success ? 'Completed' : deployment?.status)}
            <h4 className="mt-3 mb-2">
              {deployment?.status === 'Completed' || deployment?.success
                ? 'Deployment Successful!'
                : deployment?.status === 'Failed'
                ? 'Deployment Failed'
                : 'Deploying Your Project'}
            </h4>
            <p className="text-muted">{deployment?.message || 'Please wait...'}</p>
          </div>

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
            <Alert variant="info" className="mb-3">
              <strong>Current Step:</strong> {deployment.currentStep}
            </Alert>
          )}

          {(deployment.status === 'Completed' || deployment.success || mongoDeployment) && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Deployment Information</h5>
                
                {/* MongoDB Deployment Info */}
                {mongoDeployment && (
                  <>
                    {mongoDeployment.repoId && (
                      <div className="mb-3">
                        <strong>Repository ID:</strong>{' '}
                        <span className="text-muted">{mongoDeployment.repoId}</span>
                      </div>
                    )}
                    {mongoDeployment.serviceId && (
                      <div className="mb-3">
                        <strong>Service ID:</strong>{' '}
                        <span className="text-muted">{mongoDeployment.serviceId}</span>
                      </div>
                    )}
                    {mongoDeployment.status && (
                      <div className="mb-3">
                        <strong>MongoDB Status:</strong>{' '}
                        <span className={`badge bg-${mongoDeployment.status === 'completed' ? 'success' : mongoDeployment.status === 'failed' ? 'danger' : 'warning'}`}>
                          {mongoDeployment.status}
                        </span>
                      </div>
                    )}
                    {mongoDeployment.deployedAt && (
                      <div className="mb-3">
                        <strong>Deployed At:</strong>{' '}
                        <span className="text-muted">
                          {new Date(mongoDeployment.deployedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {(mongoDeployment.id || mongoDeployment._id || mongoDeployment.Id) && (
                      <div className="mb-3">
                        <strong>Deployment ID:</strong>{' '}
                        <span className="text-muted font-monospace small">
                          {mongoDeployment.id || mongoDeployment._id || mongoDeployment.Id}
                        </span>
                      </div>
                    )}
                    <hr className="my-3" />
                  </>
                )}

                {/* Unified Deployment Info */}
                {deployment.githubRepoUrl && (
                  <div className="mb-3">
                    <strong>GitHub Repository:</strong>{' '}
                    <a href={deployment.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                      {deployment.githubRepoUrl}
                    </a>
                  </div>
                )}

                {(deployment.deploymentUrl || mongoDeployment?.serviceUrl) && (
                  <div className="mb-3">
                    <strong>Deployment URL:</strong>{' '}
                    <a 
                      href={deployment.deploymentUrl || mongoDeployment.serviceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-success fw-bold"
                    >
                      {deployment.deploymentUrl || mongoDeployment.serviceUrl}
                    </a>
                  </div>
                )}

                {deployment.configFileUrl && (
                  <div className="mb-3">
                    <strong>Config File URL:</strong>{' '}
                    <a href={deployment.configFileUrl} target="_blank" rel="noopener noreferrer" className="text-info">
                      {deployment.configFileUrl}
                    </a>
                  </div>
                )}

                {deployment.projectId && (
                  <div className="mb-0">
                    <strong>Project ID:</strong> <span className="text-muted">{deployment.projectId}</span>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {deployment.githubRepoUrl && deployment.status !== 'Completed' && !deployment.success && (
            <Card className="mb-3">
              <Card.Body>
                <strong>GitHub Repository:</strong>{' '}
                <a href={deployment.githubRepoUrl} target="_blank" rel="noopener noreferrer">
                  {deployment.githubRepoUrl}
                </a>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DeploymentMonitorEmbedded;

