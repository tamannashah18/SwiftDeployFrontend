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
    if (!project.githubRepoUrl) {
      setError('GitHub repository URL not found');
      return;
    }

    setError('');

    try {
      const urlParts = project.githubRepoUrl.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1].replace('.git', '');
      const branch = project.branch || 'main';
      const token = tokens['github-pages'];

      const result = await analyzeAndSuggest(owner, repo, branch, token);

      setPlatforms(result.platforms || []);
      setRecommendedPlatform(result.recommendedPlatform);
      setStep('select');
    } catch (err) {
      setError(err.message || 'Failed to analyze project');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    const config = platformConfig[platform];

    if (config?.requiresOAuth && platform === 'netlify') {
      if (!tokens[platform]) {
        setStep('oauth');
        return;
      }
    } else {
      if (!tokens[platform]) {
        setStep('token');
        return;
      }
    }

    setStep('confirm');
  };

  const handleOAuthLogin = () => {
    if (selectedPlatform === 'netlify') {
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
      const urlParts = project.githubRepoUrl.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1].replace('.git', '');

      const deploymentData = {
        projectId: project.projectId,
        platform: selectedPlatform,
        owner,
        repo,
        branch: project.branch || 'main',
        token: tokens[selectedPlatform],
      };

      await deployToUnifiedPlatform(deploymentData);

      onHide();
      window.location.reload();
    } catch (err) {
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
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton style={{ backgroundColor: '#2d1b4e', borderBottom: '1px solid #6c3fb5' }}>
        <Modal.Title style={{ color: '#ffffff' }}>Deploy Project</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#1a0033', color: '#ffffff' }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {step === 'analyze' && (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#b89dff' }} />
            <p className="mt-3" style={{ color: '#b8a3d9' }}>Analyzing project and recommending platforms...</p>
          </div>
        )}

        {step === 'select' && (
          <div>
            <h5 className="mb-4" style={{ color: '#ffffff' }}>Select Deployment Platform</h5>

            <div className="row g-3">
              {platforms.map((platform) => {
                const config = platformConfig[platform];
                const Icon = config?.icon;
                const isRecommended = platform === recommendedPlatform;

                return (
                  <div key={platform} className="col-md-6">
                    <Card
                      onClick={() => handlePlatformSelect(platform)}
                      style={{
                        backgroundColor: '#2d1b4e',
                        border: isRecommended ? '2px solid #b89dff' : '1px solid #6c3fb5',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      className="h-100"
                    >
                      <Card.Body>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          {Icon && <Icon size={32} style={{ color: config.color }} />}
                          {isRecommended && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                              <FaCheckCircle /> Recommended
                            </Badge>
                          )}
                        </div>
                        <h6 style={{ color: '#ffffff' }}>{config?.name}</h6>
                        <small style={{ color: '#b8a3d9' }}>
                          {tokens[platform] ? 'Connected' : 'Not connected'}
                        </small>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 'oauth' && (
          <div className="text-center py-4">
            <h5 className="mb-4" style={{ color: '#ffffff' }}>
              Connect to {platformConfig[selectedPlatform]?.name}
            </h5>
            <p style={{ color: '#b8a3d9' }}>
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
            <p style={{ color: '#b8a3d9' }}>
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
            <h5 className="mb-4" style={{ color: '#ffffff' }}>Confirm Deployment</h5>
            <Card style={{ backgroundColor: '#2d1b4e', border: '1px solid #6c3fb5' }}>
              <Card.Body>
                <div className="mb-3">
                  <strong style={{ color: '#b89dff' }}>Project:</strong>
                  <div style={{ color: '#b8a3d9' }}>{project.projectName}</div>
                </div>
                <div className="mb-3">
                  <strong style={{ color: '#b89dff' }}>Platform:</strong>
                  <div style={{ color: '#b8a3d9' }}>{platformConfig[selectedPlatform]?.name}</div>
                </div>
                <div className="mb-3">
                  <strong style={{ color: '#b89dff' }}>Repository:</strong>
                  <div style={{ color: '#b8a3d9' }}>{project.githubRepoUrl}</div>
                </div>
              </Card.Body>
            </Card>
            <div className="d-flex gap-2 mt-4">
              <Button
                onClick={handleDeploy}
                disabled={loading}
                style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5', flex: 1 }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Deploy Now'}
              </Button>
              <Button
                variant="outline-light"
                onClick={() => setStep('select')}
                disabled={loading}
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
