import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { savePlatformToken } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Optionally validate token with backend
          // const user = await validateToken(token);
          const userData = JSON.parse(localStorage.getItem('user'));
          if (userData) {
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (userData, token, githubToken = null) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (githubToken) {
      localStorage.setItem('github_access_token', githubToken);

      try {
        await savePlatformToken('github', githubToken);
        console.log('GitHub token saved to database successfully');
      } catch (error) {
        console.error('Failed to save GitHub token to backend:', error);
      }
    }
    setCurrentUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    localStorage.removeItem('github_access_token');
    setCurrentUser(null);
    navigate('/login');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};