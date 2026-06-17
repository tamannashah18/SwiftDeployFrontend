import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Copy, Check, Search, X, ExternalLink, Terminal } from 'lucide-react';
import apiClient from '../api/apiClient';
import { getPlatformLogs } from '../api/deployments';
import '../css/Logs.css';

const LOG_LEVELS = [
  { label: 'ALL', value: null },
  { label: 'INFO', value: 'info' },
  { label: 'WARN', value: 'warn' },
  { label: 'ERROR', value: 'error' },
  { label: 'SUCCESS', value: 'success' },
];

const getLogType = (log) => {
  if (log.level === 2 || log.level === 'Warning') return 'warn';
  if (log.level === 3 || log.level === 4 || log.level === 'Error' || log.level === 'Critical') return 'error';
  if (log.status === 6 || log.status === 'Completed') return 'success';
  return 'info';
};

const isLinkMessage = (msg) =>
  msg?.startsWith('http') ||
  msg?.includes('pages.dev') ||
  msg?.includes('vercel.app') ||
  msg?.includes('netlify.app') ||
  msg?.includes('render.com') ||
  msg?.includes('cloudflare');

const TERMINAL_STATUSES = ['completed', 'failed', 'success'];

const buildStepNames = ['Uploading', 'Processing', 'CreatingRepo', 'PushingCode', 'GeneratingConfig'];

