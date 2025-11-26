import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '../Components/NavigationBar';
import { startGitHubLogin, startNetlifyLogin, getUserTokens } from '../api/auth';
import { getUserProjects } from '../api/deployments';
import { FaGithub, FaNetworkWired, FaCloudflare, FaRocket } from 'react-icons/fa';
import { SiNetlify, SiVercel } from 'react-icons/si';
import '../css/Responsive.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    github: false,
    netlify: false,
    vercel: false,
    cloudflare: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);

        const tokens = await getUserTokens();
        setConnectedPlatforms({
          github: !!tokens.hasGitHubToken,
          netlify: !!tokens.hasNetlifyToken,
          vercel: !!tokens.hasVercelToken,
          cloudflare: !!tokens.hasCloudflareToken,
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
  ];

  if (loading) {
    return (
      <div className="min-vh-100" style={{ backgroundColor: '#1a0033' }}>
        <NavigationBar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#1a0033' }}>
      <NavigationBar />

      <div className="container-fluid py-4" style={{ marginLeft: '5rem', paddingRight: '2rem' }}>
        <div className="row mb-5">
          <div className="col-12">
            <h1 className="display-5 fw-bold mb-2" style={{ color: '#ffffff' }}>Welcome back, {user?.name || 'Developer'}</h1>
            <p style={{ color: '#b8a3d9' }}>Manage your deployments and connect platforms</p>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h4 mb-0" style={{ color: '#ffffff' }}>Quick Actions</h2>
            </div>
            <div className="row g-4">
              <div className="col-sm-12 col-md-6 col-xl-4">
                <div
                  className="card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={() => navigate('/new-project')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body text-center py-5">
                    <FaRocket size={48} style={{ color: '#b89dff' }} className="mb-3" />
                    <h5 className="card-title" style={{ color: '#ffffff' }}>New Deployment</h5>
                    <p className="card-text small" style={{ color: '#b8a3d9' }}>Deploy a new project quickly</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-6 col-xl-4">
                <div
                  className="card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={() => navigate('/projects')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body text-center py-5">
                    <FaNetworkWired size={48} style={{ color: '#b89dff' }} className="mb-3" />
                    <h5 className="card-title" style={{ color: '#ffffff' }}>View Projects</h5>
                    <p className="card-text small" style={{ color: '#b8a3d9' }}>Manage your {projects.length} projects</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-6 col-xl-4">
                <div
                  className="card border-0 shadow-sm h-100 cursor-pointer"
                  onClick={() => navigate('/deployments')}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body text-center py-5">
                    <div className="spinner-border mb-3" role="status" style={{ width: '48px', height: '48px', color: '#b89dff' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="card-title" style={{ color: '#ffffff' }}>Monitor Deployments</h5>
                    <p className="card-text small" style={{ color: '#b8a3d9' }}>Track deployment status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h4 mb-0" style={{ color: '#ffffff' }}>Connected Platforms</h2>
              <small style={{ color: '#b8a3d9' }}>Connect platforms to enable deployments</small>
            </div>
            <div className="row g-4">
              {platformCards.map((platform) => (
                <div key={platform.key} className="col-sm-12 col-md-6 col-xl-4">
                  <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5' }}>
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <platform.icon size={32} style={{ color: platform.color }} />
                        {connectedPlatforms[platform.key] ? (
                          <span className="badge bg-success">Connected</span>
                        ) : (
                          <span className="badge bg-secondary">Not Connected</span>
                        )}
                      </div>
                      <h5 className="card-title" style={{ color: '#ffffff' }}>{platform.name}</h5>
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
              <h2 className="h4 mb-4" style={{ color: '#ffffff' }}>Recent Projects</h2>
              <div className="list-group">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.projectId}
                    className="list-group-item list-group-item-action"
                    onClick={() => navigate(`/project/${project.projectId}`)}
                    style={{ cursor: 'pointer', backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5', marginBottom: '0.5rem' }}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1" style={{ color: '#ffffff' }}>{project.projectName}</h6>
                        <p className="mb-1 small" style={{ color: '#b8a3d9' }}>{project.description}</p>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${project.status === 'Completed' ? 'bg-success' : project.status === 'Failed' ? 'bg-danger' : 'bg-warning'}`}>
                          {project.status}
                        </span>
                        <div className="small mt-1" style={{ color: '#b8a3d9' }}>{project.platform}</div>
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
