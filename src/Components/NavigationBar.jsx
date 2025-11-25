import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdOutlineDashboard } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { FaTerminal } from "react-icons/fa6";
import { PiGitForkLight } from "react-icons/pi";
import { GoQuestion } from "react-icons/go";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../Contexts/AuthContext";

import "../css/NavBar.css";

export const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="nav-bg">
      <div className="margin mt-4">
        <img
          src="/logo.ico"
          alt="Logo"
          className="logo"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        />
        <div className="container">
          <div className="top-icons">
            <div
              className={`iconify-icon mb-4 ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
              title="Dashboard"
            >
              <MdOutlineDashboard />
            </div>
            <div
              className={`iconify-icon mb-4 ${isActive('/projects') ? 'active' : ''}`}
              onClick={() => navigate('/projects')}
              title="Projects"
            >
              <PiGitForkLight />
            </div>
            <div
              className={`iconify-icon terminal-icon mb-4 ${isActive('/deployments') ? 'active' : ''}`}
              onClick={() => navigate('/deployments')}
              title="Deployments"
            >
              <FaTerminal />
            </div>
            <div
              className={`iconify-icon ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
              title="Settings"
            >
              <CiSettings />
            </div>
          </div>
          <div className="bottom-icons">
            <div
              className="iconify-icon"
              onClick={() => window.open('https://github.com/yourusername/swiftdeploy/issues', '_blank')}
              title="Help & Support"
            >
              <GoQuestion />
            </div>
            <div
              className="iconify-icon mb-4 logout-icon"
              onClick={handleLogout}
              title="Logout"
            >
              <FiLogOut />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigationBar;