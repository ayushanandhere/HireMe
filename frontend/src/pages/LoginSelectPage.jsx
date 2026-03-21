import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';
import { FaUser, FaBuilding } from 'react-icons/fa';

const LoginSelectPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card role-select-card">
        <div className="auth-header">
          <h2>Sign in</h2>
          <p className="auth-subtitle">Choose your account type</p>
        </div>

        <div className="role-options">
          <Link to="/login/candidate" className="role-option candidate-role">
            <div className="role-icon"><FaUser /></div>
            <div className="role-info">
              <h3>Candidate</h3>
              <p>Find jobs and track applications</p>
            </div>
          </Link>

          <Link to="/login/recruiter" className="role-option recruiter-role">
            <div className="role-icon"><FaBuilding /></div>
            <div className="role-info">
              <h3>Recruiter</h3>
              <p>Manage roles and candidates</p>
            </div>
          </Link>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="auth-link">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginSelectPage;
