import React, { useState, useEffect } from "react";
import "../css/Projects.css";
import { NavigationBar } from "../Components/NavigationBar";
import { useNavigate } from "react-router-dom";
import { getAllDeployments } from "../api/deployments";

function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  
  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      const data = await getAllDeployments(userId);
      console.log('Deployments data:', data);
      // Ensure data is an array
      setDeployments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
      setError(err.message || 'Failed to load deployments');
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return 'bg-success';
    if (statusLower === 'failed') return 'bg-danger';
    if (statusLower === 'queued') return 'bg-info';
    if (statusLower === 'processing') return 'bg-warning';
    return 'bg-secondary';
  };

  const getDeploymentId = (deployment) => {
    return deployment.id || deployment._id || deployment.Id;
  };

  return (
    <div className="projects-page">
      <NavigationBar />

      <div className="projects-main">
        <div className="header-row">
          <h2>Your Deployments</h2>
        </div>

        <div className="projects-grid">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <p style={{ color: '#ff6b6b' }}>{error}</p>
              <button 
                className="new-project-btn" 
                onClick={fetchDeployments}
                style={{ marginTop: '1rem' }}
              >
                Retry
              </button>
            </div>
          ) : deployments.length === 0 ? (
            <p>No deployments yet.</p>
          ) : (
            deployments.map((deployment) => {
              const deploymentId = getDeploymentId(deployment);
              const repoName = deployment.repoId ? deployment.repoId.split('/').pop() : 'Unknown Repository';
              return (
                <div
                  className="project-card"
                  key={deploymentId}
                  onClick={() => navigate(`/deployment-detail/${deploymentId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="project-title">
                    {repoName}
                  </div>
                  <div className="project-desc">
                    {deployment.repoId || 'No repository'}
                  </div>
                  <div className="project-info-row">
                    <span className={`badge ${getStatusBadge(deployment.status)}`}>
                      {deployment.status ? deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1) : 'Unknown'}
                    </span>
                    <span className="badge bg-info">
                      {deployment.deployedAt 
                        ? new Date(deployment.deployedAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  {deployment.serviceUrl && (
                    <div className="project-info-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: '#d1caf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {deployment.serviceUrl}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Deployments;

