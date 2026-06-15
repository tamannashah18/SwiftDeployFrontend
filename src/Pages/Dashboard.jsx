import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '../Components/NavigationBar';
import { startGitHubLogin, startNetlifyLogin, getUserTokens, disconnectPlatform } from '../api/auth';
import { getConnectedProviders } from '../api/databaseDeployments';
import { getUserProjects } from '../api/deployments';
import { FaGithub, FaNetworkWired, FaCloudflare, FaRocket, FaTachometerAlt, FaAws, FaGoogle, FaMicrosoft, FaServer, FaTrain, FaDatabase } from 'react-icons/fa';
import { SiNetlify, SiVercel } from 'react-icons/si';
import '../css/Responsive.css';
import '../css/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    github: false,
    netlify: false,
    vercel: false,
    cloudflare: false,
    aws: false,
    gcp: false,
    azure: false,
    render: false,
    railway: false,
    neon: false,
  });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);

        const tokens = await getUserTokens();
        console.log('Fetched tokens:', tokens);
        const platformStates = {
          github: !!tokens.githubToken || !!tokens.github || !!tokens.hasGitHubToken || !!localStorage.getItem("github_access_token"),
          netlify: !!tokens.netlifyToken || !!tokens.netlify || !!tokens.hasNetlifyToken || !!localStorage.getItem("netlify_token"),
          vercel: !!tokens.vercelToken || !!tokens.vercel || !!tokens.hasVercelToken || !!localStorage.getItem("vercel_token"),
          cloudflare: !!tokens.cloudflareToken || !!tokens.cloudflare || !!tokens.hasCloudflareToken || !!localStorage.getItem("cloudflare_token"),
          aws: !!tokens.awsAccessKey || !!tokens.hasAwsAccessKey || !!localStorage.getItem("awsAccessKey_token"),
          gcp: !!tokens.gcpServiceAccount || !!tokens.hasGcpServiceAccount || !!localStorage.getItem("gcpServiceAccount_token"),
          azure: !!tokens.azurePublishProfile || !!tokens.hasAzurePublishProfile || !!localStorage.getItem("azurePublishProfile_token"),
          render: !!tokens.renderToken || !!tokens.hasRenderToken || !!localStorage.getItem("renderToken_token"),
          railway: !!tokens.railwayToken || !!tokens.hasRailwayToken || !!localStorage.getItem("railwayToken_token"),
          neon: false,
        };

        // Neon & Railway database tokens are stored via the /api/integrations endpoint separately
        try {
          const dbProviders = await getConnectedProviders();
          platformStates.neon = !!dbProviders.neonConnected;
          platformStates.railway = platformStates.railway || !!dbProviders.railwayConnected;
        } catch (e) {
          console.warn('Could not fetch database provider statuses:', e);
        }

        console.log('Platform states:', platformStates);
        setConnectedPlatforms(platformStates);

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

  // Check if user has GitHub account
  const hasGitHubAccount = () => {
    if (!user) return false;
    // Check if user has github_access_token in localStorage
    const hasGitHubToken = !!localStorage.getItem("github_access_token");
    // Check if user has GithubId (GitHub users have this)
    const hasGithubId = !!user.githubId;
    // Check if userType is GitHub
    const isGitHubUser = user.userType === 'GitHub' || user.UserType === 'GitHub';

    return hasGitHubToken || hasGithubId || isGitHubUser;
  };

  const handleConnectGitHub = () => {
    startGitHubLogin();
  };

  const handleConnectNetlify = () => {
    startNetlifyLogin();
  };

  const handleConnectProfile = () => {
    navigate('/profile');
  };

  const handleDisconnect = async (platformKey) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platformKey}?`)) {
      return;
    }

    setDisconnecting(platformKey);
    try {
      await disconnectPlatform(platformKey);
      setConnectedPlatforms(prev => ({
        ...prev,
        [platformKey]: false
      }));
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      alert('Failed to disconnect platform. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  };

  const platformCards = [
    { name: 'GitHub', icon: FaGithub, key: 'github', color: '#333', action: handleConnectGitHub },
    { name: 'Netlify', icon: SiNetlify, key: 'netlify', color: '#00C7B7', action: handleConnectNetlify },
    { name: 'Vercel', icon: SiVercel, key: 'vercel', color: '#ffffff', action: handleConnectProfile },
    { name: 'Cloudflare', icon: FaCloudflare, key: 'cloudflare', color: '#F38020', action: handleConnectProfile },
    { name: 'AWS', icon: FaAws, key: 'aws', color: '#FF9900', action: handleConnectProfile },
    { name: 'GCP', icon: FaGoogle, key: 'gcp', color: '#4285F4', action: handleConnectProfile },
    { name: 'Azure', icon: FaMicrosoft, key: 'azure', color: '#00A4EF', action: handleConnectProfile },
    { name: 'Render', icon: FaServer, key: 'render', color: '#46E3B7', action: handleConnectProfile },
    { name: 'Railway (MySQL)', icon: FaTrain, key: 'railway', color: '#ffffff', action: handleConnectProfile },
    { name: 'Neon (PostgreSQL)', icon: FaDatabase, key: 'neon', color: '#00e599', action: handleConnectProfile },
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
    <div className="min-vh-100 dashboard-page">
      <NavigationBar />

      <div className="dashboard-content container-fluid py-4">
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
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div
                  className="quick-action-card"
                  onClick={() => navigate('/new-project')}
                >
                  <div className="card-body">
                    <FaRocket className="mb-2" size={28} />
                    <h5 className="card-title">New Deployment</h5>
                    <p className="card-text">Deploy a new project quickly</p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div
                  className="quick-action-card"
                  onClick={() => navigate('/projects')}
                >
                  <div className="card-body">
                    <FaNetworkWired className="mb-2" size={28} />
                    <h5 className="card-title">View Projects</h5>
                    <p className="card-text">Manage your projects</p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div
                  className="quick-action-card"
                  onClick={() => navigate('/deployments')}
                >
                  <div className="card-body">
                    <FaTachometerAlt className="mb-2" size={28} />
                    <h5 className="card-title">Monitor Deployments</h5>
                    <p className="card-text">Track deployment status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasGitHubAccount() && (
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0" style={{ color: '#ffffff' }}>Connected Platforms</h2>
                <small style={{ color: '#b8a3d9' }}>Connect platforms to enable deployments</small>
              </div>
              <div className="row g-3">
                {platformCards.map((platform) => (
                  <div key={platform.key} className="col-12 col-sm-6 col-lg-3">
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
                          <button
                            className="btn btn-sm btn-outline-danger mt-3 w-100"
                            onClick={() => handleDisconnect(platform.key)}
                            disabled={disconnecting === platform.key}
                          >
                            {disconnecting === platform.key ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
