import React, { useState, useEffect } from "react";
import "../css/Projects.css";
import { NavigationBar } from "../Components/NavigationBar";
import { useNavigate } from "react-router-dom";
import { getAllDeployments } from "../api/deployments";
import { FaGithub, FaCloudflare, FaExternalLinkAlt } from 'react-icons/fa';
import { SiNetlify, SiVercel } from 'react-icons/si';

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

  const getPlatformInfo = (platform) => {
    if (!platform) return { name: 'Unknown', icon: null, color: '#6c757d' };
    
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'vercel':
        return { name: 'Vercel', icon: SiVercel, color: '#000000' };
      case 'netlify':
        return { name: 'Netlify', icon: SiNetlify, color: '#00C7B7' };
      case 'cloudflare':
        return { name: 'Cloudflare', icon: FaCloudflare, color: '#F38020' };
      case 'githubpages':
      case 'github':
        return { name: 'GitHub Pages', icon: FaGithub, color: '#333333' };
      default:
        return { name: platform.charAt(0).toUpperCase() + platform.slice(1), icon: null, color: '#6c757d' };
    }
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
              const platformInfo = getPlatformInfo(deployment.platform);
              const PlatformIcon = platformInfo.icon;
              
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
                  {deployment.platform && (
                    <div className="project-info-row" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {PlatformIcon && (
                        <PlatformIcon size={22} style={{ color: '#ffffff' }} />
                      )}
                      <span style={{ 
                        color: '#ffffff',
                        fontSize: '0.9rem'
                      }}>
                        {platformInfo.name}
                      </span>
                    </div>
                  )}
                  {deployment.serviceUrl && (
                    <div className="project-info-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <a 
                        href={deployment.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          color: '#d1caf6', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#b89dff'}
                        onMouseLeave={(e) => e.target.style.color = '#d1caf6'}
                      >
                        {deployment.serviceUrl}
                        <FaExternalLinkAlt size={12} />
                      </a>
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

