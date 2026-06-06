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
    <div className="nav-bg d-flex flex-column align-items-center">
      <div className="d-flex flex-column align-items-center w-100 h-100 py-3">
        <img
          src="/logo.ico"
          alt="Logo"
          className="logo mb-4"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer', height: '3rem', width: 'auto', objectFit: 'contain' }}
        />

        <div className="d-flex flex-column justify-content-between align-items-center flex-grow-1 w-100">
          <div className="d-flex flex-column align-items-center gap-3">
            <div
              className={`iconify-icon ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
              title="Dashboard"
            >
              <MdOutlineDashboard />
            </div>
            <div
              className={`iconify-icon ${isActive('/projects') ? 'active' : ''}`}
              onClick={() => navigate('/projects')}
              title="Projects"
            >
              <PiGitForkLight />
            </div>

            <div
              className={`iconify-icon terminal-icon ${isActive('/deployments') ? 'active' : ''}`}
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

          <div className="d-flex flex-column align-items-center gap-3 mb-3">
            <div
              className={`iconify-icon ${isActive('/help-support') ? 'active' : ''}`}
              onClick={() => navigate('/help-support')}
              title="Help & Support"
            >
              <GoQuestion />
            </div>
            <div
              className="iconify-icon logout-icon"
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