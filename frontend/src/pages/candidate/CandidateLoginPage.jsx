import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../AuthPages.css';
import { candidateService } from '../../services/api';

const CandidateLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Clear any previous messages
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      // Call the login API
      const response = await candidateService.login(email, password);
      
      if (response.success) {
        // Login successful
        setSuccessMessage('Login successful! Redirecting to dashboard...');
        
        // Auto-redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard/candidate');
        }, 1500);
      }
    } catch (error) {
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // Implement OAuth logic here
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Candidate Login</h2>
          <p className="auth-subtitle">Sign in to access your job search portal</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="forgot-password">
            <Link to="/candidate/forgot-password" className="auth-link">Forgot Password?</Link>
          </div>
          
          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <div className="social-login">
          <button 
            className="social-btn google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Sign in with Google
          </button>
        </div>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register/candidate" className="auth-link">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default CandidateLoginPage; 