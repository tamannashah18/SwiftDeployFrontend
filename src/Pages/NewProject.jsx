import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '../Components/NavigationBar';
import { getGitHubRepositories } from '../api/projects';
import { deployWithGitHub, deployWithoutGitHub } from '../api/deployments';
import FrameworkDetector from '../Components/FrameworkDetector';
import ConfigViewer from '../Components/ConfigViewer';
import PlatformSelector from '../Components/PlatformSelector';
import UploadCard from '../Components/UploadCard';

function NewProject() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentMethod, setDeploymentMethod] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [projectFile, setProjectFile] = useState(null);
  const [detectedFramework, setDetectedFramework] = useState(null);
  const [config, setConfig] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deploymentMethod === 'github' && currentStep === 2) {
      fetchRepositories();
    }
  }, [deploymentMethod, currentStep]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const repos = await getGitHubRepositories();
      setRepositories(repos);
    } catch (err) {
      setError('Failed to fetch repositories. Please ensure GitHub is connected.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method) => {
    setDeploymentMethod(method);
    setCurrentStep(2);
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setProjectDescription(repo.description || '');
    setDetectedFramework({
      name: 'React',
      buildCommand: 'npm run build',
      outputDir: 'build',
      envVars: [],
    });
    setCurrentStep(3);
  };

  const handleFileUpload = (file) => {
    setProjectFile(file);
    const fileName = file.name.replace('.zip', '');
    setProjectName(fileName);
    setDetectedFramework({
      name: 'React',
      buildCommand: 'npm run build',
      outputDir: 'build',
      envVars: [],
    });
    setCurrentStep(3);
  };

  const handleConfigUpdate = (newConfig) => {
    setConfig(newConfig);
  };

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setCurrentStep(4);
  };

  const handleDeploy = async () => {
    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user'));

      if (deploymentMethod === 'github') {
        const deploymentData = {
          userId: user.id,
          projectName,
          description: projectDescription,
          platform: selectedPlatform,
          gitHubRepo: `${selectedRepo.owner.login}/${selectedRepo.name}`,
          branch: 'main',
          gitHubToken: localStorage.getItem('github_access_token'),
          config: config,
        };

        const result = await deployWithGitHub(deploymentData);
        navigate(`/deployment/${result.projectId}`);
      } else {
        const formData = new FormData();
        formData.append('projectName', projectName);
        formData.append('description', projectDescription);
        formData.append('platform', selectedPlatform);
        formData.append('config', JSON.stringify(config));
        formData.append('projectZip', projectFile);

        const result = await deployWithoutGitHub(formData);
        navigate(`/deployment/${result.projectId}`);
      }
    } catch (err) {
      setError(err.message || 'Deployment failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="d-flex justify-content-center mb-5">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="d-flex align-items-center">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center ${
              currentStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'
            }`}
            style={{ width: '40px', height: '40px', fontWeight: 'bold' }}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`${currentStep > step ? 'bg-primary' : 'bg-light'}`}
              style={{ width: '60px', height: '2px', margin: '0 10px' }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <h2 className="text-center mb-4">Select Deployment Method</h2>
        <div className="row g-4">
          <div className="col-md-6">
            <div
              className="card border-2 border-primary h-100 cursor-pointer"
              onClick={() => handleMethodSelect('github')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="card-body text-center py-5">
                <h3 className="card-title mb-3">Deploy from GitHub</h3>
                <p className="card-text text-muted">
                  Connect your GitHub repository and deploy automatically
                </p>
                <button className="btn btn-primary mt-3">Select</button>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div
              className="card border-2 border-success h-100 cursor-pointer"
              onClick={() => handleMethodSelect('manual')}
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="card-body text-center py-5">
                <h3 className="card-title mb-3">Upload Project</h3>
                <p className="card-text text-muted">
                  Upload a ZIP file of your project for deployment
                </p>
                <button className="btn btn-success mt-3">Select</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <h2 className="text-center mb-4">
          {deploymentMethod === 'github' ? 'Select Repository' : 'Upload Project'}
        </h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {deploymentMethod === 'github' ? (
          loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="list-group">
              {repositories.map((repo) => (
                <button
                  key={repo.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleRepoSelect(repo)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{repo.name}</h6>
                    <small className="text-muted">{repo.owner.login}</small>
                  </div>
                  <p className="mb-1 text-muted small">{repo.description || 'No description'}</p>
                </button>
              ))}
            </div>
          )
        ) : (
          <UploadCard onFileUpload={handleFileUpload} />
        )}

        <div className="text-center mt-4">
          <button className="btn btn-outline-secondary" onClick={() => setCurrentStep(1)}>
            Back
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <h2 className="text-center mb-4">Review Configuration</h2>

        <div className="mb-4">
          <label className="form-label fw-bold">Project Name</label>
          <input
            type="text"
            className="form-control"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">Description</label>
          <textarea
            className="form-control"
            rows="2"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>

        {detectedFramework && (
          <>
            <FrameworkDetector
              framework={detectedFramework}
              onUpdate={(framework) => setDetectedFramework(framework)}
            />
            <ConfigViewer config={detectedFramework} onUpdate={handleConfigUpdate} />
          </>
        )}

        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-outline-secondary" onClick={() => setCurrentStep(2)}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setCurrentStep(4)}
            disabled={!projectName}
          >
            Continue to Platform Selection
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <h2 className="text-center mb-4">Select Deployment Platform</h2>
        <PlatformSelector
          selectedPlatform={selectedPlatform}
          onSelect={handlePlatformSelect}
        />

        {selectedPlatform && (
          <div className="card mt-4 bg-light">
            <div className="card-body">
              <h5 className="card-title">Deployment Summary</h5>
              <ul className="list-unstyled mb-0">
                <li><strong>Project:</strong> {projectName}</li>
                <li><strong>Platform:</strong> {selectedPlatform}</li>
                <li><strong>Framework:</strong> {detectedFramework?.name}</li>
                <li><strong>Build Command:</strong> {detectedFramework?.buildCommand}</li>
                <li><strong>Output Directory:</strong> {detectedFramework?.outputDir}</li>
              </ul>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}

        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-outline-secondary" onClick={() => setCurrentStep(3)}>
            Back
          </button>
          <button
            className="btn btn-success"
            onClick={handleDeploy}
            disabled={!selectedPlatform || loading}
          >
            {loading ? 'Deploying...' : 'Deploy Now'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 bg-light">
      <NavigationBar />
      <div className="container py-5">
        {renderStepIndicator()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
}

export default NewProject;
