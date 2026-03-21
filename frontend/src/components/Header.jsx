import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authService, buildAssetUrl } from '../services/api';
import NotificationDropdown from './common/NotificationDropdown';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setUserRole(authService.getUserRole());
      setUser(authService.getUser());
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  // Close avatar menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
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
        ]
      : [
          { to: '/dashboard/recruiter', label: 'Overview' },
          { to: '/dashboard/recruiter/jobs', label: 'Roles' },
          { to: '/dashboard/recruiter/candidates', label: 'Candidates' },
          { to: '/dashboard/recruiter/interviews', label: 'Interviews' },
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Login' },
      ];

  return (
    <header className="app-shell-header">
      <div className="container app-shell-header-inner">
        <Link className="app-brand" to={isAuthenticated ? dashboardPath : '/'}>
          HireMe
        </Link>

        <nav className="app-shell-nav" aria-label="Primary">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              className={({ isActive }) => `app-shell-link${isActive ? ' is-active' : ''}`}
              to={to}
              end={to === dashboardPath || to === '/'}
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
            <div className="app-shell-notifications">
              <NotificationDropdown />
            </div>

            <div className="app-shell-avatar-wrap" ref={menuRef}>
              <button
                className="app-shell-avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
              >
                {user?.profilePictureUrl ? (
                  <img
                    src={buildAssetUrl(user.profilePictureUrl)}
                    alt=""
                    className="app-shell-avatar-img"
                  />
                ) : (
                  <span className="app-shell-avatar-letter">
                    {(user?.name || userRole || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div className="app-shell-avatar-menu">
                  <Link
                    className="app-shell-menu-item"
                    to={profilePath}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="app-shell-menu-divider" />
                  <button className="app-shell-menu-item" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
