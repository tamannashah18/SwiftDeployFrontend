import React, { useState } from 'react';

function ConfigViewer({ config, onUpdate }) {
  const [activeTab, setActiveTab] = useState('vercel');

  const generateVercelConfig = () => ({
    buildCommand: config.buildCommand || 'npm run build',
    outputDirectory: config.outputDir || 'build',
    installCommand: 'npm install',
    framework: config.name?.toLowerCase() || 'react',
  });

  const generateNetlifyConfig = () => ({
    build: {
      command: config.buildCommand || 'npm run build',
      publish: config.outputDir || 'build',
    },
    plugins: [],
  });

  const generateCloudflareConfig = () => ({
    build: {
      command: config.buildCommand || 'npm run build',
      cwd: '.',
      destination: config.outputDir || 'build',
    },
  });

  const configs = {
    vercel: {
      name: 'vercel.json',
      content: generateVercelConfig(),
    },
    netlify: {
      name: 'netlify.toml',
      content: generateNetlifyConfig(),
    },
    cloudflare: {
      name: 'wrangler.toml',
      content: generateCloudflareConfig(),
    },
  };

  const formatConfig = (content, type) => {
    if (type === 'netlify') {
      return `[build]
  command = "${content.build.command}"
  publish = "${content.build.publish}"`;
    }
    return JSON.stringify(content, null, 2);
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-white">
        <h5 className="mb-0">Configuration Preview</h5>
      </div>
      <div className="card-body">
        <ul className="nav nav-tabs mb-3">
          {Object.keys(configs).map((key) => (
            <li className="nav-item" key={key}>
              <button
                className={`nav-link ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {configs[key].name}
              </button>
            </li>
          ))}
        </ul>

        <div className="bg-dark text-light p-3 rounded" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <pre className="mb-0">
            <code>{formatConfig(configs[activeTab].content, activeTab)}</code>
          </pre>
        </div>

        <div className="alert alert-info mt-3 mb-0" role="alert">
          <small>
            <strong>Note:</strong> This configuration will be automatically generated and committed to your repository during deployment.
          </small>
        </div>
      </div>
    </div>
  );
}

export default ConfigViewer;
