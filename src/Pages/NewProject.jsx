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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    setIsGitHubUser(userData?.userType == 0);

    if (userData?.userType ==0) {
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

    try {
      if (isGitHubUser) {
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
        if (!cloudBucketId || !projectName) {
          setError('Please provide both bucket ID and project name');
          setLoading(false);
          return;
        }

        const importData = {
          blobName: cloudBucketId,
          projectName: projectName,
          userId: user.id
        };

        const response = await apiClient.post('/ftp/import-from-azure', importData);

        if (response.data.success) {
          navigate('/projects');
        } else {
          setError(response.data.message || 'Import failed');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create project');
      console.error(err);
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

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {isGitHubUser ? (
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
                    <div>
                      <div className="mb-4">
                        <label className="form-label" style={{ color: '#ffffff' }}>
                          Project Name
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Enter project name"
                          required
                          style={{
                            backgroundColor: '#1a0033',
                            color: '#ffffff',
                            border: '1px solid #6c3fb5'
                          }}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="form-label" style={{ color: '#ffffff' }}>
                          Cloud Bucket ID / Blob Name
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={cloudBucketId}
                          onChange={(e) => setCloudBucketId(e.target.value)}
                          placeholder="Enter your Azure blob name (e.g., myproject.zip)"
                          required
                          style={{
                            backgroundColor: '#1a0033',
                            color: '#ffffff',
                            border: '1px solid #6c3fb5'
                          }}
                        />
                        <small style={{ color: '#b8a3d9' }}>
                          The name of your ZIP file stored in Azure Blob Storage
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
                          Creating...
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
