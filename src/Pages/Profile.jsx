import React, { useState, useEffect } from "react";
import axios from "axios";
import NavigationBar from "../Components/NavigationBar";
import { getUserTokens, savePlatformToken } from "../api/auth";
import apiClient from "../api/apiClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Profile() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [platformTokens, setPlatformTokens] = useState({
    github: "",
    vercel: "",
    netlify: "",
    cloudflare: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [tokenMode, setTokenMode] = useState(false);
  const [showTokens, setShowTokens] = useState({
    github: false,
    vercel: false,
    netlify: false,
    cloudflare: false
  });
  const [message, setMessage] = useState("");
  const [loadingTokens, setLoadingTokens] = useState(false);

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const tokenData = await getUserTokens();
      console.log("Token data from API:", tokenData);
      
      // Prioritize actual token values if returned by API, then localStorage, then placeholder
      setPlatformTokens({
        github: tokenData.githubToken || tokenData.github || localStorage.getItem("github_access_token") || (tokenData.hasGitHubToken ? "****************" : ""),
        vercel: tokenData.vercelToken || tokenData.vercel || localStorage.getItem("vercel_token") || (tokenData.hasVercelToken ? "****************" : ""),
        netlify: tokenData.netlifyToken || tokenData.netlify || localStorage.getItem("netlify_token") || (tokenData.hasNetlifyToken ? "****************" : ""),
        cloudflare: tokenData.cloudflareToken || tokenData.cloudflare || localStorage.getItem("cloudflare_token") || (tokenData.hasCloudflareToken ? "****************" : "")
      });
    } catch (err) {
      console.error("Error fetching tokens:", err);
      // Fallback to localStorage if API fails
      setPlatformTokens({
        github: localStorage.getItem("github_access_token") || "",
        vercel: localStorage.getItem("vercel_token") || "",
        netlify: localStorage.getItem("netlify_token") || "",
        cloudflare: localStorage.getItem("cloudflare_token") || ""
      });
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      setFormData({
        username: parsedUser.username || "",
        name: parsedUser.name || "",
        email: parsedUser.email || ""
      });

      fetchTokens();
    }
  }, []);

  // Check if user has GitHub account
  const hasGitHubAccount = () => {
    if (!user) return false;
    // Check if user has github_access_token in localStorage
    const hasGitHubToken = !!localStorage.getItem("github_access_token");
    // Check if user has GithubId (GitHub users have this)
    const hasGithubId = !!user.githubId;
    // Check if userType is GitHub
    const isGitHubUser = user.userType === 'GitHub' || user.UserType === 'GitHub';
    
    return hasGitHubToken || hasGithubId || isGitHubUser;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTokenChange = (e) => {
    setPlatformTokens((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleTokenVisibility = (platform) => {
    setShowTokens((prev) => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!user || !token) {
      setMessage("User not logged in.");
      return;
    }

    try {
      const response = await apiClient.put(
        `/user/${user.id}`,
        {
          Username: formData.username,
          Name: formData.name,
          Email: formData.email
        }
      );

      const updatedUser = {
        ...user,
        username: formData.username,
        name: formData.name,
        email: formData.email
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("jwtToken", response.data.token);
        setToken(response.data.token);
      }

      setMessage("Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      return;
    }

    try {
      await apiClient.put(
        `/user/${user.id}/password`,
        {
          CurrentPassword: passwordData.currentPassword,
          NewPassword: passwordData.newPassword
        }
      );

      setMessage("Password updated successfully");
      setPasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update password");
    }
  };

  const handleTokenUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const savePromises = Object.keys(platformTokens).map(async (platform) => {
        const tokenValue = platformTokens[platform];
        // Only save if it's not the placeholder and not empty
        if (tokenValue && tokenValue !== "****************") {
          await savePlatformToken(platform, tokenValue);
          localStorage.setItem(`${platform}_token`, tokenValue);
          if (platform === "github") {
            localStorage.setItem("github_access_token", tokenValue);
          }
        }
      });

      await Promise.all(savePromises);

      setMessage("Platform tokens updated successfully");
      setTokenMode(false);
      fetchTokens(); // Refresh token status
    } catch (err) {
      console.error("Error updating tokens:", err);
      setMessage(err.message || "Failed to update platform tokens");
    }
  };

  if (!user) {
    return <div className="page-container"><div className="card">Loading profile or not logged in.</div></div>;
  }

  return (
    <>
      <NavigationBar />
      <div className="page-container">
        <div className="card">
        {/* <img
          src={user.avatarUrl || "/logo.png"}
          alt="Avatar"
          className="logo"
        /> */}
        <h2 className="page-title">Your Profile</h2>

        {editMode ? (
          <form onSubmit={handleUpdate}>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              minLength={3}
              maxLength={50}
              required
            />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <button type="submit" className="btn">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="btn"
              style={{ marginTop: "10px", background: "#ccc", color: "#000" }}
            >
              Cancel
            </button>
          </form>
        ) : passwordMode ? (
          <form onSubmit={handlePasswordReset}>
            <h3 style={{ marginBottom: "20px" }}>Reset Password</h3>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current Password"
              minLength={6}
              required
            />
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="New Password"
              minLength={6}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm New Password"
              minLength={6}
              required
            />
            <button type="submit" className="btn">
              Update Password
            </button>
            <button
              type="button"
              onClick={() => setPasswordMode(false)}
              className="btn"
              style={{ marginTop: "10px", background: "#ccc", color: "#000" }}
            >
              Cancel
            </button>
          </form>
        ) : tokenMode ? (
          <form onSubmit={handleTokenUpdate}>
            <h3 style={{ marginBottom: "20px" }}>Platform Tokens</h3>
            
            {loadingTokens ? (
              <div style={{ textAlign: "center", padding: "20px" }}>Loading token status...</div>
            ) : (
              <>
                <div className="token-input-group">
                  <label>GitHub Token</label>
                  <div className="input-with-icon">
                    <input
                      type={showTokens.github ? "text" : "password"}
                      name="github"
                      value={platformTokens.github}
                      onChange={handleTokenChange}
                      placeholder="GitHub Token"
                    />
                    <button 
                      type="button" 
                      className="eye-toggle" 
                      onClick={() => toggleTokenVisibility('github')}
                    >
                      {showTokens.github ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="token-input-group">
                  <label>Vercel Token</label>
                  <div className="input-with-icon">
                    <input
                      type={showTokens.vercel ? "text" : "password"}
                      name="vercel"
                      value={platformTokens.vercel}
                      onChange={handleTokenChange}
                      placeholder="Vercel Token"
                    />
                    <button 
                      type="button" 
                      className="eye-toggle" 
                      onClick={() => toggleTokenVisibility('vercel')}
                    >
                      {showTokens.vercel ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="token-input-group">
                  <label>Netlify Token</label>
                  <div className="input-with-icon">
                    <input
                      type={showTokens.netlify ? "text" : "password"}
                      name="netlify"
                      value={platformTokens.netlify}
                      onChange={handleTokenChange}
                      placeholder="Netlify Token"
                    />
                    <button 
                      type="button" 
                      className="eye-toggle" 
                      onClick={() => toggleTokenVisibility('netlify')}
                    >
                      {showTokens.netlify ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="token-input-group">
                  <label>Cloudflare Token</label>
                  <div className="input-with-icon">
                    <input
                      type={showTokens.cloudflare ? "text" : "password"}
                      name="cloudflare"
                      value={platformTokens.cloudflare}
                      onChange={handleTokenChange}
                      placeholder="Cloudflare Token"
                    />
                    <button 
                      type="button" 
                      className="eye-toggle" 
                      onClick={() => toggleTokenVisibility('cloudflare')}
                    >
                      {showTokens.cloudflare ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn" style={{ marginTop: "20px" }}>
              Save Tokens
            </button>
            <button
              type="button"
              onClick={() => setTokenMode(false)}
              className="btn"
              style={{ marginTop: "10px", background: "#ccc", color: "#000" }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div style={{ width: "100%", textAlign: "left" }}>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
              <button onClick={() => setEditMode(true)} className="btn">
                Edit Profile
              </button>
              <button onClick={() => setPasswordMode(true)} className="btn">
                Reset Password
              </button>
              {hasGitHubAccount() && (
              <button onClick={() => setTokenMode(true)} className="btn">
                Manage Tokens
              </button>
              )}
            </div>
          </div>
        )}
        {message && (
          <div
            className={`message ${
              message.toLowerCase().includes("failed") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default Profile;
