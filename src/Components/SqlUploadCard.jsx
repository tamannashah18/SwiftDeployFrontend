import React, { useRef, useState } from 'react';
import { FaDatabase, FaRegFileAlt, FaTimes } from 'react-icons/fa';

export const SqlUploadCard = ({ selectedFile, onFileSelect, onFileClear }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const validateAndSelectFile = (file) => {
    if (!file.name.endsWith('.sql')) {
      alert("Invalid file type. Only SQL schema files (.sql) are supported.");
      return;
    }
    onFileSelect(file);
  };

  const triggerInputClick = () => {
    fileInputRef.current.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="db-input-group">
      <label>SQL Schema File</label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {!selectedFile ? (
        <div
          className={`upload-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInputClick}
        >
          <FaDatabase className="upload-icon mb-2" />
          <p className="mb-1" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            Drag & drop your SQL file here, or click to browse
          </p>
          <span style={{ fontSize: '0.8rem', color: '#b8a3d9' }}>
            Only .sql files are accepted
          </span>
        </div>
      ) : (
        <div className="credential-row" style={{ backgroundColor: '#1a0033', border: '1px solid #6c3fb5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <FaRegFileAlt style={{ color: '#b8a3d9', fontSize: '1.5rem', flexShrink: 0 }} />
            <div className="credential-info">
              <span className="credential-value" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {selectedFile.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#b8a3d9' }}>
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-copy" 
            onClick={onFileClear}
            style={{ borderColor: '#dc3545', color: '#dc3545', padding: '0.35rem 0.5rem' }}
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
};

export default SqlUploadCard;
