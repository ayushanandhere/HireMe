import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import NotificationDropdown from './common/NotificationDropdown';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setUserRole(authService.getUserRole());
    };

    // Check initially
    checkAuth();

    // Set up event listener for localStorage changes
    window.addEventListener('storage', checkAuth);
    
    // Listen for custom auth change events
    window.addEventListener('auth-change', checkAuth);

    // Cleanup
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRole('');
    navigate('/');
  };

  return (
    <header className="text-white">
      <nav className="navbar navbar-expand-lg navbar-dark header-dark-orange">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              fill="currentColor" 
              className="bi bi-briefcase-fill me-2" 
              viewBox="0 0 16 16"
              style={{ color: '#ffffff' }}
            >
              <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
            </svg>
            <span className="brand-text">HireMe</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              
              {!isAuthenticated ? (
                // Non-authenticated user menu items
                <>
                  <li className="nav-item">
                    <Link className="nav-link auth-button login-button" to="/login">
                      <span className="auth-icon">👤</span> Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link auth-button register-button" to="/register">
                      <span className="auth-icon">✨</span> Register
                    </Link>
                  </li>
                </>
              ) : (
                // Authenticated user menu items
                <>
                  <li className="nav-item">
                    <div className="notification-wrapper">
                      <NotificationDropdown />
                    </div>
                  </li>
                  {userRole === 'recruiter' && (
                    <li className="nav-item">
                      <Link 
                        className="nav-link nav-item-animated" 
                        to="/dashboard/recruiter/interviews"
                      >
                        <span className="nav-icon">📅</span> Interviews
                      </Link>
                    </li>
                  )}
                  {userRole === 'candidate' && (
                    <li className="nav-item">
                      <Link 
                        className="nav-link nav-item-animated" 
                        to="/dashboard/candidate/interviews"
                      >
                        <span className="nav-icon">📅</span> Interviews
                      </Link>
                    </li>
                  )}
                  <li className="nav-item">
                    <Link 
                      className="nav-link nav-item-animated" 
                      to={userRole === 'candidate' ? '/dashboard/candidate' : '/dashboard/recruiter'}
                    >
                      <span className="nav-icon">📊</span> Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button 
                      className="nav-link btn btn-link logout-button" 
                      onClick={handleLogout}
                    >
                      <span className="nav-icon">🚪</span> Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 