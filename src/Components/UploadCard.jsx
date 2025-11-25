import React, { useState, useRef } from 'react';
import { FaUpload, FaFileArchive, FaCheckCircle } from 'react-icons/fa';

function UploadCard({ onFileUpload }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile);
    } else {
      alert('Please upload a ZIP file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile);
    } else {
      alert('Please upload a ZIP file');
    }
  };

  const handleUpload = () => {
    if (file) {
      onFileUpload(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="card border-2 border-dashed">
      <div className="card-body p-5">
        <div
          className={`text-center ${isDragging ? 'bg-light' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            padding: '40px',
            borderRadius: '10px',
            transition: 'all 0.3s',
          }}
        >
          {!file ? (
            <>
              <FaUpload size={64} className="text-primary mb-3" />
              <h4 className="mb-3">Upload Your Project</h4>
              <p className="text-muted mb-4">
                Drag and drop your ZIP file here, or click to browse
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".zip"
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => fileInputRef.current.click()}
              >
                Choose File
              </button>
              <div className="mt-3">
                <small className="text-muted">
                  Maximum file size: 100MB • Accepts: .zip
                </small>
              </div>
            </>
          ) : (
            <>
              <FaCheckCircle size={64} className="text-success mb-3" />
              <h4 className="mb-3">File Ready</h4>
              <div className="bg-light p-3 rounded mb-4">
                <div className="d-flex align-items-center justify-content-center">
                  <FaFileArchive size={24} className="text-warning me-2" />
                  <div>
                    <div className="fw-bold">{file.name}</div>
                    <small className="text-muted">{formatFileSize(file.size)}</small>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-success" onClick={handleUpload}>
                  Continue with this file
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setFile(null);
                    fileInputRef.current.value = '';
                  }}
                >
                  Choose Different File
                </button>
              </div>
            </>
          )}
        </div>

        <div className="alert alert-info mt-4 mb-0" role="alert">
          <small>
            <strong>Note:</strong> Your project should be a complete ZIP archive containing all source files.
            SwiftDeploy will automatically detect your framework and configure deployment settings.
          </small>
        </div>
      </div>
    </div>
  );
}

export default UploadCard;
