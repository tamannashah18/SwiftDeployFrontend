import React, { useState } from 'react';
import { FaReact, FaVuejs, FaAngular, FaNodeJs } from 'react-icons/fa';
import { SiNextdotjs } from 'react-icons/si';

function FrameworkDetector({ framework, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localFramework, setLocalFramework] = useState(framework);

  const frameworkIcons = {
    React: <FaReact size={32} className="text-info" />,
    Next: <SiNextdotjs size={32} />,
    Vue: <FaVuejs size={32} className="text-success" />,
    Angular: <FaAngular size={32} className="text-danger" />,
    Node: <FaNodeJs size={32} className="text-success" />,
    Static: <span style={{ fontSize: '32px' }}>📄</span>,
  };

  const handleSave = () => {
    onUpdate(localFramework);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalFramework(framework);
    setIsEditing(false);
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Framework Detection</h5>
        {!isEditing && (
          <button className="btn btn-sm btn-outline-primary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>
      <div className="card-body">
        {isEditing ? (
          <>
            <div className="mb-3">
              <label className="form-label">Framework</label>
              <select
                className="form-select"
                value={localFramework.name}
                onChange={(e) =>
                  setLocalFramework({ ...localFramework, name: e.target.value })
                }
              >
                <option value="React">React</option>
                <option value="Next">Next.js</option>
                <option value="Vue">Vue</option>
                <option value="Angular">Angular</option>
                <option value="Node">Node.js</option>
                <option value="Static">Static HTML</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Build Command</label>
              <input
                type="text"
                className="form-control"
                value={localFramework.buildCommand}
                onChange={(e) =>
                  setLocalFramework({ ...localFramework, buildCommand: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Output Directory</label>
              <input
                type="text"
                className="form-control"
                value={localFramework.outputDir}
                onChange={(e) =>
                  setLocalFramework({ ...localFramework, outputDir: e.target.value })
                }
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
              <button className="btn btn-outline-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="d-flex align-items-center mb-3">
              {frameworkIcons[framework.name] || frameworkIcons['Static']}
              <div className="ms-3">
                <h6 className="mb-0">{framework.name}</h6>
                <small className="text-muted">Detected Framework</small>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Build Command:</strong>
                <div className="bg-light p-2 rounded mt-1">
                  <code>{framework.buildCommand}</code>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Output Directory:</strong>
                <div className="bg-light p-2 rounded mt-1">
                  <code>{framework.outputDir}</code>
                </div>
              </div>
            </div>

            {framework.envVars && framework.envVars.length > 0 && (
              <div>
                <strong>Environment Variables:</strong>
                <ul className="list-unstyled mt-2">
                  {framework.envVars.map((envVar, index) => (
                    <li key={index} className="bg-light p-2 rounded mb-1">
                      <code>{envVar}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FrameworkDetector;
