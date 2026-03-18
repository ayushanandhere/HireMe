import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authService, buildAssetUrl } from '../services/api';
import NotificationDropdown from './common/NotificationDropdown';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setUserRole(authService.getUserRole());
      setUser(authService.getUser());
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

  const dashboardPath = userRole === 'candidate' ? '/dashboard/candidate' : '/dashboard/recruiter';
  const profilePath = userRole === 'candidate'
    ? '/dashboard/candidate/profile'
    : '/dashboard/recruiter/profile';
  const navItems = isAuthenticated
    ? userRole === 'candidate'
      ? [
          { to: '/dashboard/candidate', label: 'Overview' },
          { to: '/dashboard/candidate/jobs', label: 'Jobs' },
          { to: '/dashboard/candidate/applications', label: 'Applications' },
          { to: '/dashboard/candidate/interviews', label: 'Interviews' },
          { to: '/dashboard/candidate/profile', label: 'Profile' }
        ]
      : [
          { to: '/dashboard/recruiter', label: 'Overview' },
          { to: '/dashboard/recruiter/jobs', label: 'Roles' },
          { to: '/dashboard/recruiter/candidates', label: 'Candidates' },
          { to: '/dashboard/recruiter/interviews', label: 'Interviews' },
          { to: '/dashboard/recruiter/profile', label: 'Profile' }
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Login' }
      ];

  return (
    <header className="app-shell-header">
      <div className="container app-shell-header-inner">
        <Link className="app-brand" to={isAuthenticated ? dashboardPath : '/'}>
          <span className="app-brand-mark">HM</span>
          <span className="app-brand-copy">
            <strong>HireMe</strong>
            <span>Signal-driven hiring</span>
          </span>
        </Link>

        <div className="app-shell-controls">
          <nav className="app-shell-nav" aria-label="Primary">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                className={({ isActive }) => `app-shell-link${isActive ? ' is-active' : ''}`}
                to={to}
              >
                {label}
              </NavLink>
            ))}

            {!isAuthenticated && (
              <Link className="app-shell-cta" to="/register">
                Create account
              </Link>
            )}
          </nav>

          {isAuthenticated && (
            <div className="app-shell-utility">
              <span className="app-shell-role">{userRole}</span>
              <Link className="app-shell-avatar-link" to={profilePath} aria-label="Open profile">
                {user?.profilePictureUrl ? (
                  <img
                    src={buildAssetUrl(user.profilePictureUrl)}
                    alt={user?.name || 'Profile'}
                    className="app-shell-avatar-image"
                  />
                ) : (
                  <span className="app-shell-avatar-fallback">
                    {(user?.name || userRole || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
              <div className="app-shell-notifications">
                <NotificationDropdown />
              </div>
              <button className="app-shell-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
