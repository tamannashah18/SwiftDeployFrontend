import React, { useState } from 'react';
import { Form, Button, Card, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';

const ConfigurationForm = ({ onSubmit, initialConfig = {}, onBack }) => {
  const [config, setConfig] = useState({
    projectName: initialConfig.projectName || '',
    buildCommand: initialConfig.buildCommand || '',
    outputDirectory: initialConfig.outputDirectory || 'dist',
    installCommand: initialConfig.installCommand || 'npm install',
    nodeVersion: initialConfig.nodeVersion || '18',
    domain: initialConfig.domain || '',
    framework: initialConfig.framework || 'static',
    enableHttps: initialConfig.enableHttps !== undefined ? initialConfig.enableHttps : true,
    environmentVariables: initialConfig.environmentVariables || {},
    redirects: initialConfig.redirects || [],
    headers: initialConfig.headers || []
  });

  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addEnvironmentVariable = () => {
    if (!envKey.trim()) {
      setError('Environment variable key cannot be empty');
      return;
    }
    setConfig(prev => ({
      ...prev,
      environmentVariables: { ...prev.environmentVariables, [envKey]: envValue }
    }));
    setEnvKey('');
    setEnvValue('');
    setError('');
  };

  const removeEnvironmentVariable = (key) => {
    setConfig(prev => {
      const newEnvVars = { ...prev.environmentVariables };
      delete newEnvVars[key];
      return { ...prev, environmentVariables: newEnvVars };
    });
  };

  const addRedirect = () => {
    setConfig(prev => ({
      ...prev,
      redirects: [...prev.redirects, { from: '', to: '', status: 301 }]
    }));
  };

  const updateRedirect = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      redirects: prev.redirects.map((redirect, i) =>
        i === index ? { ...redirect, [field]: value } : redirect
      )
    }));
  };

  const removeRedirect = (index) => {
    setConfig(prev => ({
      ...prev,
      redirects: prev.redirects.filter((_, i) => i !== index)
    }));
  };

  const addHeader = () => {
    setConfig(prev => ({
      ...prev,
      headers: [...prev.headers, { source: '', headers: {} }]
    }));
  };

  const updateHeaderSource = (index, value) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) =>
        i === index ? { ...header, source: value } : header
      )
    }));
  };

  const addHeaderRule = (index, key, value) => {
    if (!key.trim()) return;
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) =>
        i === index ? { ...header, headers: { ...header.headers, [key]: value } } : header
      )
    }));
  };

  const removeHeaderRule = (index, key) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) => {
        if (i === index) {
          const newHeaders = { ...header.headers };
          delete newHeaders[key];
          return { ...header, headers: newHeaders };
        }
        return header;
      })
    }));
  };

  const removeHeader = (index) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!config.projectName.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');
    onSubmit(config);
  };

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '10px' }}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid #6c3fb5',
        marginBottom: '1rem'
      }}>
        <Card.Body>
          <h6 style={{ color: '#b89dff', marginBottom: '1rem' }}>Basic Configuration</h6>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Project Name *</Form.Label>
            <Form.Control
              type="text"
              value={config.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="my-awesome-project"
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Framework</Form.Label>
            <Form.Select
              value={config.framework}
              onChange={(e) => handleInputChange('framework', e.target.value)}
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            >
              <option value="static">Static HTML/CSS/JS</option>
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="angular">Angular</option>
              <option value="nextjs">Next.js</option>
              <option value="nuxtjs">Nuxt.js</option>
              <option value="gatsby">Gatsby</option>
              <option value="svelte">Svelte</option>
            </Form.Select>
          </Form.Group>

        </Card.Body>
      </Card>

      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid #6c3fb5',
        marginBottom: '1rem'
      }}>
        <Card.Body>
          <h6 style={{ color: '#b89dff', marginBottom: '1rem' }}>Build Configuration</h6>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Build Command</Form.Label>
            <Form.Control
              type="text"
              value={config.buildCommand}
              onChange={(e) => handleInputChange('buildCommand', e.target.value)}
              placeholder="npm run build"
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Output Directory</Form.Label>
            <Form.Control
              type="text"
              value={config.outputDirectory}
              onChange={(e) => handleInputChange('outputDirectory', e.target.value)}
              placeholder="dist"
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Install Command</Form.Label>
            <Form.Control
              type="text"
              value={config.installCommand}
              onChange={(e) => handleInputChange('installCommand', e.target.value)}
              placeholder="npm install"
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Node Version</Form.Label>
            <Form.Control
              type="text"
              value={config.nodeVersion}
              onChange={(e) => handleInputChange('nodeVersion', e.target.value)}
              placeholder="18"
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid #6c3fb5',
        marginBottom: '1rem'
      }}>
        <Card.Body>
          <h6 style={{ color: '#b89dff', marginBottom: '1rem' }}>Domain & Security</h6>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: '#ffffff' }}>Custom Domain</Form.Label>
            <Form.Control
              type="text"
              value={config.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              placeholder="example.com"
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                color: '#ffffff'
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Enable HTTPS"
              checked={config.enableHttps}
              onChange={(e) => handleInputChange('enableHttps', e.target.checked)}
              style={{ color: '#ffffff' }}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid #6c3fb5',
        marginBottom: '1rem'
      }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 style={{ color: '#b89dff', margin: 0 }}>Environment Variables</h6>
          </div>

          <div className="mb-3">
            {Object.keys(config.environmentVariables).length > 0 && (
              <div className="mb-3">
                {Object.entries(config.environmentVariables).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      backgroundColor: '#2d1b4e',
                      border: '1px solid #6c3fb5',
                      padding: '10px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '14px' }}>
                      <strong>{key}</strong> = {value}
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeEnvironmentVariable(key)}
                    >
                      <FaTrash size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="KEY"
                style={{
                  backgroundColor: '#2d1b4e',
                  border: '1px solid #6c3fb5',
                  color: '#ffffff',
                  flex: 1
                }}
              />
              <Form.Control
                type="text"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                placeholder="value"
                style={{
                  backgroundColor: '#2d1b4e',
                  border: '1px solid #6c3fb5',
                  color: '#ffffff',
                  flex: 1
                }}
              />
              <Button
                onClick={addEnvironmentVariable}
                style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5' }}
              >
                <FaPlus />
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid #6c3fb5',
        marginBottom: '1rem'
      }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 style={{ color: '#b89dff', margin: 0 }}>Redirects</h6>
            <Button
              size="sm"
              onClick={addRedirect}
              style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5' }}
            >
              <FaPlus /> Add Redirect
            </Button>
          </div>

          {config.redirects.map((redirect, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '10px'
              }}
            >
              <div className="d-flex gap-2 mb-2">
                <Form.Control
                  type="text"
                  value={redirect.from}
                  onChange={(e) => updateRedirect(index, 'from', e.target.value)}
                  placeholder="/old-path"
                  style={{
                    backgroundColor: '#1a0033',
                    border: '1px solid #6c3fb5',
                    color: '#ffffff',
                    flex: 1
                  }}
                />
                <Form.Control
                  type="text"
                  value={redirect.to}
                  onChange={(e) => updateRedirect(index, 'to', e.target.value)}
                  placeholder="/new-path"
                  style={{
                    backgroundColor: '#1a0033',
                    border: '1px solid #6c3fb5',
                    color: '#ffffff',
                    flex: 1
                  }}
                />
                <Form.Select
                  value={redirect.status}
                  onChange={(e) => updateRedirect(index, 'status', parseInt(e.target.value))}
                  style={{
                    backgroundColor: '#1a0033',
                    border: '1px solid #6c3fb5',
                    color: '#ffffff',
                    width: '100px'
                  }}
                >
                  <option value="301">301</option>
                  <option value="302">302</option>
                  <option value="307">307</option>
                  <option value="308">308</option>
                </Form.Select>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeRedirect(index)}
                >
                  <FaTrash />
                </Button>
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>

      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid #6c3fb5',
        marginBottom: '1rem'
      }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 style={{ color: '#b89dff', margin: 0 }}>Custom Headers</h6>
            <Button
              size="sm"
              onClick={addHeader}
              style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5' }}
            >
              <FaPlus /> Add Header Rule
            </Button>
          </div>

          {config.headers.map((header, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#2d1b4e',
                border: '1px solid #6c3fb5',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '10px'
              }}
            >
              <div className="d-flex gap-2 mb-2">
                <Form.Control
                  type="text"
                  value={header.source}
                  onChange={(e) => updateHeaderSource(index, e.target.value)}
                  placeholder="/*"
                  style={{
                    backgroundColor: '#1a0033',
                    border: '1px solid #6c3fb5',
                    color: '#ffffff',
                    flex: 1
                  }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeHeader(index)}
                >
                  <FaTrash />
                </Button>
              </div>

              {Object.entries(header.headers).map(([key, value]) => (
                <div key={key} className="d-flex gap-2 mb-2 align-items-center">
                  <Badge bg="secondary" style={{ minWidth: '150px', textAlign: 'left' }}>{key}</Badge>
                  <span style={{ color: '#ffffff', flex: 1, fontSize: '14px' }}>{value}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeHeaderRule(index, key)}
                  >
                    <FaTrash size={10} />
                  </Button>
                </div>
              ))}

              <div className="d-flex gap-2 mt-2">
                <Form.Control
                  type="text"
                  placeholder="Header-Name"
                  id={`header-key-${index}`}
                  style={{
                    backgroundColor: '#1a0033',
                    border: '1px solid #6c3fb5',
                    color: '#ffffff',
                    flex: 1
                  }}
                />
                <Form.Control
                  type="text"
                  placeholder="Header-Value"
                  id={`header-value-${index}`}
                  style={{
                    backgroundColor: '#1a0033',
                    border: '1px solid #6c3fb5',
                    color: '#ffffff',
                    flex: 1
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const key = document.getElementById(`header-key-${index}`).value;
                    const value = document.getElementById(`header-value-${index}`).value;
                    if (key && value) {
                      addHeaderRule(index, key, value);
                      document.getElementById(`header-key-${index}`).value = '';
                      document.getElementById(`header-value-${index}`).value = '';
                    }
                  }}
                  style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5' }}
                >
                  <FaPlus />
                </Button>
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>

      <div className="d-flex gap-3 mt-4">
        <Button
          onClick={handleSubmit}
          style={{ backgroundColor: '#6c3fb5', borderColor: '#6c3fb5', flex: 1 }}
        >
          Continue to Deploy
        </Button>
        <Button
          variant="outline-light"
          onClick={onBack}
          style={{ flex: 1 }}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationForm;
