import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner } from 'react-bootstrap';
import { getDeploymentStatus, pollDeployment, getDeploymentById, updateDeploymentStatus } from '../api/deployments';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../Contexts/AuthContext';
import { useRealTimeDeployment } from '../hooks/useRealTimeDeployment';

const DeploymentMonitorEmbedded = ({ projectId, mongoDeploymentId: mongoDeploymentIdProp, onStatusUpdate }) => {
  const [deployment, setDeployment] = useState(null);
  const [mongoDeployment, setMongoDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const mongoDeploymentId = mongoDeploymentIdProp || deployment?.mongoDeploymentId || mongoDeployment?.id || mongoDeployment?.Id;

  // Real-time status updates via SignalR
  useRealTimeDeployment(
    projectId,
    mongoDeploymentId,
    userId,
    React.useCallback((status) => {
      console.log('[SignalR Callback] Received status update in Embedded Monitor:', status);
      const rawStatus = status.status;
      const isSuccess = status.success === true || status.Success === true || rawStatus === 'Completed';
      
      const normalizedStatus = {
        ...status,
        status: rawStatus,
        message: status.message || status.Message || (isSuccess ? 'Deployment completed successfully!' : 'Processing...'),
        githubRepoUrl: status.githubRepoUrl || status.GitHubRepoUrl,
        deploymentUrl: status.deploymentUrl || status.DeploymentUrl,
        configFileUrl: status.configFileUrl || status.ConfigFileUrl,
        projectId: status.projectId || status.ProjectId || projectId,
        success: isSuccess,
        progress: status.progress || status.Progress || (isSuccess ? 100 : 0),
        currentStep: status.currentStep || status.CurrentStep,
        mongoDeploymentId: status.mongoDeploymentId || status.MongoDeploymentId || status.deploymentId || mongoDeploymentId
      };

      setDeployment(normalizedStatus);
      setLoading(false);

      if (onStatusUpdate) {
        onStatusUpdate(normalizedStatus);
      }

      // Refresh MongoDB deployment data
      const depId = normalizedStatus.mongoDeploymentId;
      if (depId) {
        getDeploymentById(depId).then((updatedData) => {
          setMongoDeployment(updatedData);
        }).catch(console.warn);
      }
    }, [projectId, mongoDeploymentId, onStatusUpdate])
  );

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let pollingStopped = false;
    let pollController = null;

    const startPolling = async () => {
      try {
        setLoading(true);
        
        // Fetch MongoDB deployment data if ID is available
        const currentMongoDeploymentId = mongoDeploymentIdProp || mongoDeploymentId;
        if (currentMongoDeploymentId) {
          getDeploymentById(currentMongoDeploymentId).then((mongoData) => {
            if (isMounted) {
              setMongoDeployment(mongoData);
            }
          }).catch((err) => {
            console.warn('Failed to fetch MongoDB deployment:', err);
          });
        }

        // Check initial status before starting polling
        try {
          const initialStatus = await getDeploymentStatus(projectId);
          if (!isMounted) return;

          const rawStatus = initialStatus.Status || initialStatus.status;
          const isSuccess = initialStatus.success === true || initialStatus.Success === true;
          const isCompleted = 
            rawStatus === 'Completed' || 
            rawStatus === 'completed' || 
            rawStatus === 'COMPLETED' ||
            (typeof rawStatus === 'number' && rawStatus >= 6) ||
            isSuccess;
          
          let normalizedStatusValue = rawStatus;
          if (typeof rawStatus === 'number') {
            const statusNames = [
              'Uploading',
              'Processing',
              'CreatingRepo',
              'PushingCode',
              'GeneratingConfig',
              'Deploying',
              'Completed',
              'Failed'
            ];
            if (rawStatus >= 0 && rawStatus < statusNames.length) {
              normalizedStatusValue = statusNames[rawStatus];
            } else if (rawStatus < 0) {
              normalizedStatusValue = 'Failed';
            } else {
              normalizedStatusValue = 'Completed';
            }
          } else if (isCompleted) {
            normalizedStatusValue = 'Completed';
          }

          const normalizedStatus = {
            ...initialStatus,
            status: normalizedStatusValue || 'Processing',
            message: initialStatus.Message || initialStatus.message || (isCompleted ? 'Deployment completed' : 'Processing deployment...'),
            githubRepoUrl: initialStatus.GitHubRepoUrl || initialStatus.githubRepoUrl,
            deploymentUrl: initialStatus.DeploymentUrl || initialStatus.deploymentUrl,
            configFileUrl: initialStatus.ConfigFileUrl || initialStatus.configFileUrl,
            projectId: initialStatus.ProjectId || initialStatus.projectId || projectId,
            success: isSuccess,
            progress: initialStatus.Progress || initialStatus.progress || (isCompleted ? 100 : 0),
            currentStep: initialStatus.CurrentStep || initialStatus.currentStep || (isCompleted ? 'Completed' : 'Processing'),
            mongoDeploymentId: initialStatus.MongoDeploymentId || initialStatus.mongoDeploymentId || currentMongoDeploymentId
          };

          setDeployment(normalizedStatus);
          setLoading(false);

          if (onStatusUpdate) {
            onStatusUpdate(normalizedStatus);
          }

          if (isCompleted || normalizedStatus.status === 'Failed') {
            pollingStopped = true;
            return;
          }
        } catch (err) {
          console.warn('Failed to get initial status:', err);
        }

        if (pollingStopped || !isMounted) return;

        // Start polling
        const { promise, stop } = await pollDeployment(
          projectId,
          async (statusData) => {
            if (!isMounted || pollingStopped) return;

            // Normalize response format
            const rawStatus = statusData.Status || statusData.status;
            let normalizedStatusValue = rawStatus;
            
            if (typeof rawStatus === 'number') {
              const statusNames = [
                'Uploading',
                'Processing',
                'CreatingRepo',
                'PushingCode',
                'GeneratingConfig',
                'Deploying',
                'Completed',
                'Failed'
              ];
              if (rawStatus >= 0 && rawStatus < statusNames.length) {
                normalizedStatusValue = statusNames[rawStatus];
              } else if (rawStatus < 0) {
                normalizedStatusValue = 'Failed';
              } else {
                normalizedStatusValue = 'Completed';
              }
            }
            
            const isSuccess = statusData.success === true || statusData.Success === true || 
                            (statusData.success !== false && statusData.Success !== false && normalizedStatusValue === 'Completed');
            
            const isCompleted = normalizedStatusValue === 'Completed' || isSuccess;
            const isFailed = normalizedStatusValue === 'Failed';
            const currentStep = statusData.currentStep || statusData.CurrentStep;
            const isCompletedByStep = currentStep === 'Completed' || currentStep === 'completed';
            
            const normalizedStatus = {
              ...statusData,
              status: normalizedStatusValue,
              message: statusData.Message || statusData.message || 'Processing...',
              githubRepoUrl: statusData.GitHubRepoUrl || statusData.githubRepoUrl || statusData.gitHubRepoUrl,
              deploymentUrl: statusData.DeploymentUrl || statusData.deploymentUrl,
              configFileUrl: statusData.ConfigFileUrl || statusData.configFileUrl,
              projectId: statusData.ProjectId || statusData.projectId || projectId,
              success: isSuccess,
              progress: statusData.Progress || statusData.progress || (isCompleted ? 100 : 0),
              currentStep: statusData.CurrentStep || statusData.currentStep || 'Processing',
              mongoDeploymentId: statusData.MongoDeploymentId || statusData.mongoDeploymentId || currentMongoDeploymentId
            };
            
            // Update MongoDB deployment status if we have the ID (only if not already completed)
            const deploymentId = normalizedStatus.mongoDeploymentId || currentMongoDeploymentId;
            if (deploymentId && isMounted && !pollingStopped && (isCompleted || isFailed || isCompletedByStep)) {
              try {
                let mongoStatus = 'processing';
                if (normalizedStatus.status === 'Completed' || normalizedStatus.success || isCompletedByStep) {
                  mongoStatus = 'completed';
                } else if (normalizedStatus.status === 'Failed') {
                  mongoStatus = 'failed';
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
            }
            
            if (onStatusUpdate) {
              onStatusUpdate(normalizedStatus);
            }
            
            if ((isCompleted || isFailed || isCompletedByStep) && isMounted) {
              pollingStopped = true;
              if (stop) {
                stop();
              }
            }
          },
          3000
        );
        
        pollController = { stop };
        
        if (promise && typeof promise.catch === 'function') {
          promise.catch(err => {
            if (isMounted && !pollingStopped) {
              setError('Failed to fetch deployment status');
              console.error('Polling error:', err);
              setLoading(false);
            }
          });
        }
        
      } catch (err) {
        if (isMounted) {
          setError('Failed to start deployment status polling');
          console.error(err);
          setLoading(false);
        }
      }
    };

    startPolling();

    return () => {
      isMounted = false;
      pollingStopped = true;
      if (pollController && pollController.stop) {
        pollController.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, mongoDeploymentIdProp]);


  const getStatusIcon = (deploymentStatus) => {
    switch (deploymentStatus) {
      case 'Completed':
        return <FaCheckCircle size={32} className="text-success" />;
      case 'Failed':
        return <FaTimesCircle size={32} className="text-danger" />;
      default:
        return <FaSpinner size={32} className="text-primary spinner-border" />;
    }
  };

  const getStatusColor = (deploymentStatus) => {
    switch (deploymentStatus) {
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
    // If deployment is successful/completed, all steps should show as completed
    if (deployment.success || deployment.status === 'Completed') {
      return deploymentSteps.length; // Return length so all steps show as completed (no spinner)
    }
    if (deployment.status === 'Failed') {
      // For failed deployments, show up to the step where it failed
      const stepIndex = deploymentSteps.indexOf(deployment.currentStep);
      return stepIndex >= 0 ? stepIndex : deploymentSteps.length - 2;
    }
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
            <Card className="mb-4 ">
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