import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePlatformToken } from '../api/auth';

function NetlifyCallback() {
    const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      let token;
      const cookies = document.cookie.split('; ');
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'NetlifyAccessToken') {
          console.log('Found Netlify token in cookies:', value);
          token = value;
          break;
        }
      }

      console.log('Netlify Access Token from cookies:', token);
      if (token) {
        localStorage.setItem('NetlifyAccessToken', token);

        try {
          await savePlatformToken('netlify', token);
          console.log('Netlify token saved to database successfully');
        } catch (error) {
          console.error('Failed to save Netlify token to database:', error);
        }

        const returnToProject = localStorage.getItem('netlify_oauth_return_project');
        if (returnToProject) {
          localStorage.removeItem('netlify_oauth_return_project');
          navigate(`/projects/${returnToProject}`);
        } else {
          navigate('/projects');
        }
      } else {
        console.error('No token found in cookies');
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div>
      <p>Netlify Authentication complete. Redirecting...</p>
    </div>
  );
}


export default NetlifyCallback

  