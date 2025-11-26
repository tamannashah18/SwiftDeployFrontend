import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { SiNetlify, SiVercel, SiCloudflare } from 'react-icons/si';
import { FaGithub, FaCheckCircle } from 'react-icons/fa';
import { analyzeAndSuggest, deployToUnifiedPlatform } from '../api/deployments';
import { getUserTokens, savePlatformToken, startNetlifyLogin } from '../api/auth';

const DeploymentModal = ({ show, onHide, project }) => {
  const [step, setStep] = useState('analyze');
  const [platforms, setPlatforms] = useState([]);
  const [recommendedPlatform, setRecommendedPlatform] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [tokens, setTokens] = useState({});
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedTech, setDetectedTech] = useState({
    framework: '',
    buildTool: '',
    packageManager: '',
    technologies: []
  });

  const platformConfig = {
    netlify: { name: 'Netlify', icon: SiNetlify, color: '#00C7B7', requiresOAuth: true },
    vercel: { name: 'Vercel', icon: SiVercel, color: '#000', requiresOAuth: false },
    'github-pages': { name: 'GitHub Pages', icon: FaGithub, color: '#333', requiresOAuth: false },
    cloudflare: { name: 'Cloudflare Pages', icon: SiCloudflare, color: '#F38020', requiresOAuth: false },
  };

  useEffect(() => {
    if (show) {
      fetchTokens();
      analyzeProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const fetchTokens = async () => {
    try {
      const tokenData = await getUserTokens();
      setTokens({
        netlify: tokenData.hasNetlifyToken,
        vercel: tokenData.hasVercelToken,
        'github-pages': tokenData.hasGitHubToken,
        cloudflare: tokenData.hasCloudflareToken,
      });
    } catch (err) {
      console.error('Error fetching tokens:', err);
    }
  };

  const analyzeProject = async () => {
    if (!project?.repoId) {
      setError('GitHub repository information not found');
      return;
    }

    try {
      setLoading(true);
      const result = await analyzeAndSuggest(project._id);

      if (result.analysis) {
        setDetectedTech({
          framework: result.analysis.detectedTechnologies?.framework || 'Not detected',
          buildTool: result.analysis.detectedTechnologies?.buildTool || 'Not detected',
          packageManager: result.analysis.detectedTechnologies?.packageManager || 'Not detected',
          technologies: result.analysis.detectedTechnologies?.technologies || []
        });

        const recommended = result.analysis.recommendedPlatform?.platform?.toLowerCase();
        if (recommended && platforms.some(p => p.platform === recommended)) {
          setRecommendedPlatform(recommended);
        } else {
          setRecommendedPlatform('vercel');
        }

        setStep('select');
      }
    } catch (err) {
      console.error('Error analyzing project:', err);
      setError('Using default platforms.');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = (platformObj) => {
    const platformName = platformObj.platform.toLowerCase();
    setSelectedPlatform(platformName);
    const config = platformConfig[platformName];

    if (config?.requiresOAuth && platformName === 'netlify') {
      if (!tokens[platformName]) {
        setStep('oauth');
        return;
      }
    } else {
      if (!tokens[platformName]) {
        setStep('token');
        return;
      }
    }

    setStep('confirm');
  };

  const handleOAuthLogin = () => {
    if (selectedPlatform === 'netlify') {
      const projectId = project._id || project.id;
      if (projectId) {
        localStorage.setItem('netlify_oauth_return_project', projectId);
      }
      startNetlifyLogin();
    }
  };

  const handleTokenSubmit = async () => {
    if (!tokenInput.trim()) {
      setError('Please enter a token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await savePlatformToken(selectedPlatform, tokenInput);
      setTokens({ ...tokens, [selectedPlatform]: tokenInput });
      setTokenInput('');
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Project object:', project);
      console.log('Selected platform:', selectedPlatform);
      console.log('Tokens:', tokens);

      if (!project) {
        throw new Error('Project data is missing');
      }

      let owner, repo;

      if (project.repoId) {
        [owner, repo] = project.repoId.split('/');
      } else if (project.githubRepoUrl) {
        const match = project.githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          owner = match[1];
          repo = match[2].replace('.git', '');
        }
      }

      if (!owner || !repo) {
        throw new Error('Cannot extract repository information from project');
      }

      const deploymentData = {
        projectId: project._id || project.id,
        platform: selectedPlatform,
        owner: owner.trim(),
        repo: repo.trim(),
        repoName: repo.trim(),
        branch: project.branch || 'main',
        config: project.config || {}
      };

      console.log('Deployment data:', deploymentData);

      await deployToUnifiedPlatform(deploymentData);

      onHide();
      window.location.reload();
    } catch (err) {
      console.error('Deployment error:', err);
      setError(err.message || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('analyze');
    setSelectedPlatform(null);
    setTokenInput('');
    setError('');
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      contentClassName="modal-card"
    >
      <Modal.Header closeButton style={{ 
        backgroundColor: '#3a1f6b', 
        borderBottom: '1px solid #6c3fb5',
        color: '#ffffff'
      }}>
        <Modal.Title>Deploy Project</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ 
        backgroundColor: '#3a1f6b', 
        color: '#ffffff',
        padding: '1.5rem 2rem'
      }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {step === 'analyze' && (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#b89dff' }} />
            <p className="mt-3" style={{ color: '#b8a3d9' }}>Analyzing project and recommending platforms...</p>
          </div>
        )}

        {step === 'select' && (
          <div>
            <div className="mb-4">
              <h5 className="mb-3" style={{ color: '#ffffff', fontWeight: '600' }}>
                <FaCheckCircle style={{ color: '#10b981', marginRight: '8px' }} />
                Detected Technologies
              </h5>
              <Card style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #6c3fb5',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '100%',
                margin: '0 auto',
                backdropFilter: 'blur(8px)'
              }}>
                <Card.Body className="p-4" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {detectedTech.technologies.map((tech, index) => (
                      <Badge
                        key={index}
                        style={{
                          backgroundColor: '#6c3fb5',
                          color: '#ffffff',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '6px'
                        }}
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid #6c3fb5' }}>
                    <div className="row g-3" style={{ color: '#e0d6ff', fontSize: '14px' }}>
                      <div className="col-md-4">
                        <div style={{ color: '#b89dff', fontWeight: '600', marginBottom: '4px' }}>
                          Framework
                        </div>
                        <div>{detectedTech.framework}</div>
                      </div>
                      <div className="col-md-4">
                        <div style={{ color: '#b89dff', fontWeight: '600', marginBottom: '4px' }}>
                          Build Tool
                        </div>
                        <div>{detectedTech.buildTool}</div>
                      </div>
                      <div className="col-md-4">
                        <div style={{ color: '#b89dff', fontWeight: '600', marginBottom: '4px' }}>
                          Package Manager
                        </div>
                        <div>{detectedTech.packageManager}</div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <h5 className="mb-3" style={{ color: '#ffffff' }}>Select Deployment Platform</h5>

            <div className="platforms-grid">
              {platforms.map((platform) => {
                  const platformId = platform.platform.toLowerCase();
                  const config = platformConfig[platformId];
                  const Icon = config?.icon || FaGithub;
                  const isRecommended = platform.isRecommended;

                  return (
                    <Card
                      key={platformId}
                      className="platform-card"
                      onClick={() => handlePlatformSelect(platform)}
                      style={{
                        backgroundColor: '#3a1f6b',
                        border: isRecommended ? '2px solid #b89dff' : '1px solid #6c3fb5',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <Card.Body className="d-flex flex-column h-100">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <Icon size={24} style={{ color: config?.color || '#ffffff' }} />
                            <span className="fw-bold" style={{ color: '#ffffff' }}>
                              {platformId === 'github-pages' ? 'GitHub Pages' : platformId.charAt(0).toUpperCase() + platformId.slice(1)}
                            </span>
                          </div>
                          {isRecommended && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                              <FaCheckCircle /> Recommended
                            </Badge>
                          )}
                        </div>
                        
                        <p className="mb-3" style={{ color: '#e0d6ff', flex: 1 }}>
                          {platform.reason || `Deploy to ${platformId === 'github-pages' ? 'GitHub Pages' : platformId}`}
                        </p>
                        
                        <div className="mt-auto">
                          <div className="d-flex flex-wrap gap-1 mb-2">
                            {platform.features?.map((feature, i) => (
                              <Badge key={i} bg="info" className="me-1 mb-1" style={{ color: '#ffffff' }}>
                                {feature}
                              </Badge>
                            )) || (
                              <Badge bg="secondary" className="me-1 mb-1">
                                {platformId === 'github-pages' ? 'Static Sites' : 'Full Stack'}
                              </Badge>
                            )}
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small style={{ color: tokens[platformId] ? '#10b981' : '#ff6b6b' }}>
                              {tokens[platformId] ? 'Connected' : 'Not connected'}
                            </small>
                            {platform.score > 0 && (
                              <Badge bg="dark" style={{ color: '#ffffff' }}>
                                Score: {platform.score}/100
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
            </div>
            <style jsx>{`
              .platforms-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.25rem;
                width: 100%;
                margin: 0;
                padding: 0.5rem 0;
              }
              
              .platform-card {
                height: 100%;
                display: flex;
                flex-direction: column;
                transition: transform 0.2s, box-shadow 0.2s;
                word-break: break-word;
                overflow: hidden;
              }
              
              .platform-card .card-body {
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                height: 100%;
              }
              
              .platform-card .card-text {
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                margin-bottom: 1rem;
                flex-grow: 1;
              }
              
              .platform-card .features {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1rem;
              }
              
              .platform-card .badge {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
                max-width: 100%;
              }
              
              @media (max-width: 768px) {
                .platforms-grid {
                  grid-template-columns: 1fr;
                }
              }
            `}</style>
          </div>
        )}

        {step === 'oauth' && (
          <div className="text-center py-4">
            <h5 className="mb-4" style={{ color: '#ffffff' }}>
              Connect to {platformConfig[selectedPlatform]?.name}
            </h5>
            <p style={{ color: '#ffffff' }}>
              You need to authorize {platformConfig[selectedPlatform]?.name} to deploy your project.
            </p>
            <Button
              onClick={handleOAuthLogin}
              style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5' }}
              className="mt-3"
            >
              Connect via OAuth
            </Button>
          </div>
        )}

        {step === 'token' && (
          <div className="py-4">
            <h5 className="mb-4" style={{ color: '#ffffff' }}>
              Enter {platformConfig[selectedPlatform]?.name} Token
            </h5>
            <p style={{ color: '#ffffff' }}>
              Please provide your API token for {platformConfig[selectedPlatform]?.name}
            </p>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#b89dff' }}>API Token</Form.Label>
              <Form.Control
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter your API token"
                style={{
                  backgroundColor: '#2d1b4e',
                  border: '1px solid #6c3fb5',
                  color: '#ffffff'
                }}
              />
            </Form.Group>
            <Button
              onClick={handleTokenSubmit}
              disabled={loading}
              style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5' }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Token'}
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="py-4">
            <h5 className="mb-4 text-center" style={{ color: '#ffffff', fontWeight: '600', fontSize: '24px' }}>
              Ready to Deploy
            </h5>
            <p className="text-center mb-4" style={{ color: '#b8a3d9' }}>
              Review your deployment configuration
            </p>
            <Card style={{
              backgroundColor: '#2d1b4e',
              border: '2px solid #6c3fb5',
              borderRadius: '12px',
              maxWidth: '550px',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <Card.Body className="p-4">
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <FaGithub style={{ color: '#b89dff', marginRight: '8px', fontSize: '18px' }} />
                    <strong style={{ color: '#b89dff', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</strong>
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500',
                    paddingLeft: '26px'
                  }}>
                    {project.projectName}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    {platformConfig[selectedPlatform]?.icon && React.createElement(platformConfig[selectedPlatform].icon, {
                      style: { color: platformConfig[selectedPlatform]?.color || '#b89dff', marginRight: '8px', fontSize: '18px' }
                    })}
                    <strong style={{ color: '#b89dff', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform</strong>
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500',
                    paddingLeft: '26px'
                  }}>
                    {platformConfig[selectedPlatform]?.name}
                  </div>
                </div>
                <div className="mb-0">
                  <div className="d-flex align-items-center mb-2">
                    <FaGithub style={{ color: '#b89dff', marginRight: '8px', fontSize: '18px' }} />
                    <strong style={{ color: '#b89dff', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repository</strong>
                  </div>
                  <div style={{
                    color: '#e0d6ff',
                    fontSize: '14px',
                    wordBreak: 'break-all',
                    paddingLeft: '26px',
                    fontFamily: 'monospace',
                    backgroundColor: '#1a0033',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginLeft: '26px'
                  }}>
                    {project.githubRepoUrl}
                  </div>
                </div>
              </Card.Body>
            </Card>
            <div className="d-flex gap-3 mt-4 justify-content-center">
              <Button
                onClick={handleDeploy}
                disabled={loading}
                size="lg"
                style={{
                  backgroundColor: '#6c3fb5',
                  borderColor: '#6c3fb5',
                  minWidth: '150px',
                  fontWeight: '500'
                }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Deploy Now'}
              </Button>
              <Button
                variant="outline-light"
                onClick={() => setStep('select')}
                disabled={loading}
                size="lg"
                style={{
                  minWidth: '150px',
                  fontWeight: '500'
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default DeploymentModal;
