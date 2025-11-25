import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '../Components/NavigationBar';
import { startGitHubLogin, startNetlifyLogin, getUserTokens } from '../api/auth';
import { getUserProjects } from '../api/deployments';
import { FaGithub, FaNetworkWired, FaCloudflare, FaRocket } from 'react-icons/fa';
import { SiNetlify, SiVercel, SiRailway, SiRender } from 'react-icons/si';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    github: false,
    netlify: false,
    vercel: false,
    cloudflare: false,
    railway: false,
    render: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);

        const tokens = await getUserTokens();
        setConnectedPlatforms({
          github: !!tokens.githubToken,
          netlify: !!tokens.netlifyToken,
          vercel: !!tokens.vercelToken,
          cloudflare: !!tokens.cloudflareToken,
          railway: !!tokens.railwayToken,
          render: !!tokens.renderToken,
        });

        if (userData?.id) {
          const projectsData = await getUserProjects(userData.id);
          setProjects(projectsData.projects || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleConnectGitHub = () => {
    startGitHubLogin();
  };

  const handleConnectNetlify = () => {
    startNetlifyLogin();
  };

  const platformCards = [
    { name: 'GitHub', icon: FaGithub, key: 'github', color: '#333', action: handleConnectGitHub },
    { name: 'Netlify', icon: SiNetlify, key: 'netlify', color: '#00C7B7', action: handleConnectNetlify },
    { name: 'Vercel', icon: SiVercel, key: 'vercel', color: '#000' },
    { name: 'Cloudflare', icon: FaCloudflare, key: 'cloudflare', color: '#F38020' },
    { name: 'Railway', icon: SiRailway, key: 'railway', color: '#0B0D0E' },
    { name: 'Render', icon: SiRender, key: 'render', color: '#46E3B7' },
  ];

  if (loading) {
    return (
      <div className="min-vh-100 bg-light">
        <NavigationBar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
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
        <div className="row mb-5">
          <div className="col-12">
            <h1 className="display-5 fw-bold mb-2">Welcome back, {user?.name || 'Developer'}</h1>
            <p className="text-muted">Manage your deployments and connect platforms</p>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h4 mb-0">Quick Actions</h2>
            </div>
            <div className="row g-3">
              <div className="col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={() => navigate('/new-project')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body text-center py-5">
                    <FaRocket size={48} className="text-primary mb-3" />
                    <h5 className="card-title">New Deployment</h5>
                    <p className="card-text text-muted small">Deploy a new project quickly</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={() => navigate('/projects')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body text-center py-5">
                    <FaNetworkWired size={48} className="text-success mb-3" />
                    <h5 className="card-title">View Projects</h5>
                    <p className="card-text text-muted small">Manage your {projects.length} projects</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={() => navigate('/deployments')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body text-center py-5">
                    <div className="spinner-border text-info mb-3" role="status" style={{ width: '48px', height: '48px' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="card-title">Monitor Deployments</h5>
                    <p className="card-text text-muted small">Track deployment status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h4 mb-0">Connected Platforms</h2>
              <small className="text-muted">Connect platforms to enable deployments</small>
            </div>
            <div className="row g-4">
              {platformCards.map((platform) => (
                <div key={platform.key} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <platform.icon size={32} style={{ color: platform.color }} />
                        {connectedPlatforms[platform.key] ? (
                          <span className="badge bg-success">Connected</span>
                        ) : (
                          <span className="badge bg-secondary">Not Connected</span>
                        )}
                      </div>
                      <h5 className="card-title">{platform.name}</h5>
                      {!connectedPlatforms[platform.key] && platform.action && (
                        <button
                          className="btn btn-sm btn-outline-primary mt-3 w-100"
                          onClick={platform.action}
                        >
                          Connect {platform.name}
                        </button>
                      )}
                      {connectedPlatforms[platform.key] && (
                        <button className="btn btn-sm btn-outline-danger mt-3 w-100" disabled>
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="row mt-5">
            <div className="col-12">
              <h2 className="h4 mb-4">Recent Projects</h2>
              <div className="list-group">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.projectId}
                    className="list-group-item list-group-item-action"
                    onClick={() => navigate(`/project/${project.projectId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{project.projectName}</h6>
                        <p className="mb-1 text-muted small">{project.description}</p>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${project.status === 'Completed' ? 'bg-success' : project.status === 'Failed' ? 'bg-danger' : 'bg-warning'}`}>
                          {project.status}
                        </span>
                        <div className="text-muted small mt-1">{project.platform}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
