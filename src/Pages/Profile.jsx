import React, { useState, useEffect } from "react";
import axios from "axios";
import NavigationBar from "../Components/NavigationBar";

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
  const [message, setMessage] = useState("");

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

      setPlatformTokens({
        github: localStorage.getItem("github_access_token") || "",
        vercel: localStorage.getItem("vercel_token") || "",
        netlify: localStorage.getItem("netlify_token") || "",
        cloudflare: localStorage.getItem("cloudflare_token") || ""
      });
    }
  }, []);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!user || !token) {
      setMessage("User not logged in.");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5280/api/user/${user.id}`,
        {
          Username: formData.username,
          Name: formData.name,
          Email: formData.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
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
      await axios.put(
        `http://localhost:5280/api/user/${user.id}/password`,
        {
          CurrentPassword: passwordData.currentPassword,
          NewPassword: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
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
      Object.keys(platformTokens).forEach((platform) => {
        if (platformTokens[platform]) {
          localStorage.setItem(`${platform}_token`, platformTokens[platform]);
          if (platform === "github") {
            localStorage.setItem("github_access_token", platformTokens[platform]);
          }
        }
      });

      setMessage("Platform tokens updated successfully");
      setTokenMode(false);
    } catch (err) {
      setMessage("Failed to update platform tokens");
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
            <input
              type="text"
              name="github"
              value={platformTokens.github}
              onChange={handleTokenChange}
              placeholder="GitHub Token"
            />
            <input
              type="text"
              name="vercel"
              value={platformTokens.vercel}
              onChange={handleTokenChange}
              placeholder="Vercel Token"
            />
            <input
              type="text"
              name="netlify"
              value={platformTokens.netlify}
              onChange={handleTokenChange}
              placeholder="Netlify Token"
            />
            <input
              type="text"
              name="cloudflare"
              value={platformTokens.cloudflare}
              onChange={handleTokenChange}
              placeholder="Cloudflare Token"
            />
            <button type="submit" className="btn">
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
              <button onClick={() => setTokenMode(true)} className="btn">
                Manage Tokens
              </button>
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
