import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Forms.css';
import { NavigationBar } from '../Components/NavigationBar';

function TermsAndConditions({ mode = 'accept' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAccept = () => {
    // You could also store this in a database or via an API call here.
    const redirectTo = location.state?.redirectTo || '/projects';
    navigate(redirectTo);
  };

  const handleDecline = () => {
    // If they decline, maybe log them out and go to landing
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1); // Go back to profile
  };

  return (
    <>
      {mode === 'view' && <NavigationBar />}
      <div className="page-container" style={{ padding: '2rem 1rem' }}>
        <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <div className="d-flex justify-content-between align-items-center mb-4" style={{ flexShrink: 0 }}>
            {mode === 'accept' && <img src="/FullLogo.png" alt="Logo" className="logo" style={{ marginBottom: 0, height: '40px', width: 'auto' }}/>}
            <h2 className="page-title mb-0" style={{ textAlign: 'left', flexGrow: 1, marginLeft: mode === 'accept' ? '15px' : '0' }}>Privacy Policy & Terms</h2>
          </div>
          
          <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px', textAlign: 'left', color: '#333' }}>
            <h4>Terms and Conditions</h4>
            <p>Welcome to SwiftDeploy! By accessing and using our platform, you agree to comply with and be bound by the following terms and conditions.</p>
            
            <h5>1. Use of Service</h5>
            <p>You agree to use our services only for lawful purposes. You must not use our platform to deploy malicious code, host illegal content, or engage in activities that disrupt or interfere with our services.</p>
            
            <h5>2. Account Security</h5>
            <p>You are responsible for maintaining the confidentiality of your account credentials and any API tokens you connect to SwiftDeploy. You agree to notify us immediately of any unauthorized use of your account.</p>

            <h5>3. Platform Tokens & Integration</h5>
            <p>By providing access tokens for third-party platforms (like GitHub, AWS, GCP, etc.), you grant SwiftDeploy permission to perform actions on your behalf strictly for the purpose of deploying and managing your projects. We do not use these tokens for any other purpose.</p>
            
            <h5>4. Limitation of Liability</h5>
            <p>SwiftDeploy is provided "as is" without any warranties. We shall not be liable for any damages, downtime, or data loss resulting from the use or inability to use our platform.</p>

            <h4 className="mt-4">Privacy Policy</h4>
            <p>Your privacy is important to us. This section explains how we handle your data.</p>
            
            <h5>1. Data Collection</h5>
            <p>We collect information you provide directly to us, such as your name, email address, and connected platform tokens. We also collect usage data to improve our services.</p>
            
            <h5>2. Data Security</h5>
            <p>We implement industry-standard security measures to protect your sensitive information, including API tokens. Your tokens are securely transmitted and stored.</p>
            
            <h5>3. Data Sharing</h5>
            <p>We do not sell or share your personal information with third parties except as necessary to provide our services (e.g., interacting with the cloud providers you connect) or to comply with the law.</p>

            <p className="mt-4 mb-0 text-muted" style={{ fontSize: '12px' }}>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #eee', flexShrink: 0, display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            {mode === 'accept' ? (
              <>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ width: 'auto', backgroundColor: '#e0e0e0', color: '#333' }}
                  onClick={handleDecline}
                >
                  Decline
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ width: 'auto', paddingLeft: '30px', paddingRight: '30px' }}
                  onClick={handleAccept}
                >
                  I Accept
                </button>
              </>
            ) : (
              <button 
                type="button" 
                className="btn" 
                style={{ width: 'auto', paddingLeft: '30px', paddingRight: '30px' }}
                onClick={handleBack}
              >
                Back to Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TermsAndConditions;
