import React, { useState, useEffect } from "react";
import "../css/Projects.css";
import { NavigationBar } from "../Components/NavigationBar";
import { useNavigate } from "react-router-dom";
import { getUserProjects, deleteProject } from "../api/deployments";
import { getGitHubRepositories } from "../api/projects";

function RepoDropdown({ repos, selectedRepo, onSelect }) {
  const [open, setOpen] = useState(false);

  const displayName = selectedRepo ? selectedRepo.split("/")[1] : "-- Select a repo --";

  return (
    <div className="custom-dropdown">
      <div
        className="dropdown-selected"
        onClick={() => setOpen(!open)}
      >
        {displayName}
        <span className="dropdown-arrow">▼</span>
      </div>

      {open && (
        <div className="dropdown-list">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="dropdown-item"
              onClick={() => {
                onSelect(`${repo.owner.login}/${repo.name}`);
                setOpen(false);
              }}
            >
              {repo.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        const data = await getUserProjects(user.id);
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!modalOpen) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getGitHubRepositories();
        setRepos(data);
      } catch (err) {
        console.error('Failed to fetch repositories:', err);
        setError(err.message || 'Failed to fetch repositories');
        if (err.message?.includes('Session') || err.message?.includes('Unauthorized')) {
          setTimeout(() => {
            setModalOpen(false);
            navigate('/login');
          }, 1500);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [modalOpen, navigate]);

  const handleAddProject = () => {
    if (!selectedRepo) return alert("Please select a repository");
    setModalOpen(false);
    navigate('/new-project', { state: { selectedRepo } });
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.projectId !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project');
    }
  };

  return (
    <div className="projects-page">
      <NavigationBar />

      <div className="projects-main">
        <div className="header-row">
          <h2>Your Projects</h2>
          <button className="new-project-btn" onClick={() => navigate('/new-project')}>
            + New Project
          </button>
        </div>

        <div className="projects-grid">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <p>No projects yet. Click "+ New Project" to add one.</p>
          ) : (
            projects.map((proj) => (
              <div
                className="project-card"
                key={proj.projectId}
                onClick={() => navigate(`/project/${proj.projectId}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-title">{proj.projectName}</div>
                <div className="project-desc">{proj.description || 'No description'}</div>
                <div className="project-info-row">
                  <span className="project-updated">{proj.platform}</span>
                  <span className={`badge bg-${proj.status === 'Completed' ? 'success' : proj.status === 'Failed' ? 'danger' : 'warning'}`}>
                    {proj.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Projects;
