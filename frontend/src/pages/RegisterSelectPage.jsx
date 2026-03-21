import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';
import { FaUser, FaBuilding } from 'react-icons/fa';

const RegisterSelectPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card role-select-card">
        <div className="auth-header">
          <h2>Create account</h2>
          <p className="auth-subtitle">Choose your account type</p>
        </div>

        <div className="role-options">
          <Link to="/register/candidate" className="role-option candidate-role">
            <div className="role-icon"><FaUser /></div>
            <div className="role-info">
              <h3>Candidate</h3>
              <p>Find jobs and track applications</p>
            </div>
          </Link>

          <Link to="/register/recruiter" className="role-option recruiter-role">
            <div className="role-icon"><FaBuilding /></div>
            <div className="role-info">
              <h3>Recruiter</h3>
              <p>Post roles and find talent</p>
            </div>
          </Link>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelectPage;
