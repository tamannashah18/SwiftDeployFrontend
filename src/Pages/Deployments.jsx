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
    if (statusLower === 'completed' || statusLower === 'success') return 'bg-success';
    if (statusLower === 'failed' || statusLower === 'error') return 'bg-danger';
    if (statusLower === 'queued') return 'bg-info';
    if (statusLower === 'deploying' || statusLower === 'processing') return 'bg-warning';
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

  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredDeployments = deployments.filter(dep => {
    // Project name search
    const searchLower = searchQuery.toLowerCase();
    const repoNameMatch = !searchQuery || (dep.repoId && dep.repoId.toLowerCase().includes(searchLower));
    
    // Platform filter
    const platformMatch = !platformFilter || (dep.platform && dep.platform.toLowerCase() === platformFilter.toLowerCase());
    
    // Status filter
    const statusMatch = !statusFilter || (dep.status && dep.status.toLowerCase() === statusFilter.toLowerCase());
    
    // Date filter
    let dateMatch = true;
    if (startDate || endDate) {
      const depDate = dep.deployedAt ? new Date(dep.deployedAt).getTime() : 0;
      if (depDate) {
        if (startDate) {
          const start = new Date(startDate).getTime();
          if (depDate < start) dateMatch = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1); // include the whole end day
          if (depDate >= end.getTime()) dateMatch = false;
        }
      } else {
        dateMatch = false;
      }
    }

    return repoNameMatch && platformMatch && statusMatch && dateMatch;
  });

  return (
    <div className="projects-page">
      <NavigationBar />

      <div className="projects-main">
        <div className="header-row">
          <h2>Your Deployments</h2>
        </div>

        <div className="mb-4 d-flex flex-wrap gap-3 p-3" style={{ backgroundColor: '#2d1b4e', borderRadius: '8px', border: '1px solid #6c3fb5' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ color: '#b8a3d9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Project Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by repo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ backgroundColor: '#1a0033', color: '#fff', border: '1px solid #6c3fb5' }}
            />
          </div>
          
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ color: '#b8a3d9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Platform</label>
            <select 
              className="form-control" 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              style={{ backgroundColor: '#1a0033', color: '#fff', border: '1px solid #6c3fb5' }}
            >
              <option value="">All Platforms</option>
              <option value="vercel">Vercel</option>
              <option value="netlify">Netlify</option>
              <option value="cloudflare">Cloudflare</option>
              <option value="github">GitHub Pages</option>
              <option value="aws">AWS</option>
              <option value="gcp">GCP</option>
              <option value="azure">Azure</option>
              <option value="render">Render</option>
              <option value="railway">Railway</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ color: '#b8a3d9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status</label>
            <select 
              className="form-control" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundColor: '#1a0033', color: '#fff', border: '1px solid #6c3fb5' }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ flex: '1 1 130px' }}>
            <label style={{ color: '#b8a3d9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Start Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ backgroundColor: '#1a0033', color: '#fff', border: '1px solid #6c3fb5', colorScheme: 'dark' }}
            />
          </div>

          <div style={{ flex: '1 1 130px' }}>
            <label style={{ color: '#b8a3d9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>End Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ backgroundColor: '#1a0033', color: '#fff', border: '1px solid #6c3fb5', colorScheme: 'dark' }}
            />
          </div>
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
          ) : filteredDeployments.length === 0 ? (
            <p>No deployments match your search.</p>
          ) : (
            filteredDeployments.map((deployment) => {
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