const LogEntryComponent = ({ log }) => {
  const [copied, setCopied] = useState(false);
  const type = getLogType(log);
  const isLink = isLinkMessage(log.message);

  const handleCopy = () => {
    navigator.clipboard.writeText(log.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={`log-entry log-${type}`}>
      <div className="log-left-border" />
      <span className={`log-badge log-badge-${type}`}>{type.toUpperCase()}</span>
      <span className="log-timestamp">{formattedTime}</span>
      <span className="log-message-content">
        {isLink ? (
          <a
            href={log.message.includes('https://') ? log.message : `https://${log.message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="log-link"
          >
            {log.message}
          </a>
        ) : (
          log.message
        )}
      </span>
      <button className="log-copy-btn" onClick={handleCopy} title="Copy message">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
};

const SkeletonLog = () => (
  <div className="skeleton-log">
    <div className="skeleton-badge" />
    <div className="skeleton-timestamp" />
    <div className="skeleton-message" />
  </div>
);

const DeploymentLogsEmbedded = ({ deploymentId, platform: platformProp }) => {
  const [buildLogsOpen, setBuildLogsOpen] = useState(true);
  const [deploymentLogsOpen, setDeploymentLogsOpen] = useState(true);
  const [platformLogsOpen, setPlatformLogsOpen] = useState(true);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Platform (Netlify/Vercel) live build logs
  const [platformLogs, setPlatformLogs] = useState([]);
  const [platformLogsLoading, setPlatformLogsLoading] = useState(false);
  const [platformLogsError, setPlatformLogsError] = useState('');
  const [platformDeployState, setPlatformDeployState] = useState('');
  const [platformDeployUrl, setPlatformDeployUrl] = useState('');
  const platformPollingRef = useRef(null);

  const [platform, setPlatform] = useState(platformProp || '');
  const [status, setStatus] = useState('');

  const [filterLevel, setFilterLevel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const userScrolledUp = useRef(false);
  const pollingRef = useRef(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 80;
  };

  const scrollToBottom = useCallback(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const fetchLogs = useCallback(async (showLoading = false) => {
    if (!deploymentId) return;
    if (showLoading) setLoading(true);
    try {
      const response = await apiClient.get(`/logs/deployment/${deploymentId}`);
      const data = response.data?.success ? (response.data.logs || []) : (response.data || []);
      setLogs(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load deployment logs.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [deploymentId]);

  const fetchDeploymentInfo = useCallback(async () => {
    if (!deploymentId) return;
    try {
      const response = await apiClient.get(`/deployments/${deploymentId}`);
      if (response.data) {
        setPlatform(response.data.platform || platformProp || '');
        setStatus(response.data.status || '');
      }
    } catch (err) {
      console.warn('Failed to fetch deployment info:', err);
    }
  }, [deploymentId, platformProp]);

  const fetchPlatformLogs = useCallback(async () => {
    if (!deploymentId) return;
    try {
      const data = await getPlatformLogs(deploymentId);
      if (data.logs && Array.isArray(data.logs)) {
        setPlatformLogs(data.logs);
      }
      if (data.deployState) setPlatformDeployState(data.deployState);
      if (data.deployUrl)   setPlatformDeployUrl(data.deployUrl);
      if (!data.success && data.error) {
        setPlatformLogsError(data.error);
      } else {
        setPlatformLogsError('');
      }
    } catch (err) {
      console.warn('Platform logs fetch error:', err);
    }
  }, [deploymentId]);

  useEffect(() => {
    if (!deploymentId) {
      setLoading(false);
      return;
    }

    fetchDeploymentInfo();
    fetchLogs(true);

    setTimeout(() => {
      setPlatformLogsLoading(true);
      fetchPlatformLogs().finally(() => setPlatformLogsLoading(false));
    }, 800);

    pollingRef.current = setInterval(async () => {
      await fetchDeploymentInfo();
      await fetchLogs(false);
    }, 4000);

    platformPollingRef.current = setInterval(() => {
      fetchPlatformLogs();
    }, 6000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(platformPollingRef.current);
    };
  }, [deploymentId, fetchDeploymentInfo, fetchLogs, fetchPlatformLogs]);

  useEffect(() => {
    if (status && TERMINAL_STATUSES.includes(status.toLowerCase())) {
      clearInterval(pollingRef.current);
      clearInterval(platformPollingRef.current);
    }
  }, [status]);

  const totalErrors = logs.filter(l => getLogType(l) === 'error').length;
  const totalWarnings = logs.filter(l => getLogType(l) === 'warn').length;
  const isLive = status && !TERMINAL_STATUSES.includes(status.toLowerCase());

  const applyFilters = (logList) =>
    logList.filter(log => {
      const type = getLogType(log);
      const levelMatch = !filterLevel || type === filterLevel;
      const searchMatch = !searchQuery || log.message?.toLowerCase().includes(searchQuery.toLowerCase());
      return levelMatch && searchMatch;
    });

  const getBuildLogs = () =>
    logs.filter(log => {
      const statusStr = log.status?.toString() || '';
      return buildStepNames.some(s => statusStr.includes(s)) ||
        log.message?.toLowerCase().includes('git') ||
        log.message?.toLowerCase().includes('extract');
    });

  const getDeployLogs = () =>
    logs.filter(log => {
      const statusStr = log.status?.toString() || '';
      return !buildStepNames.some(s => statusStr.includes(s)) &&
        !log.message?.toLowerCase().includes('git') &&
        !log.message?.toLowerCase().includes('extract');
    });

  const displayBuildLogs = applyFilters(getBuildLogs());
  const displayDeployLogs = applyFilters(getDeployLogs());

  const getStatusClass = (s) => {
    const v = s?.toLowerCase() || '';
    if (v === 'completed' || v === 'success') return 'status-completed';
    if (v === 'failed') return 'status-failed';
    if (v === 'queued') return 'status-queued';
    return 'status-processing';
  };

  const getPlatformColor = (p) => {
    const map = { netlify: '#00ad9f', vercel: '#ffffff', cloudflare: '#f6821f', render: '#46e3b7' };
    return map[p?.toLowerCase()] || '#8b5cf6';
  };

  if (!deploymentId) {
    return (
      <div className="logs-empty-state py-5">
        No active or historical deployment logs found. Trigger a deployment first.
      </div>
    );
  }

  return (
    <div className="logs-main-embedded" style={{ padding: 0 }}>
      {/* ── Header Info Block ─────────────────────────────────────────────────── */}
      <div className="logs-header" style={{ position: 'static', padding: '1rem 0 0 0', background: 'transparent', borderBottom: 'none' }}>
        <div className="logs-header-top">
          <div className="logs-title-row">
            <div className="logs-title-group">
              <h4 className="mb-0" style={{ color: '#ffffff' }}>Deployment Logs</h4>
              {platform && (
                <span
                  className="logs-platform-tag"
                  style={{ '--platform-color': getPlatformColor(platform) }}
                >
                  {platform.toUpperCase()}
                </span>
              )}
              {isLive && (
                <span className="logs-live-badge">
                  <span className="live-dot" />
                  LIVE
                </span>
              )}
            </div>
          </div>

          <div className="logs-header-actions">
            <div className={`logs-status-badge ${getStatusClass(status)}`}>
              {status ? status.toUpperCase() : 'PROCESSING'}
            </div>
            <button
              className="logs-action-btn logs-refresh-btn"
              onClick={() => fetchLogs(true)}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
        <div className="logs-stats-bar">
          <div className="stat-chip stat-total">
            <span className="stat-value">{logs.length}</span>
            <span className="stat-label">Total Logs</span>
          </div>
          <div className="stat-chip stat-error">
            <span className="stat-value">{totalErrors}</span>
            <span className="stat-label">Errors</span>
          </div>
          <div className="stat-chip stat-warning">
            <span className="stat-value">{totalWarnings}</span>
            <span className="stat-label">Warnings</span>
          </div>
          <div className="stat-chip stat-success">
            <span className="stat-value">{logs.length - totalErrors - totalWarnings}</span>
            <span className="stat-label">Info / Success</span>
          </div>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
        <div className="logs-filter-bar">
          <div className="logs-search-box" style={{ maxWidth: '100%' }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search log messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="logs-search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <div className="logs-level-filters">
            {LOG_LEVELS.map(({ label, value }) => (
              <button
                key={label}
                className={`level-filter-btn level-${(value || 'all')} ${filterLevel === value ? 'active' : ''}`}
                onClick={() => setFilterLevel(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error Alert ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="logs-error-alert" style={{ margin: '1rem 0' }}>
          <X size={16} />
          {error}
        </div>
      )}

      {/* ── Log Sections ──────────────────────────────────────────────────────── */}
      <div
        className="logs-body-embedded"
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight: '600px',
          overflowY: 'auto',
          marginTop: '1rem',
          border: '1px solid rgba(108, 63, 181, 0.25)',
          borderRadius: '12px',
          background: 'rgba(16, 1, 28, 0.5)',
          padding: '1rem'
        }}
      >
        {/* Preparation & Build Logs */}
        <div className="log-section">
          <button
            className="log-section-header"
            onClick={() => setBuildLogsOpen(o => !o)}
          >
            {buildLogsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>PREPARATION &amp; BUILD LOGS</span>
            <span className="section-count">{displayBuildLogs.length}</span>
          </button>

          {buildLogsOpen && (
            <div className="log-entries">
              {loading && displayBuildLogs.length === 0 ? (
                <>
                  <SkeletonLog /><SkeletonLog /><SkeletonLog />
                </>
              ) : displayBuildLogs.length === 0 ? (
                <div className="logs-empty-state">
                  No preparation logs captured yet.
                </div>
              ) : (
                displayBuildLogs.map((log, idx) => (
                  <LogEntryComponent key={log.id || idx} log={log} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Platform Deployment Logs */}
        <div className="log-section">
          <button
            className="log-section-header"
            onClick={() => setDeploymentLogsOpen(o => !o)}
          >
            {deploymentLogsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>PLATFORM DEPLOYMENT LOGS</span>
            <span className="section-count">{displayDeployLogs.length}</span>
          </button>

          {deploymentLogsOpen && (
            <div className="log-entries">
              {loading && displayDeployLogs.length === 0 ? (
                <>
                  <SkeletonLog /><SkeletonLog /><SkeletonLog />
                </>
              ) : displayDeployLogs.length === 0 ? (
                <div className="logs-empty-state">
                  No platform deployment logs captured yet.
                </div>
              ) : (
                displayDeployLogs.map((log, idx) => (
                  <LogEntryComponent key={log.id || idx} log={log} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Live Platform Build Logs */}
        <div className="log-section log-section-platform">
          <button
            className="log-section-header log-section-header-platform"
            onClick={() => setPlatformLogsOpen(o => !o)}
          >
            {platformLogsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Terminal size={13} style={{ opacity: 0.8 }} />
            <span>LIVE {platform ? platform.toUpperCase() : 'PLATFORM'} BUILD LOGS</span>
            {platformDeployState && (
              <span className={`platform-deploy-state platform-state-${platformDeployState}`}>
                {platformDeployState.toUpperCase()}
              </span>
            )}
            {platformDeployUrl && (
              <a
                href={platformDeployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-deploy-link"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={11} />
                View Site
              </a>
            )}
            <span className="section-count" style={{ marginLeft: platformDeployUrl ? '0' : 'auto' }}>
              {platformLogs.length}
            </span>
          </button>

          {platformLogsOpen && (
            <div className="log-entries">
              {platformLogsError ? (
                <div className="platform-logs-notice">
                  <span className="platform-notice-icon">ⓘ</span>
                  {platformLogsError}
                </div>
              ) : platformLogsLoading && platformLogs.length === 0 ? (
                <>
                  <SkeletonLog /><SkeletonLog /><SkeletonLog />
                </>
              ) : platformLogs.length === 0 ? (
                <div className="logs-empty-state">
                  No {platform || 'platform'} build logs available yet.
                </div>
              ) : (
                platformLogs.map((log, idx) => (
                  <LogEntryComponent
                    key={idx}
                    log={{
                      message: log.message,
                      timestamp: log.timestamp || new Date().toISOString(),
                      level: log.level,
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default DeploymentLogsEmbedded;
