import React, { useMemo } from 'react';
import { Modal, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaGithub, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import ConfigViewer from './ConfigViewer';
import '../css/ConfigRegenModal.css';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal line-diff: returns array of { type: 'same'|'add'|'remove', text }
// We simply flag every line that changed between current and preview.
// ─────────────────────────────────────────────────────────────────────────────
function computeDiff(currentText, newText) {
  const currentLines = (currentText || '').split('\n');
  const newLines     = (newText     || '').split('\n');

  const currentSet = new Set(currentLines.map(l => l.trim()));
  const newSet     = new Set(newLines.map(l => l.trim()));

  // Changed lines (lines in new but not in current, and vice versa)
  const removedLines = currentLines.filter(l => !newSet.has(l.trim()));
  const addedLines   = newLines.filter(l => !currentSet.has(l.trim()));

  return { removedLines, addedLines, totalChanges: removedLines.length + addedLines.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfigRegenModal
//
// Props:
//   show             boolean        — controls visibility
//   onHide           ()=>void       — close without regenerating
//   onConfirm        ()=>void       — called when user clicks "Regenerate"
//   fileName         string         — e.g. "vercel.json"
//   currentContent   string|null    — live file content from GitHub
//   previewContent   string|null    — what the new file will look like
//   loading          boolean        — true while preview is being fetched
//   regenerating     boolean        — true while the commit is in progress
//   error            string|null    — error message if preview failed
// ─────────────────────────────────────────────────────────────────────────────
const ConfigRegenModal = ({
  show,
  onHide,
  onConfirm,
  fileName,
  currentContent,
  previewContent,
  loading,
  regenerating,
  error,
}) => {
  const diff = useMemo(() => {
    if (!currentContent || !previewContent) return null;
    return computeDiff(currentContent, previewContent);
  }, [currentContent, previewContent]);

  const ext = fileName?.split('.').pop()?.toLowerCase() ?? '';

  const langLabel = {
    json:  'JSON',
    toml:  'TOML',
    yml:   'YAML',
    yaml:  'YAML',
    dockerfile: 'Dockerfile',
  }[ext] ?? ext.toUpperCase();

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      contentClassName="config-regen-modal-content"
      dialogClassName="config-regen-modal-dialog"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Modal.Header className="config-regen-modal-header" closeButton>
        <Modal.Title className="config-regen-modal-title">
          <span className="crm-icon">↺</span>
          Regenerate <code className="crm-filename">{fileName}</code>
          <Badge className="crm-lang-badge">{langLabel}</Badge>
        </Modal.Title>
      </Modal.Header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <Modal.Body className="config-regen-modal-body">

        {/* Safety notice */}
        <div className="crm-notice">
          <FaCheckCircle className="crm-notice-icon crm-notice-icon--safe" />
          <span>
            <strong>Safe regeneration:</strong> Your existing deployment settings (build commands, output directory,
            framework) are read from the live file and preserved in the new version.
          </span>
        </div>

        {error && (
          <Alert variant="danger" className="mt-3 mb-2" style={{ fontSize: '0.85rem' }}>
            <FaExclamationTriangle className="me-2" />
            <strong>Could not load preview:</strong> {error}
          </Alert>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="crm-loading">
            <Spinner animation="border" style={{ color: '#8b5cf6' }} />
            <p>Loading preview of regenerated file…</p>
          </div>
        )}

        {/* Diff summary */}
        {!loading && diff && diff.totalChanges > 0 && (
          <div className="crm-diff-summary">
            <span className="crm-diff-added">+{diff.addedLines.length} line{diff.addedLines.length !== 1 ? 's' : ''} added</span>
            <span className="crm-diff-divider">·</span>
            <span className="crm-diff-removed">−{diff.removedLines.length} line{diff.removedLines.length !== 1 ? 's' : ''} removed</span>
          </div>
        )}
        {!loading && diff && diff.totalChanges === 0 && !error && (
          <div className="crm-diff-summary crm-diff-identical">
            <FaCheckCircle style={{ marginRight: 6, color: '#86efac' }} />
            The regenerated file is identical to the current version — committing will have no effect.
          </div>
        )}

        {/* Side-by-side viewer */}
        {!loading && !error && (
          <div className="crm-panels">
            {/* Left — current */}
            <div className="crm-panel">
              <div className="crm-panel-header crm-panel-header--current">
                <FaGithub size={13} style={{ marginRight: 6 }} />
                Current file
                <span className="crm-panel-badge">In Repo</span>
              </div>
              <div className="crm-panel-body">
                {currentContent
                  ? <ConfigViewer content={currentContent} fileName={fileName} height="100%" />
                  : <div className="crm-panel-empty">File not yet in repository</div>
                }
              </div>
            </div>

            {/* Right — preview */}
            <div className="crm-panel">
              <div className="crm-panel-header crm-panel-header--new">
                <span style={{ marginRight: 6 }}>↺</span>
                New file <span style={{ opacity: 0.6, fontSize: '0.72rem' }}>(preview)</span>
                <span className="crm-panel-badge crm-panel-badge--new">Generated</span>
              </div>
              <div className="crm-panel-body">
                {previewContent
                  ? <ConfigViewer content={previewContent} fileName={fileName} height="100%" />
                  : <div className="crm-panel-empty">No preview available</div>
                }
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Modal.Footer className="config-regen-modal-footer">
        <Button variant="outline-secondary" onClick={onHide} disabled={regenerating}
          className="crm-btn-cancel">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading || regenerating || !!error}
          className="crm-btn-confirm"
        >
          {regenerating
            ? <><Spinner animation="border" size="sm" className="me-2" /> Committing…</>
            : '↺ Regenerate & Commit'
          }
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfigRegenModal;
