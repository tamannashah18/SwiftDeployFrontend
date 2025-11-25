import React from 'react';
import { SiNetlify, SiVercel, SiRailway, SiRender } from 'react-icons/si';
import { FaCloudflare, FaGithub } from 'react-icons/fa';

function PlatformSelector({ selectedPlatform, onSelect }) {
  const platforms = [
    {
      id: 'vercel',
      name: 'Vercel',
      icon: SiVercel,
      color: '#000',
      description: 'Optimal for Next.js and React applications',
      features: ['Automatic CI/CD', 'Edge Network', 'Preview Deployments'],
    },
    {
      id: 'netlify',
      name: 'Netlify',
      icon: SiNetlify,
      color: '#00C7B7',
      description: 'Great for static sites and JAMstack',
      features: ['Forms & Functions', 'Split Testing', 'Build Plugins'],
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare Pages',
      icon: FaCloudflare,
      color: '#F38020',
      description: 'Fast global CDN with Workers',
      features: ['Global CDN', 'Workers', 'Analytics'],
    },
    {
      id: 'railway',
      name: 'Railway',
      icon: SiRailway,
      color: '#0B0D0E',
      description: 'Deploy databases and backend services',
      features: ['Databases', 'Auto Scaling', 'Instant Deploys'],
    },
    {
      id: 'render',
      name: 'Render',
      icon: SiRender,
      color: '#46E3B7',
      description: 'Unified cloud for apps and sites',
      features: ['Auto Deploy', 'Free SSL', 'DDoS Protection'],
    },
    {
      id: 'github',
      name: 'GitHub Pages',
      icon: FaGithub,
      color: '#333',
      description: 'Host directly from your repository',
      features: ['Free Hosting', 'Custom Domains', 'Jekyll Support'],
    },
  ];

  return (
    <div className="row g-4">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isSelected = selectedPlatform === platform.id;

        return (
          <div key={platform.id} className="col-md-6 col-lg-4">
            <div
              className={`card h-100 cursor-pointer ${
                isSelected ? 'border-primary border-2 shadow' : 'border-0 shadow-sm'
              }`}
              onClick={() => onSelect(platform.id)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <Icon size={40} style={{ color: platform.color }} />
                  {isSelected && (
                    <span className="badge bg-primary">Selected</span>
                  )}
                </div>
                <h5 className="card-title">{platform.name}</h5>
                <p className="card-text text-muted small">{platform.description}</p>
                <ul className="list-unstyled mt-3 mb-0">
                  {platform.features.map((feature, index) => (
                    <li key={index} className="text-muted small mb-1">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlatformSelector;
