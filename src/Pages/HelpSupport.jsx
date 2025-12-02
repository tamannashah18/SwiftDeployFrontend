import React, { useState, useEffect } from 'react';
import { NavigationBar } from '../Components/NavigationBar';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import emailjs from '@emailjs/browser';
import '../css/HelpSupport.css';

const HelpSupport = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // EmailJS Configuration
  // TODO: Replace these with your actual EmailJS credentials
  // Get them from: https://dashboard.emailjs.com/
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_g4w6wt6',      // Replace with your Service ID
    TEMPLATE_ID: 'template_h0zll98',    // Replace with your Template ID
    PUBLIC_KEY: '8y7avWadlGoCJiX7T'        // Replace with your Public Key
  };

  // Initialize EmailJS on component mount (only if configured)
  useEffect(() => {
    if (EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setMessage({ type: 'danger', text: 'Please enter your query before submitting.' });
      return;
    }

    if (query.trim().length < 10) {
      setMessage({ type: 'danger', text: 'Please provide more details (at least 10 characters).' });
      return;
    }

    // Check if EmailJS is configured
    if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID' || 
        EMAILJS_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || 
        EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      setMessage({ 
        type: 'warning', 
        text: 'EmailJS is not configured yet. Please configure EmailJS credentials in HelpSupport.jsx. For now, you can contact us directly at swift.deploy.app@gmail.com' 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Get user info from localStorage if available
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email || 'user@example.com';
      const userName = user.name || 'SwiftDeploy User';

      // EmailJS template parameters
      const templateParams = {
        to_email: 'swift.deploy.app@gmail.com',
        from_name: userName,
        from_email: userEmail,
        message: query,
        subject: 'SwiftDeploy Support Query',
        reply_to: userEmail,
      };

      // Send email using EmailJS
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      setMessage({ 
        type: 'success', 
        text: 'Your query has been sent successfully to swift.deploy.app@gmail.com! We will get back to you soon.' 
      });
      
      // Clear the form
      setQuery('');
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } catch (error) {
      console.error('Email sending error:', error);
      let errorMessage = 'Failed to send your query. ';
      
      if (error.text) {
        errorMessage += `Error: ${error.text}. `;
      }
      
      errorMessage += 'Please try again or contact us directly at swift.deploy.app@gmail.com';
      
      setMessage({ 
        type: 'danger', 
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="help-support-page">
      <NavigationBar />
      <div className="help-support-content">
        <div className="container-fluid py-4">
          <div className="row">
            <div className="col-12">
              <h1 className="help-title">Help & Support</h1>
              <p className="help-subtitle">We're here to help! Send us your query and we'll get back to you as soon as possible.</p>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12 col-lg-8 mx-auto">
              <Card className="help-card">
                <Card.Body>
                  <h5 className="card-title mb-4">Contact SwiftDeploy Support</h5>
                  
                  {message.text && (
                    <Alert variant={message.type} className="mb-4" dismissible onClose={() => setMessage({ type: '', text: '' })}>
                      {message.text}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label>Your Query</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        placeholder="Please describe your question or issue in detail. Include any error messages, steps to reproduce, or other relevant information..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                          backgroundColor: '#2d1b4e',
                          border: '1px solid #6c3fb5',
                          color: '#ffffff',
                          fontSize: '1rem'
                        }}
                        disabled={loading}
                      />
                      <Form.Text className="text-muted mt-2">
                        Minimum 10 characters required
                      </Form.Text>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading || !query.trim() || query.trim().length < 10}
                      className="submit-btn"
                      style={{
                        backgroundColor: '#6c3fb5',
                        borderColor: '#6c3fb5',
                        minWidth: '150px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Sending...
                        </>
                      ) : (
                        'Send Query'
                      )}
                    </Button>
                  </Form>

                  <div className="mt-4 pt-4 border-top" style={{ borderColor: '#6c3fb5' }}>
                    <h6 className="mb-3">Other Ways to Reach Us</h6>
                    <div className="contact-info">
                      <p className="mb-2">
                        <strong>Email:</strong>{' '}
                        <a href="mailto:swift.deploy.app@gmail.com" style={{ color: '#b89dff' }}>
                          swift.deploy.app@gmail.com
                        </a>
                      </p>
                      <p className="mb-0">
                        <strong>Response Time:</strong> We typically respond within 24-48 hours.
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;

