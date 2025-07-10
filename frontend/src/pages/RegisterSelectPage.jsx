import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';
import { FaUser, FaBuilding } from 'react-icons/fa';

const RegisterSelectPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card role-select-card">
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p className="auth-subtitle">Select your account type to register</p>
        </div>
        
        <div className="role-options">
          <Link to="/register/candidate" className="role-option candidate-role">
            <div className="role-icon">
              <FaUser size={32} />
            </div>
            <h3>Job Seeker</h3>
            <p>Find opportunities and track applications</p>
          </Link>
          
          <Link to="/register/recruiter" className="role-option recruiter-role">
            <div className="role-icon">
              <FaBuilding size={32} />
            </div>
            <h3>Recruiter</h3>
            <p>Post jobs and find talented candidates</p>
          </Link>
        </div>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelectPage; 