import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { savePlatformToken } from '../api/auth';
const AuthCallback = () => {
  const hasRun = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
  if (hasRun.current) return;
  hasRun.current = true;

  let token = null;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'GitHubAccessToken') {
      token = value;
      break;
    }
  }

  if (!token) {
    console.error('No token found in cookies');
    navigate('/');
    return;
  }

  axios.post("http://localhost:5280/api/user/login/github/callback",null, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(response => {
    console.log('Auth response:', response.data);
    if (response.data.requiresProfileCompletion) {
      console.log('Profile completion required, redirecting...');
      navigate('/complete-profile/' + response.data.userId);
    } else {
      console.log('Setting tokens in localStorage...');
      localStorage.setItem('github_access_token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('jwtToken', response.data.token);
      console.log('Tokens set, navigating to /projects');
      savePlatformToken('github', token).then(() => {
        console.log('GitHub token saved to database successfully');
        navigate('/projects');
      }).catch(err => {
        console.error('Failed to save GitHub token:', err);
        navigate('/projects');
      });
    }
  })
  .catch(error => {
    console.error('Authentication failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    navigate('/register');
  });
}, [navigate]); // Added navigate to the dependency array
  return (
    <div>
      <p>Authentication complete. Redirecting...</p>
    </div>
  );
};

export default AuthCallback;