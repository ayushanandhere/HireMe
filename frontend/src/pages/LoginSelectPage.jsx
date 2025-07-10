import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';
import { FaUser, FaBuilding } from 'react-icons/fa';

const LoginSelectPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card role-select-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Select your account type to sign in</p>
        </div>
        
        <div className="role-options">
          <Link to="/login/candidate" className="role-option candidate-role">
            <div className="role-icon">
              <FaUser size={32} />
            </div>
            <h3>Job Seeker</h3>
            <p>Access your candidate dashboard</p>
          </Link>
          
          <Link to="/login/recruiter" className="role-option recruiter-role">
            <div className="role-icon">
              <FaBuilding size={32} />
            </div>
            <h3>Recruiter</h3>
            <p>Manage your job listings and applications</p>
          </Link>
        </div>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginSelectPage; 