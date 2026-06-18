import React, { useState } from 'react';
import { Form, Button, Card, Badge, Alert, Row, Col } from 'react-bootstrap';
import { FaPlus, FaTrash, FaCog, FaServer, FaGlobe, FaCode, FaLock } from 'react-icons/fa';
import '../css/ConfigurationForm.css';

const ConfigurationForm = ({ onSubmit, initialConfig = {}, onBack, selectedPlatform }) => {
  const getFrameworkDefaults = (fw) => {
    switch (fw) {
      case 'react': return { buildCmd: 'npm run build', outDir: 'build', installCmd: 'npm install', type: 'Framework' };
      case 'vue': return { buildCmd: 'npm run build', outDir: 'dist', installCmd: 'npm install', type: 'Framework' };
      case 'angular': return { buildCmd: 'npm run build', outDir: 'dist', installCmd: 'npm install', type: 'Framework' };
      case 'nextjs': return { buildCmd: 'npm run build', outDir: 'out', installCmd: 'npm install', type: 'Framework' };
      case 'nuxtjs': return { buildCmd: 'npm run build', outDir: 'dist', installCmd: 'npm install', type: 'Framework' };
      case 'svelte': return { buildCmd: 'npm run build', outDir: 'dist', installCmd: 'npm install', type: 'Framework' };
      case 'gatsby': return { buildCmd: 'npm run build', outDir: 'public', installCmd: 'npm install', type: 'Framework' };
      case 'php': {
        const isStaticHost = selectedPlatform === 'githubpages' || selectedPlatform === 'netlify' || selectedPlatform === 'cloudflare';
        return {
          buildCmd: isStaticHost ? 'mkdir -p dist && if [ -f index.php ]; then php index.php > dist/index.html; fi' : '',
          outDir: isStaticHost ? 'dist' : '.',
          installCmd: '',
          type: 'Backend'
        };
      }
      case 'python': {
        const isStaticHost = selectedPlatform === 'githubpages' || selectedPlatform === 'netlify' || selectedPlatform === 'cloudflare' || selectedPlatform === 'vercel' || selectedPlatform === 'aws' || selectedPlatform === 'azure' || selectedPlatform === 'gcp';
        return {
          buildCmd: isStaticHost ? 'python freeze.py' : '',
          outDir: isStaticHost ? 'dist' : '.',
          installCmd: 'pip install -r requirements.txt',
          type: isStaticHost ? 'Static' : 'Backend'
        };
      }
      case 'static': return { buildCmd: '', outDir: '.', installCmd: '', type: 'Static' };
      default: return { buildCmd: 'npm run build', outDir: 'dist', installCmd: 'npm install', type: 'Framework' };
    }
  };

  const initialFramework = initialConfig.framework || 'static';
  const defaults = getFrameworkDefaults(initialFramework);

  const [config, setConfig] = useState({
    projectName: initialConfig.projectName || '',
    region: initialConfig.region || 'us-east-1',
    buildCommand: initialConfig.buildCommand !== undefined ? initialConfig.buildCommand : defaults.buildCmd,
    outputDirectory: initialConfig.outputDirectory !== undefined ? initialConfig.outputDirectory : defaults.outDir,
    installCommand: initialConfig.installCommand !== undefined ? initialConfig.installCommand : defaults.installCmd,
    nodeVersion: initialConfig.nodeVersion !== undefined ? initialConfig.nodeVersion : '20',
    domain: initialConfig.domain || '',
    framework: initialFramework,
    projectType: initialConfig.projectType || defaults.type,
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
    <div className="config-form-container">
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="config-card">
        <Card.Body>
          <h6 className="card-title">
            <FaCog /> Basic Configuration
          </h6>
          <Row>
            <Col md={6} className="form-group-compact">

              <Form.Group>
                <Form.Label>Project Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={config.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="my-awesome-project"
                />
                <Form.Text>This will be used as the project identifier</Form.Text>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Domain (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={config.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="custom-domain.com"
                />
                <Form.Text>Optional custom domain for your deployment</Form.Text>
              </Form.Group>

              {selectedPlatform === 'aws' && (
                <Form.Group className="mt-3">
                  <Form.Label>AWS Region</Form.Label>
                  <Form.Select
                    value={config.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                  >
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-east-2">us-east-2 (Ohio)</option>
                    <option value="us-west-1">us-west-1 (N. California)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <option value="eu-west-1">eu-west-1 (Ireland)</option>
                    <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                    <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                    <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                    <option value="ap-southeast-2">ap-southeast-2 (Sydney)</option>
                    <option value="ap-northeast-1">ap-northeast-1 (Tokyo)</option>
                    <option value="sa-east-1">sa-east-1 (São Paulo)</option>
                    <option value="ca-central-1">ca-central-1 (Central)</option>
                  </Form.Select>
                </Form.Group>
              )}
            </Col>
            <Col md={6} className="form-group-compact">
              <Form.Group>
                <Form.Label>Framework</Form.Label>
                <Form.Select
                  value={config.framework}
                  onChange={(e) => {
                    const fw = e.target.value;
                    const newDefaults = getFrameworkDefaults(fw);
                    const oldDefaults = getFrameworkDefaults(config.framework);
                    
                    setConfig(prev => ({
                      ...prev,
                      framework: fw,
                      projectType: newDefaults.type,
                      buildCommand: (!prev.buildCommand || prev.buildCommand === oldDefaults.buildCmd) ? newDefaults.buildCmd : prev.buildCommand,
                      outputDirectory: (!prev.outputDirectory || prev.outputDirectory === oldDefaults.outDir) ? newDefaults.outDir : prev.outputDirectory,
                      installCommand: (!prev.installCommand || prev.installCommand === oldDefaults.installCmd) ? newDefaults.installCmd : prev.installCommand
                    }));
                  }}
                >
                  <option value="static">Static HTML/CSS/JS</option>
                  <option value="react">React (Create React App)</option>
                  <option value="vite">Vite (React/Vue/Svelte)</option>
                  <option value="vue">Vue CLI</option>
                  <option value="angular">Angular</option>
                  <option value="nextjs">Next.js</option>
                  <option value="nuxtjs">Nuxt.js</option>
                  <option value="gatsby">Gatsby</option>
                  <option value="svelte">Svelte</option>
                  <option value="php">PHP App</option>
                  <option value="python">Python App</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mt-3">
                <Form.Label>Project Type</Form.Label>
                <Form.Select
                  value={config.projectType}
                  onChange={(e) => handleInputChange('projectType', e.target.value)}
                >
                  <option value="Static">Static Site</option>
                  <option value="Framework">JavaScript Framework</option>
                  <option value="Backend">Backend Service (PHP, Node, Python, etc.)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="config-card">
        <Card.Body>
          <h6 className="card-title">
            <FaCode /> Build Settings
          </h6>
          <Row>
            <Col md={6} className="form-group-compact">
              <Form.Group>
                <Form.Label>Install Command</Form.Label>
                <Form.Control
                  type="text"
                  value={config.installCommand}
                  onChange={(e) => handleInputChange('installCommand', e.target.value)}
                  placeholder="npm install"
                />
                <Form.Text>Command to install dependencies</Form.Text>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Build Command</Form.Label>
                <Form.Control
                  type="text"
                  value={config.buildCommand}
                  onChange={(e) => handleInputChange('buildCommand', e.target.value)}
                  placeholder="npm run build"
                />
                <Form.Text>Command to build your project</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6} className="form-group-compact">
              <Form.Group>
                <Form.Label>Output Directory</Form.Label>
                <Form.Control
                  type="text"
                  value={config.outputDirectory}
                  onChange={(e) => handleInputChange('outputDirectory', e.target.value)}
                  placeholder="dist"
                />
                <Form.Text>Directory containing built files</Form.Text>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Node Version</Form.Label>
                <Form.Select
                  value={config.nodeVersion}
                  onChange={(e) => handleInputChange('nodeVersion', e.target.value)}
                >
                  <option value=""></option>
                  <option value="20">Node.js 20</option>
                  <option value="18">Node.js 18 (LTS)</option>
                  <option value="16">Node.js 16</option>
                  <option value="14">Node.js 14</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="config-card">
        <Card.Body>
          <h6 className="card-title">
            <FaServer /> Environment Variables
          </h6>
          <div className="env-vars-container">
            <div className="d-flex gap-2 mb-3">
              <Form.Control
                type="text"
                placeholder="Variable name"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                className="flex-grow-1"
              />
              <Form.Control
                type="text"
                placeholder="Value"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                className="flex-grow-1"
              />
              <Button
                variant="primary"
                onClick={addEnvironmentVariable}
                className="btn-add"
              >
                <FaPlus size={12} /> Add
              </Button>
            </div>
            <div>
              {Object.entries(config.environmentVariables).map(([key, value]) => (
                <span key={key} className="env-var-badge">
                  {key}={value}
                  <button
                    onClick={() => removeEnvironmentVariable(key)}
                    className="btn-remove"
                    aria-label={`Remove ${key}`}
                  >
                    <FaTrash size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="config-card">
        <Card.Body>
          <h6 className="card-title">
            <FaGlobe /> Redirects
          </h6>
          <div className="redirects-container">
            {config.redirects.map((redirect, index) => (
              <div key={index} className="redirect-item">
                <Form.Control
                  type="text"
                  value={redirect.from}
                  onChange={(e) => updateRedirect(index, 'from', e.target.value)}
                  placeholder="/old-path"
                  className="flex-grow-1"
                />
                <Form.Control
                  type="text"
                  value={redirect.to}
                  onChange={(e) => updateRedirect(index, 'to', e.target.value)}
                  placeholder="/new-path"
                  className="flex-grow-1"
                />
                <Form.Select
                  value={redirect.status}
                  onChange={(e) => updateRedirect(index, 'status', parseInt(e.target.value))}
                  className="flex-grow-1"
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
                  className="btn-remove"
                >
                  <FaTrash size={12} />
                </Button>
              </div>
            ))}
            <Button
              variant="primary"
              onClick={addRedirect}
              className="btn-add"
            >
              <FaPlus size={12} /> Add Redirect
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="config-card">
        <Card.Body>
          <h6 className="card-title">
            <FaLock /> Custom Headers
          </h6>
          <div className="headers-container">
            {config.headers.map((header, index) => (
              <div key={index} className="header-item">
                <Form.Control
                  type="text"
                  value={header.source}
                  onChange={(e) => updateHeaderSource(index, e.target.value)}
                  placeholder="/*"
                  className="flex-grow-1"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeHeader(index)}
                  className="btn-remove"
                >
                  <FaTrash size={12} />
                </Button>
                <div className="header-rules-container">
                  {Object.entries(header.headers).map(([key, value]) => (
                    <div key={key} className="header-rule-item">
                      <Badge bg="secondary" className="flex-grow-1">
                        {key}
                      </Badge>
                      <span className="flex-grow-1">
                        {value}
                      </span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeHeaderRule(index, key)}
                        className="btn-remove"
                      >
                        <FaTrash size={10} />
                      </Button>
                    </div>
                  ))}
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Header-Name"
                      id={`header-key-${index}`}
                      className="flex-grow-1"
                    />
                    <Form.Control
                      type="text"
                      placeholder="Header-Value"
                      id={`header-value-${index}`}
                      className="flex-grow-1"
                    />
                    <Button
                      variant="primary"
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
                      className="btn-add"
                    >
                      <FaPlus size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="primary"
              onClick={addHeader}
              className="btn-add"
            >
              <FaPlus size={12} /> Add Header Rule
            </Button>
          </div>
        </Card.Body>
      </Card>

      <div className="form-actions">
        <Button
          variant="outline-light"
          onClick={onBack}
          className="btn-back"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          className="btn-continue"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationForm;
