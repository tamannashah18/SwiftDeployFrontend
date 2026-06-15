import React, { useState, useEffect, useRef } from 'react';
import NavigationBar from '../Components/NavigationBar';
import SqlUploadCard from '../Components/SqlUploadCard';
import { 
  connectProvider, 
  getConnectedProviders, 
  disconnectProvider, 
  deployDatabase, 
  getUserDeployments, 
  getDeploymentDetails 
} from '../api/databaseDeployments';
import { 
  FaDatabase, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle, 
  FaCopy, 
  FaCheck, 
  FaSync, 
  FaPlug, 
  FaTerminal, 
  FaHistory 
} from 'react-icons/fa';
import '../css/DatabaseDeployments.css';

export const DatabaseDeployments = () => {
  const [activeTab, setActiveTab] = useState('deploy'); // 'integrations', 'deploy', 'history'
  
  // Integrations state
  const [connections, setConnections] = useState({
    railwayConnected: false,
    neonConnected: false
  });
  const [railwayTokenInput, setRailwayTokenInput] = useState('');
  const [neonKeyInput, setNeonKeyInput] = useState('');
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  // Deploy state
  const [selectedProvider, setSelectedProvider] = useState('railway');
  const [dbName, setDbName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [sqlFile, setSqlFile] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  // History state
  const [deployments, setDeployments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState({}); // e.g. { host: true }

  const consoleBodyRef = useRef(null);

  // Load integrations and history on mount
  useEffect(() => {
    fetchIntegrations();
    fetchHistory();
  }, []);

  // Auto-scroll console logs only if user is already at the bottom
  useEffect(() => {
    if (consoleBodyRef.current) {
      const container = consoleBodyRef.current;
      const threshold = 100; // pixels from bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
      
      // Auto-scroll if user is near the bottom or at the start of logging
      if (isNearBottom || consoleLogs.length <= 3) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [consoleLogs]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    try {
      const data = await getConnectedProviders();
      setConnections(data);
    } catch (err) {
      console.error("Failed to load connected providers:", err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await getUserDeployments();
      if (response.success && response.data) {
        setDeployments(response.data);
      }
    } catch (err) {
      console.error("Failed to load deployment history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConnect = async (provider, token) => {
    if (!token) {
      alert("Please enter a valid API key/token.");
      return;
    }
    
    setLoadingIntegrations(true);
    try {
      const res = await connectProvider(provider, token);
      if (res.success) {
        alert(`${provider === 'railway' ? 'Railway' : 'Neon'} account connected successfully!`);
        if (provider === 'railway') setRailwayTokenInput('');
        else setNeonKeyInput('');
        fetchIntegrations();
      }
    } catch (err) {
      alert(err.message || `Failed to connect ${provider} account.`);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${provider === 'railway' ? 'Railway' : 'Neon'} integration?`)) {
      return;
    }

    setLoadingIntegrations(true);
    try {
      const res = await disconnectProvider(provider);
      if (res.success) {
        fetchIntegrations();
      }
    } catch (err) {
      alert(err.message || `Failed to disconnect ${provider} account.`);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleFileSelect = (file) => {
    setSqlFile(file);
  };

  const handleFileClear = () => {
    setSqlFile(null);
  };

  // Polls the most recent deployment status in real-time
  const startLogPolling = () => {
    // Find the latest deployment that is started right now
    let activeDeploymentId = null;

    const interval = setInterval(async () => {
      try {
        // First try to resolve the running deployment ID
        if (!activeDeploymentId) {
          const listRes = await getUserDeployments();
          if (listRes.success && listRes.data && listRes.data.length > 0) {
            // Find the newest deployment that is running
            const latest = listRes.data[0];
            if (latest.status === 'Provisioning' || latest.status === 'Importing') {
              activeDeploymentId = latest.id;
            }
          }
        }

        if (activeDeploymentId) {
          const details = await getDeploymentDetails(activeDeploymentId);
          if (details.success && details.data) {
            setConsoleLogs(details.data.logs || []);
          }
        }
      } catch (err) {
        console.error("Log polling error:", err);
      }
    }, 2000);

    setPollIntervalId(interval);
  };

  const stopLogPolling = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
  };

  const handleDeploy = async (e) => {
    e.preventDefault();

    // Verification
    if (selectedProvider === 'railway' && !connections.railwayConnected) {
      alert("Please connect your Railway account first.");
      return;
    }
    if (selectedProvider === 'neon' && !connections.neonConnected) {
      alert("Please connect your Neon account first.");
      return;
    }

    if (!dbName) {
      alert("Please enter a database name.");
      return;
    }
    if (!sqlFile) {
      alert("Please select a SQL file to import.");
      return;
    }

    setIsDeploying(true);
    setConsoleLogs([
      `[${new Date().toLocaleTimeString()}] Initiating deployment workflow...`,
      `[${new Date().toLocaleTimeString()}] Target Provider: ${selectedProvider.toUpperCase()}`,
      `[${new Date().toLocaleTimeString()}] Database Name: ${dbName}`
    ]);

    // Start background polling for logs
    startLogPolling();

    const formData = new FormData();
    formData.append('Provider', selectedProvider);
    formData.append('DatabaseName', dbName);
    if (projectName) {
      formData.append('ProjectName', projectName);
    }
    formData.append('sqlFile', sqlFile);

    try {
      const response = await deployDatabase(formData);
      stopLogPolling();

      if (response.success && response.data) {
        setConsoleLogs(response.data.logs || []);
        fetchHistory();
        
        if (response.data.status === 'Completed') {
          alert("Database deployed and SQL schema imported successfully!");
          // Open details modal
          setSelectedDeployment(response.data);
          setShowModal(true);
          // Clear inputs
          setDbName('');
          setProjectName('');
          setSqlFile(null);
        } else {
          alert("Deployment finished with failures: " + (response.data.errorMessage || "Unknown error"));
        }
      }
    } catch (err) {
      stopLogPolling();
      const logsToAppend = err.logs || [
        `[${new Date().toLocaleTimeString()}] ❌ Deployment failed.`,
        `[${new Date().toLocaleTimeString()}] Error details: ${err.message || err.details || err}`
      ];
      setConsoleLogs(logsToAppend);
      alert(err.message || "An error occurred during database deployment.");
      fetchHistory();
    } finally {
      setIsDeploying(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await getDeploymentDetails(id);
      if (response.success && response.data) {
        setSelectedDeployment(response.data);
        setShowModal(true);
      }
    } catch (err) {
      alert("Failed to fetch deployment details: " + err.message);
    }
  };

  const handleCopy = (field, value) => {
    navigator.clipboard.writeText(value);
    setCopyStatus(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  return (
    <>
      <NavigationBar />
      <div className="db-page-container">
        <div className="db-content">
          
          <h1 className="mb-4" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Database Deployments
          </h1>

          {/* Tab Navigation */}
          <div className="db-tabs">
            <button 
              className={`db-tab-btn ${activeTab === 'deploy' ? 'active' : ''}`}
              onClick={() => setActiveTab('deploy')}
            >
              <FaDatabase /> Deploy Database
            </button>
            <button 
              className={`db-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('integrations')}
            >
              <FaPlug /> Provider Integrations
            </button>
            <button 
              className={`db-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FaHistory /> Deployment History
            </button>
          </div>

          {/* Tab 1: Deploy Form */}
          {activeTab === 'deploy' && (
            <div className="row">
              <div className="col-lg-6">
                <div className="db-card">
                  <h2 className="db-card-title">
                    <FaDatabase /> Create Database Instance
                  </h2>
                  <form onSubmit={handleDeploy}>
                    
                    <div className="db-input-group">
                      <label>Cloud Database Provider</label>
                      <select 
                        className="db-select" 
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        disabled={isDeploying}
                      >
                        <option value="railway">Railway (MySQL)</option>
                        <option value="neon">Neon (PostgreSQL)</option>
                      </select>
                    </div>

                    <div className="db-input-group">
                      <label>Database Name</label>
                      <input 
                        type="text" 
                        className="db-input" 
                        placeholder="e.g. ecommerce_db"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        required
                        disabled={isDeploying}
                      />
                    </div>

                    <div className="db-input-group">
                      <label>Project Name (Optional)</label>
                      <input 
                        type="text" 
                        className="db-input" 
                        placeholder="Default auto-generated name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        disabled={isDeploying}
                      />
                    </div>

                    <SqlUploadCard 
                      selectedFile={sqlFile}
                      onFileSelect={handleFileSelect}
                      onFileClear={handleFileClear}
                      disabled={isDeploying}
                    />

                    {selectedProvider === 'railway' && !connections.railwayConnected && (
                      <div className="alert alert-warning py-2 px-3 mt-3" style={{ fontSize: '0.85rem' }}>
                        <FaInfoCircle className="me-1" /> Please connect your Railway account first.
                      </div>
                    )}
                    {selectedProvider === 'neon' && !connections.neonConnected && (
                      <div className="alert alert-warning py-2 px-3 mt-3" style={{ fontSize: '0.85rem' }}>
                        <FaInfoCircle className="me-1" /> Please connect your Neon account first.
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn-db-primary w-100 mt-3"
                      disabled={
                        isDeploying || 
                        (selectedProvider === 'railway' && !connections.railwayConnected) ||
                        (selectedProvider === 'neon' && !connections.neonConnected)
                      }
                    >
                      {isDeploying ? (
                        <>
                          <FaSync className="spinner-border spinner-border-sm me-2 border-0" style={{ animation: 'spin 1.5s linear infinite' }} />
                          Deploying database...
                        </>
                      ) : (
                        "Start Deployment"
                      )}
                    </button>

                  </form>
                </div>
              </div>

              {/* Live Terminal Console Logs */}
              <div className="col-lg-6">
                <div className="terminal-container">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <span className="dot red"></span>
                      <span className="dot yellow"></span>
                      <span className="dot green"></span>
                    </div>
                    <span className="terminal-title">
                      <FaTerminal className="me-1" /> deployment_logs.log
                    </span>
                    <div></div>
                  </div>
                  <div className="terminal-body" ref={consoleBodyRef} style={{ minHeight: '350px' }}>
                    {consoleLogs.length === 0 ? (
                      <div style={{ color: '#b8a3d9', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        Waiting to trigger database deployment...
                      </div>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <div key={idx}>{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Integrations */}
          {activeTab === 'integrations' && (
            <div className="integration-grid">
              
              {/* Railway Card */}
              <div className="db-card d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="db-card-title mb-0">
                      <span className="provider-tag railway">Railway</span> MySQL
                    </h2>
                    <span className={`status-badge ${connections.railwayConnected ? 'connected' : 'disconnected'}`}>
                      {connections.railwayConnected ? <><FaCheckCircle /> Connected</> : <><FaTimesCircle /> Disconnected</>}
                    </span>
                  </div>
                  <p className="text-muted-custom" style={{ fontSize: '0.9rem' }}>
                    Deploy persistent MySQL instance containers. Enter your Railway Personal API Token to connect your account.
                  </p>
                </div>

                <div className="mt-4">
                  {!connections.railwayConnected ? (
                    <div className="d-flex flex-column gap-2">
                      <input 
                        type="password"
                        className="db-input"
                        placeholder="Enter Railway API Token (railway_...)"
                        value={railwayTokenInput}
                        onChange={(e) => setRailwayTokenInput(e.target.value)}
                        disabled={loadingIntegrations}
                      />
                      <button 
                        className="btn-db-primary w-100"
                        onClick={() => handleConnect('railway', railwayTokenInput)}
                        disabled={loadingIntegrations || !railwayTokenInput}
                      >
                        Connect Account
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn-db-danger w-100"
                      onClick={() => handleDisconnect('railway')}
                      disabled={loadingIntegrations}
                    >
                      Disconnect Provider
                    </button>
                  )}
                </div>
              </div>

              {/* Neon Card */}
              <div className="db-card d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="db-card-title mb-0">
                      <span className="provider-tag neon">Neon</span> Postgres
                    </h2>
                    <span className={`status-badge ${connections.neonConnected ? 'connected' : 'disconnected'}`}>
                      {connections.neonConnected ? <><FaCheckCircle /> Connected</> : <><FaTimesCircle /> Disconnected</>}
                    </span>
                  </div>
                  <p className="text-muted-custom" style={{ fontSize: '0.9rem' }}>
                    Deploy serverless PostgreSQL instances. Enter your Neon API Key to connect your account.
                  </p>
                </div>

                <div className="mt-4">
                  {!connections.neonConnected ? (
                    <div className="d-flex flex-column gap-2">
                      <input 
                        type="password"
                        className="db-input"
                        placeholder="Enter Neon API Key"
                        value={neonKeyInput}
                        onChange={(e) => setNeonKeyInput(e.target.value)}
                        disabled={loadingIntegrations}
                      />
                      <button 
                        className="btn-db-primary w-100"
                        onClick={() => handleConnect('neon', neonKeyInput)}
                        disabled={loadingIntegrations || !neonKeyInput}
                      >
                        Connect Account
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn-db-danger w-100"
                      onClick={() => handleDisconnect('neon')}
                      disabled={loadingIntegrations}
                    >
                      Disconnect Provider
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: History */}
          {activeTab === 'history' && (
            <div className="db-card">
              <h2 className="db-card-title">
                <FaHistory /> Deployment History
              </h2>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <FaSync className="spinner-border spinner-border-sm me-2 border-0" style={{ animation: 'spin 1.5s linear infinite' }} />
                  Loading deployment history...
                </div>
              ) : deployments.length === 0 ? (
                <div className="text-center py-4 text-muted-custom">
                  No database deployments found. Create one from the "Deploy Database" tab.
                </div>
              ) : (
                <div className="db-table-container">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Database Name</th>
                        <th>Provider</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployments.map((d) => (
                        <tr key={d.Id || d.id}>
                          <td>{d.databaseName || d.DatabaseName}</td>
                          <td style={{ textTransform: 'capitalize' }}>{d.provider || d.Provider}</td>
                          <td>
                            <span className={`status-badge ${d.status?.toLowerCase() || d.Status?.toLowerCase()}`}>
                              {d.status === 'Completed' ? <FaCheckCircle /> : d.status === 'Failed' ? <FaTimesCircle /> : <FaSync className="spinner-border spinner-border-sm border-0 me-1" style={{ animation: 'spin 1.5s linear infinite', width: '10px', height: '10px' }} />}
                              {d.status || d.Status}
                            </span>
                          </td>
                          <td>{new Date(d.createdAt || d.CreatedAt).toLocaleDateString()}</td>
                          <td>
                            {(d.status === 'Completed' || d.Status === 'Completed' ||
                              d.status === 'Failed'    || d.Status === 'Failed') ? (
                              <button 
                                className="btn-db-primary" 
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => handleViewDetails(d.id || d.Id)}
                              >
                                View Details
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#b8a3d9' }}>In Progress...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Details Modal */}
          {showModal && selectedDeployment && (
            <div className="db-modal-overlay">
              <div className="db-modal">
                
                <div className="db-modal-header">
                  <h3 className="db-modal-title">
                    <span style={{ textTransform: 'capitalize' }}>{selectedDeployment.provider}</span>
                    {' '}({selectedDeployment.provider === 'railway' ? 'MySQL' : 'PostgreSQL'}) Connection Details
                  </h3>
                  <button className="db-modal-close" onClick={() => setShowModal(false)}>&times;</button>
                </div>

                <div className="db-modal-body">

                  {/* Show error info for Failed deployments */}
                  {selectedDeployment.status === 'Failed' && (
                    <>
                      {selectedDeployment.errorMessage && (
                        <div style={{
                          background: 'rgba(220,53,69,0.1)',
                          border: '1px solid rgba(220,53,69,0.3)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem',
                          color: '#dc3545',
                          fontSize: '0.9rem'
                        }}>
                          <strong>❌ Deployment Failed:</strong> {selectedDeployment.errorMessage}
                        </div>
                      )}
                      {selectedDeployment.logs?.length > 0 && (
                        <div style={{
                          background: '#0b0216',
                          border: '1px solid #3d2569',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: '#a8ffa2',
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}>
                          <div style={{ color: '#b8a3d9', marginBottom: '0.5rem', fontWeight: 600 }}>Last deployment logs:</div>
                          {selectedDeployment.logs.slice(-15).map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Show connection credentials for Completed deployments */}
                  {selectedDeployment.status === 'Completed' && (
                    <>
                  <div className="credential-row">
                    <div className="credential-info">
                      <span className="credential-label">Host</span>
                      <span className="credential-value">{selectedDeployment.host}</span>
                    </div>
                    <button 
                      className={`btn-copy ${copyStatus.host ? 'copied' : ''}`}
                      onClick={() => handleCopy('host', selectedDeployment.host)}
                    >
                      {copyStatus.host ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                    </button>
                  </div>

                  <div className="credential-row">
                    <div className="credential-info">
                      <span className="credential-label">Port</span>
                      <span className="credential-value">{selectedDeployment.port}</span>
                    </div>
                    <button 
                      className={`btn-copy ${copyStatus.port ? 'copied' : ''}`}
                      onClick={() => handleCopy('port', selectedDeployment.port)}
                    >
                      {copyStatus.port ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                    </button>
                  </div>

                  <div className="credential-row">
                    <div className="credential-info">
                      <span className="credential-label">Username</span>
                      <span className="credential-value">{selectedDeployment.username}</span>
                    </div>
                    <button 
                      className={`btn-copy ${copyStatus.username ? 'copied' : ''}`}
                      onClick={() => handleCopy('username', selectedDeployment.username)}
                    >
                      {copyStatus.username ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                    </button>
                  </div>

                  <div className="credential-row">
                    <div className="credential-info">
                      <span className="credential-label">Password</span>
                      <span className="credential-value">{selectedDeployment.password}</span>
                    </div>
                    <button 
                      className={`btn-copy ${copyStatus.password ? 'copied' : ''}`}
                      onClick={() => handleCopy('password', selectedDeployment.password)}
                    >
                      {copyStatus.password ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                    </button>
                  </div>

                  <div className="credential-row">
                    <div className="credential-info">
                      <span className="credential-label">Connection String</span>
                      <span className="credential-value">{selectedDeployment.connectionString}</span>
                    </div>
                    <button 
                      className={`btn-copy ${copyStatus.connStr ? 'copied' : ''}`}
                      onClick={() => handleCopy('connStr', selectedDeployment.connectionString)}
                    >
                      {copyStatus.connStr ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                    </button>
                  </div>
                    </>
                  )}

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Keyframe rotation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default DatabaseDeployments;
