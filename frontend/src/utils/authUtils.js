import { authService } from '../services/api';

/**
 * Check if the user is authenticated and redirect them based on their role
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} - Whether the user is authenticated
 */
export const checkAuthAndRedirect = (navigate) => {
  if (authService.isAuthenticated()) {
    const userRole = authService.getUserRole();
    
    // Redirect based on user role
    if (userRole === 'candidate') {
      navigate('/dashboard/candidate');
    } else if (userRole === 'recruiter') {
      navigate('/dashboard/recruiter');
    }
    
    return true;
  }
  
  return false;
};

/**
 * Get the authenticated user from localStorage
 * @returns {Object|null} - The user object or null if not authenticated
 */
export const getAuthUser = () => {
  return authService.getUser();
};

/**
 * Check if the user has the required role
 * @param {string} requiredRole - The role required to access a page
 * @returns {boolean} - Whether the user has the required role
 */
export const hasRole = (requiredRole) => {
  if (!authService.isAuthenticated()) {
    return false;
  }
  
  const userRole = authService.getUserRole();
  return userRole === requiredRole;
};

/**
 * Log out the user and redirect to the home page
 * @param {Function} navigate - React Router navigate function
 */
export const logoutUser = (navigate) => {
  authService.logout();
  navigate('/');
}; 