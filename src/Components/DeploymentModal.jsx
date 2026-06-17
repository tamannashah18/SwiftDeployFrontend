import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Card, Form, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { SiNetlify, SiVercel, SiCloudflare, SiFirebase, SiRender, SiRailway } from 'react-icons/si';
import { FaGithub, FaCheckCircle, FaCalendarAlt, FaClock, FaAws } from 'react-icons/fa';
import { VscAzure } from 'react-icons/vsc';
import { analyzeAndSuggest, deployToUnifiedPlatform, scheduleUploadDeployment, scheduleGitHubDeployment } from '../api/deployments';
import { getUserTokens, savePlatformToken, startNetlifyLogin } from '../api/auth';
import ConfigurationForm from './ConfigurationForm';

const DeploymentModal = ({ 
  show, 
  onHide, 
  project, 
  onDeploymentStart,
  isWithoutGitHub = false,  // ⭐ NEW PROP to indicate deploy-without-github mode
  latestDeployment = null
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('analyze');
  const [platforms, setPlatforms] = useState([]);
  const [recommendedPlatform, setRecommendedPlatform] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [tokens, setTokens] = useState({});
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deploymentConfig, setDeploymentConfig] = useState(null);
  const [buildRisks, setBuildRisks] = useState([]);
const [optimizations, setOptimizations] = useState([]);
  const [detectedTech, setDetectedTech] = useState({
    framework: '',
    frontendFramework: '',
    backendFramework: '',
    buildTool: '',
    packageManager: '',
    technologies: [],
    projectType: '',
    isStatic: false
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date();
    // Offset to local time for datetime-local input
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [selectedTimeZone, setSelectedTimeZone] = useState(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  });

  // Get common time zones or all supported ones
  const timeZones = React.useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (e) {
      // Fallback if not supported
      return ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
    }
  }, []);

  const dateInputRef = useRef(null);

  const platformConfig = {
    netlify: { name: 'Netlify', icon: SiNetlify, color: '#00C7B7', requiresOAuth: true },
    vercel: { name: 'Vercel', icon: SiVercel, color: '#000', requiresOAuth: false },
    'githubpages': { name: 'GitHub Pages', icon: FaGithub, color: '#333', requiresOAuth: false },
    'github pages': { name: 'GitHub Pages', icon: FaGithub, color: '#333', requiresOAuth: false },
    cloudflare: { name: 'Cloudflare Pages', icon: SiCloudflare, color: '#F38020', requiresOAuth: false },
    'cloudflare pages': { name: 'Cloudflare Pages', icon: SiCloudflare, color: '#F38020', requiresOAuth: false },
    aws: { name: 'AWS S3', icon: FaAws, color: '#FF9900', requiresOAuth: false },
    gcp: { name: 'GCP (Firebase)', icon: SiFirebase, color: '#FFCA28', requiresOAuth: false },
    azure: { name: 'Azure Static Apps', icon: VscAzure, color: '#0089D6', requiresOAuth: false },
    render: { name: 'Render', icon: SiRender, color: '#46E3B7', requiresOAuth: false },
    railway: { name: 'Railway', icon: SiRailway, color: '#0B0D0E', requiresOAuth: false },
  };

  const normalizePlatformName = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('github')) return 'githubpages';
    if (lower.includes('cloudflare')) return 'cloudflare';
    if (lower.includes('netlify')) return 'netlify';
    if (lower.includes('vercel')) return 'vercel';
    if (lower.includes('aws') || lower.includes('amazon')) return 'aws';
    if (lower.includes('gcp') || lower.includes('firebase')) return 'gcp';
    if (lower.includes('azure')) return 'azure';
    if (lower.includes('render')) return 'render';
    if (lower.includes('railway')) return 'railway';
    return lower;
  };

  useEffect(() => {
    if (show) {
      // ⭐ Always fetch tokens to show connected status
      fetchTokens();
      
      // ⭐ Only analyze project if NOT in deploy-without-github mode
      if (!isWithoutGitHub) {
        analyzeProject();
      } else {
        // ⭐ For deploy-without-github, show platform selection directly
        setStep('select-platform-only');
        // Set default platforms for deploy-without-github
        setPlatforms([
          { platform: 'Vercel', score: 90, reason: 'Fast deployment with automatic builds', features: ['Auto-scaling', 'Edge Network'], isRecommended: true },
          { platform: 'Cloudflare', score: 85, reason: 'Global CDN with excellent performance', features: ['DDoS Protection', 'Fast CDN'] },
          { platform: 'Netlify', score: 80, reason: 'Easy deployment with continuous integration', features: ['Form Handling', 'Split Testing'] },
          { platform: 'AWS S3', score: 80, reason: 'Scalable cloud storage for static websites', features: ['High Availability', 'Custom Domains'] },
          { platform: 'GCP', score: 75, reason: 'Global hosting by Google', features: ['Global CDN', 'Free SSL'] },
          { platform: 'Azure', score: 75, reason: 'Streamlined static apps', features: ['Global Availability', 'Custom Domains'] },
          { platform: 'Render', score: 70, reason: 'Unified cloud for apps and sites', features: ['Auto Deploy', 'Free SSL'] },
          { platform: 'Railway', score: 65, reason: 'Deploy databases and backend services', features: ['Databases', 'Auto Scaling'] }
        ]);
      }

      const shouldOpenNetlifyConfig = localStorage.getItem('open_deploy_modal_netlify');
      if (shouldOpenNetlifyConfig === 'true') {
        localStorage.removeItem('open_deploy_modal_netlify');
        setTimeout(() => {
          setSelectedPlatform('netlify');
          setStep('config');
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isWithoutGitHub]);

  const fetchTokens = async () => {
    try {
      const tokenData = await getUserTokens();
      setTokens({
        netlify: tokenData.hasNetlifyToken,
        vercel: tokenData.hasVercelToken,
        'githubpages': tokenData.hasGitHubToken,
        cloudflare: tokenData.hasCloudflareToken,
        aws: tokenData.hasAwsToken || false,
        gcp: tokenData.hasGcpToken || false,
        azure: tokenData.hasAzureToken || false,
        render: tokenData.hasRenderToken || false,
        railway: tokenData.hasRailwayToken || false,
      });
    } catch (err) {
      console.error('Error fetching tokens:', err);
    }
  };

  const analyzeProject = async () => {
    if (!project.repoId) {
      setError('GitHub repository information not found');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const [owner, repo] = project.repoId.split('/');
      const branch = project.branch || 'main';
      const token = tokens['githubpages'];

      const result = await analyzeAndSuggest(owner, repo, branch, token);
      
      if (result.analysis) {
        setPlatforms(result.analysis.allSuggestions || []);
        setRecommendedPlatform(result.analysis.recommendedPlatform?.platform || null);
        setBuildRisks(result.analysis.buildRisks || []);
setOptimizations(result.analysis.optimizations || []);

        const tech = result.analysis.detectedTechnologies || {};
        const projectInfo = result.analysis.projectInfo || {};

        setDetectedTech({
          framework: projectInfo.frontendFramework || tech.framework || 'Not detected',
          frontendFramework: projectInfo.frontendFramework || '',
          backendFramework: projectInfo.backendFramework || '',
          buildTool: tech.buildTool || 'Not detected',
          packageManager: tech.packageManager || 'npm',
          technologies: tech.technologies || [],
          projectType: projectInfo.type || 'Unknown',
          isStatic: tech.isStatic || false
        });
        setStep('select');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze project');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = (platformObj) => {
    const normalizedName = normalizePlatformName(platformObj.platform);
    setSelectedPlatform(normalizedName);

    // ⭐ For deploy-without-github, skip token checks and go directly to config
    if (isWithoutGitHub) {
      setStep('config');
      return;
    }

    // ⭐ Original token check logic for deploy-with-github
    const config = platformConfig[normalizedName];

    if (config?.requiresOAuth && normalizedName === 'netlify') {
      if (!tokens[normalizedName]) {
        setStep('oauth');
        return;
      }
    } else {
      if (!tokens[normalizedName]) {
        setStep('token');
        return;
      }
    }

    setStep('config');
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
      setStep('config');
    } catch (err) {
      setError(err.message || 'Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = (config) => {
    setDeploymentConfig(config);
    setStep('confirm');
  };

  // ⭐ NEW: Deploy without GitHub handler
 const handleDeployWithoutGitHub = async () => {
  setLoading(true);
  setError('');

  try {
    const rawConfig = deploymentConfig || {};
    let projectTypeVal = 0;
    if (rawConfig.projectType !== undefined) {
      projectTypeVal = (rawConfig.projectType === 'Framework' || rawConfig.projectType === 1) ? 1 : 0;
    } else if (rawConfig.framework && rawConfig.framework !== 'static') {
      projectTypeVal = 1;
    }

    let defaultOutputDir = '.';
    if (selectedPlatform === 'githubpages') {
      defaultOutputDir = (!rawConfig.framework || rawConfig.framework === 'static') ? '/' : 'dist';
    } else if (rawConfig.framework && rawConfig.framework !== 'static') {
      const fw = rawConfig.framework.toLowerCase();
      if (fw.includes('next')) defaultOutputDir = '.next';
      else if (fw.includes('nuxt')) defaultOutputDir = '.nuxt';
      else if (fw.includes('react') || fw.includes('vue')) defaultOutputDir = 'dist';
      else defaultOutputDir = 'dist';
    }

    const formattedConfig = {
      ProjectName: rawConfig.projectName || project.projectName || 'deployed-project',
      BuildCommand: rawConfig.buildCommand || '',
      OutputDirectory: rawConfig.outputDirectory || defaultOutputDir,
      InstallCommand: rawConfig.installCommand || '',
      Framework: rawConfig.framework || 'static',
      ProjectType: projectTypeVal,
      EnableHttps: rawConfig.enableHttps !== undefined ? rawConfig.enableHttps : true,
      EnvironmentVariables: rawConfig.environmentVariables || {},
      Redirects: (rawConfig.redirects || []).map(r => ({
        From: r.from,
        To: r.to,
        Status: r.status
      })),
      Headers: (rawConfig.headers || []).map(h => ({
        Source: h.source,
        Headers: h.headers
      }))
    };

    if (rawConfig.nodeVersion) {
      formattedConfig.NodeVersion = rawConfig.nodeVersion;
    }
    if (rawConfig.domain) {
      formattedConfig.Domain = rawConfig.domain;
    }

    // ⭐ Create JSON payload matching your backend UploadProjectRequest model
    const payload = {
      projectId: project._id || project.id,
      projectName: rawConfig.projectName || project.projectName || 'deployed-project',
      description: project.description || `Deployed ${project.projectName} via SwiftDeploy`,
      platform: selectedPlatform,
      repoName: project.repoId,
      config: deploymentConfig?.config || deploymentConfig || {
        projectName: deploymentConfig?.projectName || project.projectName || 'deployed-project',
        region: deploymentConfig?.region || 'us-east-1',
        framework: deploymentConfig?.framework || 'static',
        buildCommand: deploymentConfig?.buildCommand || '',
        installCommand: deploymentConfig?.installCommand || '',
        outputDirectory: deploymentConfig?.outputDirectory || '',
        nodeVersion: deploymentConfig?.nodeVersion || '',
        domain: deploymentConfig?.domain || '',
        enableHttps: deploymentConfig?.enableHttps !== undefined ? deploymentConfig.enableHttps : true,
        environmentVariables: deploymentConfig?.environmentVariables || {},
        redirects: deploymentConfig?.redirects || [],
        headers: deploymentConfig?.headers || []
      }
    };

    console.log('📤 Sending deployment payload:', payload);

    const response = await fetch('http://localhost:5280/api/UnifiedDeployment/deploy-without-github', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    // ⭐ Check if response is OK before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      let errorMessage = 'Deployment failed';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors) {
          // Handle validation errors
          errorMessage = Object.entries(errorJson.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
        } else if (errorJson.message || errorJson.Message) {
          errorMessage = errorJson.message || errorJson.Message;
        } else if (errorJson.title) {
          errorMessage = errorJson.title;
        }
      } catch {
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Deployment result:', result);

    const isSuccess = result && (
      result.success === true || 
      result.Success === true ||
      (result.status !== undefined && typeof result.status === 'number' && result.status >= 6) ||
      (result.status === 'Completed' || result.status === 'completed')
    );
    
    if (isSuccess) {
      onHide();
      const projectId = result.ProjectId || result.projectId;
      
      if (onDeploymentStart) {
        onDeploymentStart({
          projectId,
          deploymentUrl: result.DeploymentUrl || result.deploymentUrl,
          githubRepoUrl: result.GitHubRepoUrl || result.githubRepoUrl,
          configFileUrl: result.ConfigFileUrl || result.configFileUrl,
          status: result.status,
          success: isSuccess
        });
      } else {
        if (projectId) {
          navigate(`/deployment/${projectId}`);
        } else {
          window.location.reload();
        }
      }
    } else {
      throw new Error(result?.Message || result?.message || 'Deployment failed');
    }
  } catch (err) {
    console.error('💥 Deployment error:', err);
    setError(err.message || 'Deployment failed');
  } finally {
    setLoading(false);
  }
};

  const handleDeploy = async () => {
  // ⭐ Check userType from localStorage to determine deployment mode
  let shouldDeployWithoutGitHub = false;
  
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    const isNonGitHubUser = userData?.userType === 1;
    
    // Check if project has a real GitHub repo
    const hasGitHubRepo = project?.repoId && !project.repoId.startsWith('swiftdeployapp/');
    
    // Use deploy-without-github if:
    // 1. User is non-GitHub user (userType = 1) AND
    // 2. Project doesn't have a real GitHub repo
    shouldDeployWithoutGitHub = isNonGitHubUser && !hasGitHubRepo;
    
    console.log('🚀 Deployment Decision:', {
      userType: userData?.userType,
      isNonGitHubUser: isNonGitHubUser,
      repoId: project?.repoId,
      hasGitHubRepo: hasGitHubRepo,
      shouldDeployWithoutGitHub: shouldDeployWithoutGitHub,
      willCallAPI: shouldDeployWithoutGitHub ? 'deploy-without-github' : 'deploy-with-github'
    });
  } catch (error) {
    console.error('Error checking user type:', error);
    shouldDeployWithoutGitHub = false; // Default to with-github
  }

  // ⭐ Route to appropriate deployment handler
  if (shouldDeployWithoutGitHub) {
    await handleDeployWithoutGitHub();
    return;
  }

  // ⭐ Original deploy-with-github logic
  setLoading(true);
  setError('');

  try {
    if (!project.repoId) {
      throw new Error('GitHub repository information not found');
    }

    const [owner, repo] = project.repoId.split('/');
    const platformId = latestDeployment?.platform?.toLowerCase() === selectedPlatform?.toLowerCase()
      ? (latestDeployment?.platformProjectId || latestDeployment?.PlatformProjectId || null)
      : null;

    const deploymentData = {
      projectId: project._id || project.id,
      projectName: deploymentConfig?.projectName || project.projectName || 'deployed-project',
      description: project.description || `Deployed ${project.projectName} via SwiftDeploy`,
      platform: selectedPlatform,
      owner,
      repo,
      branch: project.branch || 'main',
      config: deploymentConfig || {},
      platformId
    };

    const response = await deployToUnifiedPlatform(deploymentData);

    const isSuccess = response && (
      response.success === true || 
      response.Success === true ||
      (response.status !== undefined && typeof response.status === 'number' && response.status >= 6) ||
      (response.status === 'Completed' || response.status === 'completed')
    );
    
    if (isSuccess) {
      onHide();
      const projectId = response.ProjectId || response.projectId;
      const mongoDeploymentId = response.MongoDeploymentId || response.mongoDeploymentId;
      
      if (onDeploymentStart) {
        onDeploymentStart({
          projectId,
          mongoDeploymentId,
          deploymentUrl: response.DeploymentUrl || response.deploymentUrl,
          githubRepoUrl: response.GitHubRepoUrl || response.githubRepoUrl,
          configFileUrl: response.ConfigFileUrl || response.configFileUrl,
          status: response.status,
          success: isSuccess
        });
      } else {
        if (projectId) {
          navigate(`/deployment/${projectId}`, {
            state: {
              mongoDeploymentId
            }
          });
        } else {
          window.location.reload();
        }
      }
    } else {
      throw new Error(response?.Message || response?.message || 'Deployment failed');
    }
  } catch (err) {
    setError(err.message || 'Deployment failed');
  } finally {
    setLoading(false);
  }
};

const handleSchedule = async () => {
  if (!scheduledTime) {
    setError('Please select a time');
    return;
  }

  const selectedDate = new Date(scheduledTime);
  const now = new Date();

  if (selectedDate <= now) {
    setError('Scheduled time must be in the future');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    const isNonGitHubUser = userData?.userType === 1 || userData?.userType === '1';
    
    // Check if project has a real GitHub repo
    const hasGitHubRepo = project?.repoId && !project.repoId.startsWith('swiftdeployapp/');
    const isUploadDeployment = isNonGitHubUser && !hasGitHubRepo;

    // Convert local time to UTC based on selected time zone
    const [datePart, timePart] = scheduledTime.split('T');
    // Interpret the selected time as if it were UTC first, then adjust by the timezone offset
    const baseDate = new Date(`${datePart}T${timePart}:00Z`);
    
    // Get offset for the selected timezone at that specific time
    const getOffsetForDate = (date, tz) => {
      try {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
        return (tzDate.getTime() - utcDate.getTime()) / 60000;
      } catch (e) {
        return 0; // Fallback to UTC if timezone is invalid
      }
    };

    const offset = getOffsetForDate(baseDate, selectedTimeZone);
    const finalDate = new Date(baseDate.getTime() - offset * 60000);
    const utcTime = finalDate.toISOString();

    const config = deploymentConfig || {};
    let projectTypeVal = 0;
    if (config.projectType !== undefined) {
      projectTypeVal = (config.projectType === 'Framework' || config.projectType === 1) ? 1 : 0;
    } else if (config.framework && config.framework !== 'static') {
      projectTypeVal = 1;
    }

    let defaultOutputDir = '.';
    if (selectedPlatform === 'githubpages') {
      defaultOutputDir = (!config.framework || config.framework === 'static') ? '/' : 'dist';
    } else if (config.framework && config.framework !== 'static') {
      const fw = config.framework.toLowerCase();
      if (fw.includes('next')) defaultOutputDir = '.next';
      else if (fw.includes('nuxt')) defaultOutputDir = '.nuxt';
      else if (fw.includes('react') || fw.includes('vue')) defaultOutputDir = 'dist';
      else defaultOutputDir = 'dist';
    }

    const formattedConfig = {
      ProjectName: config.projectName || project.projectName || project.projectId || 'Deployed Project',
      BuildCommand: config.buildCommand || '',
      OutputDirectory: config.outputDirectory || defaultOutputDir,
      InstallCommand: config.installCommand || '',
      ProjectType: projectTypeVal
    };

    if (config.nodeVersion) {
      formattedConfig.NodeVersion = config.nodeVersion;
    }
    if (config.domain) {
      formattedConfig.Domain = config.domain;
    }
    if (config.framework) {
      formattedConfig.Framework = config.framework;
    }
    if (config.enableHttps !== undefined) {
      formattedConfig.EnableHttps = config.enableHttps;
    }
    if (config.environmentVariables && Object.keys(config.environmentVariables).length > 0) {
      formattedConfig.EnvironmentVariables = config.environmentVariables;
    }
    if (config.redirects && config.redirects.length > 0) {
      formattedConfig.Redirects = config.redirects.map(r => ({
        From: r.from,
        To: r.to,
        Status: r.status
      }));
    }
    if (config.headers && config.headers.length > 0) {
      formattedConfig.Headers = config.headers.map(h => ({
        Source: h.source,
        Headers: h.headers
      }));
    }

    if (isUploadDeployment) {
      // payload matches UploadProjectRequest
      const payload = {
        userId: userData.id,
        projectId: project._id || project.id,
        projectName: deploymentConfig?.projectName || project.projectName || 'deployed-project',
        repoName: project.repoId,
        description: project.description || `Scheduled deployment via SwiftDeploy`,
        platform: selectedPlatform,
        zipPath: project.zipPath || project.ZipPath || '',
        config: formattedConfig
      };
      
      await scheduleUploadDeployment(payload, utcTime);
    } else {
      // payload matches GitHubDeployRequest
      const platformId = latestDeployment?.platform?.toLowerCase() === selectedPlatform?.toLowerCase()
        ? (latestDeployment?.platformProjectId || latestDeployment?.PlatformProjectId || null)
        : null;

      const payload = {
        userId: userData.id,
        projectId: project._id || project.id,
        projectName: deploymentConfig?.projectName || project.projectName || 'deployed-project',
        description: project.description || `Scheduled deployment via SwiftDeploy`,
        platform: selectedPlatform,
        gitHubRepo: project.repoId,
        branch: project.branch || 'main',
        config: formattedConfig,
        platformId
      };
      
      await scheduleGitHubDeployment(payload, utcTime);
    }

    alert('Deployment scheduled successfully!');
    onHide();
  } catch (err) {
    console.error('Scheduling error:', err);
    setError(err.message || 'Scheduling failed');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setStep('analyze');
    setSelectedPlatform(null);
    setTokenInput('');
    setDeploymentConfig(null);
    setError('');
    onHide();
  };

  const getFrameworkValue = (framework) => {
    if (!framework || framework === 'Not detected') return 'static';
    const lowerFramework = framework.toLowerCase();
    if (lowerFramework.includes('react')) return 'react';
    if (lowerFramework.includes('vue')) return 'vue';
    if (lowerFramework.includes('angular')) return 'angular';
    if (lowerFramework.includes('next')) return 'nextjs';
    if (lowerFramework.includes('nuxt')) return 'nuxtjs';
    if (lowerFramework.includes('gatsby')) return 'gatsby';
    if (lowerFramework.includes('svelte')) return 'svelte';
    return 'static';
  };

  const getDefaultOutputDir = (framework, buildTool) => {
    if (selectedPlatform === 'githubpages' && (!framework || framework === 'Not detected' || framework.toLowerCase() === 'static')) return '/';
    if (!framework || framework === 'Not detected') return '.';

    const lowerFramework = framework.toLowerCase();
    if (lowerFramework.includes('next')) return '.next';
    if (lowerFramework.includes('nuxt')) return '.nuxt';
    if (buildTool && buildTool.toLowerCase() === 'vite') return 'dist';
    if (lowerFramework.includes('react') || lowerFramework.includes('vue')) return 'build';
    return 'dist';
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
        <Modal.Title>
          {isWithoutGitHub ? 'Deploy Project (Without GitHub)' : 'Deploy Project'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ 
        backgroundColor: '#3a1f6b', 
        color: '#ffffff',
        padding: '1.5rem 2rem'
      }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {step === 'analyze' && !isWithoutGitHub && (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#b89dff' }} />
            <p className="mt-3" style={{ color: '#b8a3d9' }}>Analyzing project and recommending platforms...</p>
          </div>
        )}

        {/* ⭐ NEW: Platform selection for deploy-without-github */}
        {step === 'select-platform-only' && isWithoutGitHub && (
          <div>
            <h5 className="mb-3" style={{ color: '#ffffff' }}>Select Deployment Platform</h5>
            <p style={{ color: '#b8a3d9', marginBottom: '1.5rem' }}>
              Choose a platform to deploy your project
            </p>

            <div className="row g-3">
              {platforms.map((platform, index) => {
                const normalizedName = normalizePlatformName(platform.platform);
                const config = platformConfig[normalizedName];
                const Icon = config?.icon || FaGithub;
                const isRecommended = platform.isRecommended;

                return (
                  <div key={normalizedName || index} className="col-md-6">
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
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <Icon size={24} style={{ color: config?.color || '#ffffff' }} />
                              <span className="fw-bold" style={{ color: '#ffffff' }}>{platform.platform}</span>
                            </div>
                            <Badge bg="dark" style={{ color: '#ffffff' }}>
                              Score: {platform.score}/100
                            </Badge>
                          </div>
                          {isRecommended && (
                            <Badge bg="success" className="d-flex align-items-center gap-1 mt-2" style={{ width: 'fit-content' }}>
                              <FaCheckCircle /> Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="mb-2" style={{ color: '#ffffff' }}>{platform.reason}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {platform.features?.map((feature, i) => (
                              <Badge key={i} bg="info" className="me-1 mb-1" style={{ color: '#ffffff' }}>
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Original select step for deploy-with-github */}
     {step === 'select' && !isWithoutGitHub && (
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

    {/* ⭐ BUILD RISKS + OPTIMIZATIONS (ADDED HERE ONLY) */}
   {/* ⭐ COMPACT BUILD RISKS + OPTIMIZATIONS */}
{(buildRisks.length > 0 || optimizations.length > 0) && (
  <div className="mb-3" style={{ display: 'flex', gap: '20px' }}>

    {/* ⚠ Issues */}
    {buildRisks.length > 0 && (
      <div style={{ flex: 1 }}>
        <div style={{ 
          color: '#ff6b6b', 
          fontSize: '13px', 
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          ⚠ Issues
        </div>

        {buildRisks.slice(0, 2).map((risk, i) => (
          <div key={i} style={{ 
            color: '#ffffff', 
            fontSize: '12px',
            opacity: 0.85 
          }}>
            • {risk.split('-')[0].split('.')[0]}
          </div>
        ))}
      </div>
    )}

    {/* 🚀 Tips */}
    {optimizations.length > 0 && (
      <div style={{ flex: 1 }}>
        <div style={{ 
          color: '#4ade80', 
          fontSize: '13px', 
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          🚀 Tips
        </div>

        {optimizations.slice(0, 2).map((opt, i) => (
          <div key={i} style={{ 
            color: '#ffffff', 
            fontSize: '12px',
            opacity: 0.85 
          }}>
            • {opt.split('-')[0].split('.')[0]}
          </div>
        ))}
      </div>
    )}

  </div>
)}

    <h5 className="mb-3" style={{ color: '#ffffff' }}>
      Select Deployment Platform
    </h5>

    <div className="row g-3">
      {platforms.map((platform, index) => {
        const normalizedName = normalizePlatformName(platform.platform);
        const config = platformConfig[normalizedName];
        const Icon = config?.icon || FaGithub;
        const isRecommended = platform.isRecommended;
        const hasToken = tokens[normalizedName];

        return (
          <div key={normalizedName || index} className="col-md-6">
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
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Icon size={24} style={{ color: config?.color || '#ffffff' }} />
                      <span className="fw-bold" style={{ color: '#ffffff' }}>{platform.platform}</span>
                    </div>
                    <Badge bg="dark" style={{ color: '#ffffff' }}>
                      Score: {platform.score}/100
                    </Badge>
                  </div>
                  {isRecommended && (
                    <Badge bg="success" className="d-flex align-items-center gap-1 mt-2">
                      <FaCheckCircle /> Recommended
                    </Badge>
                  )}
                </div>

                <p className="mb-2" style={{ color: '#ffffff' }}>{platform.reason}</p>

                <small style={{ color: hasToken ? '#4ade80' : '#f87171' }}>
                  {hasToken ? '✓ Connected' : '✗ Not connected'}
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

        {step === 'config' && (
          <ConfigurationForm
            selectedPlatform={selectedPlatform}
            onSubmit={handleConfigSubmit}
            initialConfig={{
              region: 'us-east-1',
              projectName: project.projectName || '',
              framework: isWithoutGitHub ? 'static' : getFrameworkValue(detectedTech.frontendFramework || detectedTech.framework),
              projectType: isWithoutGitHub ? 'Static' : (detectedTech.isStatic || getFrameworkValue(detectedTech.frontendFramework || detectedTech.framework) === 'static' ? 'Static' : 'Framework'),
              buildCommand: isWithoutGitHub ? '' : (detectedTech.isStatic || getFrameworkValue(detectedTech.frontendFramework || detectedTech.framework) === 'static' 
                ? '' 
                : (detectedTech.buildTool ? `${detectedTech.packageManager} run build` : '')),
              installCommand: isWithoutGitHub ? '' : (detectedTech.isStatic || getFrameworkValue(detectedTech.frontendFramework || detectedTech.framework) === 'static'
                ? ''
                : (detectedTech.packageManager ? `${detectedTech.packageManager} install` : '')),
              outputDirectory: isWithoutGitHub ? '' : (detectedTech.isStatic || getFrameworkValue(detectedTech.frontendFramework || detectedTech.framework) === 'static'
                ? ''
                : getDefaultOutputDir(detectedTech.frontendFramework || detectedTech.framework, detectedTech.buildTool)),
              nodeVersion: isWithoutGitHub ? '' : (detectedTech.isStatic || getFrameworkValue(detectedTech.frontendFramework || detectedTech.framework) === 'static'
                ? ''
                : '18')
            }}
            onBack={() => setStep(isWithoutGitHub ? 'select-platform-only' : 'select')}
          />
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
                {!isWithoutGitHub && (
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
                )}
              </Card.Body>
            </Card>
            <div className="mt-4">
              {!showTimePicker ? (
                <div className="d-flex gap-3 justify-content-center">
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
                    variant="outline-info"
                    onClick={() => setShowTimePicker(true)}
                    disabled={loading}
                    size="lg"
                    style={{
                      minWidth: '150px',
                      fontWeight: '500'
                    }}
                  >
                    <FaCalendarAlt className="me-2" /> Deploy Later
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={() => setStep('config')}
                    disabled={loading}
                    size="lg"
                    style={{
                      minWidth: '120px',
                      fontWeight: '500'
                    }}
                  >
                    Back
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid #6c3fb5' }}>
                  <h6 className="mb-3 d-flex align-items-center" style={{ color: '#b89dff' }}>
                    <FaClock className="me-2" /> Schedule Deployment Time
                  </h6>
                  
                  <div className="row g-3">
                    <div className="col-md-7">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: '#b8a3d9', fontSize: '13px' }}>Appointment Time</Form.Label>
                        <InputGroup>
                          <InputGroup.Text 
                            onClick={() => {
                              if (dateInputRef.current && dateInputRef.current.showPicker) {
                                dateInputRef.current.showPicker();
                              }
                            }}
                            style={{ 
                              backgroundColor: '#1a0033', 
                              border: '1px solid #6c3fb5', 
                              color: '#b89dff',
                              cursor: 'pointer'
                            }}
                          >
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            ref={dateInputRef}
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            style={{
                              backgroundColor: '#1a0033',
                              color: '#ffffff',
                              border: '1px solid #6c3fb5',
                              borderLeft: 'none',
                              fontSize: '15px'
                            }}
                          />
                        </InputGroup>
                      </Form.Group>
                    </div>
                    
                    <div className="col-md-5">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: '#b8a3d9', fontSize: '13px' }}>Time Zone</Form.Label>
                        <Form.Select
                          value={selectedTimeZone}
                          onChange={(e) => setSelectedTimeZone(e.target.value)}
                          style={{
                            backgroundColor: '#1a0033',
                            color: '#ffffff',
                            border: '1px solid #6c3fb5',
                            fontSize: '14px'
                          }}
                        >
                          {timeZones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <p className="mb-3" style={{ color: '#b8a3d9', fontSize: '12px' }}>
                    Deployment will be scheduled for: <strong>{new Date(scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong> in <strong>{selectedTimeZone}</strong>.
                  </p>

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      onClick={handleSchedule}
                      disabled={loading}
                      style={{
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        flex: 1,
                        fontWeight: '600'
                      }}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Confirm Schedule'}
                    </Button>
                    <Button
                      variant="outline-light"
                      onClick={() => setShowTimePicker(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default DeploymentModal;