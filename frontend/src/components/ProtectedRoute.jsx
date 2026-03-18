import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

/**
 * ProtectedRoute component to check authentication and role before rendering children
 * @param {Object} props - Component props 
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} [props.requiredRole] - Optional role requirement (candidate or recruiter)
 * @returns {React.ReactNode} - Either the children or redirect
 */
const ProtectedRoute = ({ children, requiredRole, allowIncompleteProfile = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      setIsLoading(true);

      if (!authService.isAuthenticated()) {
        if (!active) return;
        setIsAuthenticated(false);
        setHasRequiredRole(false);
        setNeedsProfileCompletion(false);
        setIsLoading(false);
        return;
      }

      const validation = await authService.validateSession();
      if (!active) return;

      if (!validation.isValid) {
        setIsAuthenticated(false);
        setHasRequiredRole(false);
        setNeedsProfileCompletion(false);
        setIsLoading(false);
        return;
      }

      const user = validation.user;
      setIsAuthenticated(true);
      setHasRequiredRole(requiredRole ? user.role === requiredRole : true);
      setNeedsProfileCompletion(user.needsProfileCompletion === true);
      setIsLoading(false);
    };

    checkAuth();

    return () => {
      active = false;
    };
  }, [requiredRole, location.pathname]);

  if (isLoading) {
    // Could show a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRequiredRole) {
    // If has wrong role, redirect to appropriate dashboard based on role
    const userRole = authService.getUserRole();
    if (userRole === 'candidate') {
      return <Navigate to="/dashboard/candidate" replace />;
    } else if (userRole === 'recruiter') {
      return <Navigate to="/dashboard/recruiter" replace />;
    } else {
      // Fallback to login if role is unknown
      return <Navigate to="/login" replace />;
    }
  }

  if (!allowIncompleteProfile && needsProfileCompletion) {
    return <Navigate to={authService.getDefaultRoute()} replace />;
  }

  // If authenticated and has the required role (or no role required), render children
  return children;
};

export default ProtectedRoute; 
