import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

/**
 * ProtectedRoute component to check authentication and role before rendering children
 * @param {Object} props - Component props 
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} [props.requiredRole] - Optional role requirement (candidate or recruiter)
 * @returns {React.ReactNode} - Either the children or redirect
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    // Check authentication
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    // If authenticated and a role is required, check if user has that role
    if (authenticated && requiredRole) {
      const userRole = authService.getUserRole();
      setHasRequiredRole(userRole === requiredRole);
    } else {
      setHasRequiredRole(true); // No role requirement or not authenticated
    }

    setIsLoading(false);
  }, [requiredRole]);

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

  // If authenticated and has the required role (or no role required), render children
  return children;
};

export default ProtectedRoute; 