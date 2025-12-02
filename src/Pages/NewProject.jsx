import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '../Components/NavigationBar';
import { getGitHubRepositories } from '../api/projects';
import apiClient from '../api/apiClient';
import '../css/Forms.css';
import '../css/Responsive.css';

function NewProject() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isGitHubUser, setIsGitHubUser] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [cloudBucketId, setCloudBucketId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // ⭐ NEW: Success feedback

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    setIsGitHubUser(userData?.userType == 0);

    if (userData?.userType == 0) {
      fetchRepositories();
    }
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const repos = await getGitHubRepositories();
      setRepositories(repos);
    } catch (err) {
      setError('Failed to fetch repositories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isGitHubUser) {
        // ⭐ GitHub User Flow
        if (!selectedRepo) {
          setError('Please select a repository');
          setLoading(false);
          return;
        }

        const projectData = {
          userId: user.id,
          projectName: selectedRepo.split('/')[1],
          repoId: selectedRepo,
          branch: 'main'
        };

        await apiClient.post('/projects', projectData);
        navigate('/projects');
      } else {
        // ⭐ Non-GitHub User Flow - Call new-without-github-project endpoint
        if (!cloudBucketId || !projectName) {
          setError('Please provide both project name and blob name');
          setLoading(false);
          return;
        }

        // ⭐ Show progress message
        setSuccessMessage('Creating project... This may take a few moments.');

        const projectData = {
          userId: user.id,
          projectName: projectName.trim(),
          bloburl: cloudBucketId.trim()
        };

        console.log('Creating project with data:', projectData);

        // ⭐ Call the new endpoint
        const response = await apiClient.post('/projects/new-without-github-project', projectData);

        console.log('Project creation response:', response.data);

        if (response.data) {
          // ⭐ Success - project created with GitHub repo
          setSuccessMessage('Project created successfully! Redirecting...');
          
          // ⭐ Wait a moment to show success message
          setTimeout(() => {
            navigate('/projects');
          }, 1500);
        } else {
          setError('Failed to create project');
        }
      }
    } catch (err) {
      console.error('Project creation error:', err);
      
      // ⭐ Enhanced error handling
      let errorMessage = 'Failed to create project';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' 
          ? err.response.data 
          : JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#1a0033' }}>
      <NavigationBar />

      <div className="container-fluid py-5" style={{ marginLeft: '5rem', paddingRight: '2rem' }}>
        <div className="row justify-content-center">
          <div className="col-sm-12 col-md-10 col-lg-8 col-xl-6">
            <div className="card shadow-lg" style={{ backgroundColor: '#2d1b4e', border: 'none' }}>
              <div className="card-body p-5">
                <h2 className="text-center mb-4" style={{ color: '#ffffff' }}>
                  Create New Project
                </h2>

                {/* ⭐ Error Alert */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* ⭐ Success Alert */}
                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>{successMessage}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {isGitHubUser ? (
                    // ⭐ GitHub User - Select Repository
                    <div>
                      <div className="mb-4">
                        <label className="form-label" style={{ color: '#ffffff' }}>
                          Select Repository
                        </label>
                        {loading && repositories.length === 0 ? (
                          <div className="text-center py-3">
                            <div className="spinner-border text-light" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : (
                          <select
                            className="form-select form-select-lg"
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            required
                            style={{
                              backgroundColor: '#1a0033',
                              color: '#ffffff',
                              border: '1px solid #6c3fb5'
                            }}
                          >
                            <option value="">-- Select a repository --</option>
                            {repositories.map((repo) => (
                              <option key={repo.id} value={`${repo.owner.login}/${repo.name}`}>
                                {repo.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {selectedRepo && (
                        <div className="alert alert-info">
                          <strong>Selected:</strong> {selectedRepo}
                        </div>
                      )}
                    </div>
                  ) : (
                    // ⭐ Non-GitHub User - Project Name + Blob URL
                    <div>
                      <div className="mb-4">
                        <label className="form-label" style={{ color: '#ffffff' }}>
                          Project Name <span style={{ color: '#ff6b6b' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Enter project name (e.g., My Website)"
                          required
                          disabled={loading}
                          style={{
                            backgroundColor: '#1a0033',
                            color: '#ffffff',
                            border: '1px solid #6c3fb5'
                          }}
                        />
                        <small style={{ color: '#b8a3d9', marginTop: '0.5rem', display: 'block' }}>
                          Choose a descriptive name for your project
                        </small>
                      </div>

                      <div className="mb-4">
                        <label className="form-label" style={{ color: '#ffffff' }}>
                          Azure Blob Name <span style={{ color: '#ff6b6b' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={cloudBucketId}
                          onChange={(e) => setCloudBucketId(e.target.value)}
                          placeholder="Enter blob name (e.g., myproject.zip)"
                          required
                          disabled={loading}
                          style={{
                            backgroundColor: '#1a0033',
                            color: '#ffffff',
                            border: '1px solid #6c3fb5'
                          }}
                        />
                        <small style={{ color: '#b8a3d9', marginTop: '0.5rem', display: 'block' }}>
                          The name of your ZIP file stored in Azure Blob Storage
                        </small>
                      </div>

                      {/* ⭐ Info Box */}
                      <div 
                        className="alert" 
                        style={{ 
                          backgroundColor: 'rgba(108, 63, 181, 0.2)', 
                          border: '1px solid #6c3fb5',
                          color: '#ffffff'
                        }}
                      >
                        <h6 style={{ color: '#b89dff', marginBottom: '0.5rem' }}>
                          📦 What happens next?
                        </h6>
                        <small>
                          1. Your project will be downloaded from Azure<br/>
                          2. A GitHub repository will be created automatically<br/>
                          3. Your code will be pushed to the new repository<br/>
                          4. You'll be able to deploy it to any platform
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-lg"
                      disabled={loading}
                      style={{
                        backgroundColor: '#6c3fb5',
                        borderColor: '#6c3fb5',
                        color: '#ffffff'
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          {isGitHubUser ? 'Creating...' : 'Creating & Setting Up GitHub...'}
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-light btn-lg"
                      onClick={() => navigate('/projects')}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewProject;