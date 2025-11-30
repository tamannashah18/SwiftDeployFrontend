import React, { useEffect, useState } from "react";
import axios from "axios";
import '../css/Forms.css';
import {useParams,useNavigate} from 'react-router-dom';
import { useAuth } from "../Contexts/AuthContext";

function CompleteProfile() {
    const params=useParams();
    const navigate=useNavigate();
    const { login } = useAuth();
    const[userId,setUserId]=useState("");
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    });

    // Helper to get GitHub token from cookies
    const getGitHubTokenFromCookie = () => {
      const cookies = document.cookie.split('; ');
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'GitHubAccessToken') {
          return value;
        }
      }
      return null;
    };

    useEffect(() => {
        if (params.userId) {
            setUserId(params.userId);
        }
        if(params.userId==""){
            setError("Invalid user id");
        }
        console.log(userId);
    },[]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (
      formData.username.length < 3 ||
      formData.username.length > 50
    ) {
      setError("Username must be between 3 and 50 characters.");
      return;
    }
    if (formData.password.length < 6 || formData.password.length > 100) {
      setError("Password must be between 6 and 100 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Complete the profile
      const completeResponse = await axios.post(
        "http://localhost:5280/api/user/complete-profile",
        {
          Username: formData.username,
          Password: formData.password,
          UserId: userId
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (completeResponse.data.success) {
        // Get GitHub token from cookie before login
        const githubToken = getGitHubTokenFromCookie();
        
        // Auto-login with the new credentials
        const loginResponse = await axios.post(
          "http://localhost:5280/api/User/login",
          {
            UsernameOrEmail: formData.username,
            Password: formData.password
          },
          { headers: { "Content-Type": "application/json" } }
        );

        // Use AuthContext login to properly set state and save GitHub token
        await login(loginResponse.data.user, loginResponse.data.token, githubToken);
        
        setSuccess("Profile completed! Redirecting...");
        
        // Navigate to projects after successful login
        setTimeout(() => {
          navigate("/projects");
        }, 500);
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      setError(err.response?.data?.message || "Profile completion failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        {/* Example logo */}
        <div className="d-flex justify-content-between align-items-center">
        <img src="/FullLogo.png" alt="Logo" className="logo"/>
        <span className="page-title">Complete Your Profile</span>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            minLength={3}
            maxLength={50}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            maxLength={100}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Completing...' : 'Complete Profile'}
          </button>
        </form>
        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}
      </div>
    </div>
  );
}

export default CompleteProfile;
