import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../AuthPages.css';
import { authService, candidateService } from '../../services/api';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const CandidateLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    
    // Clear any previous errors
    setError('');
    setLoading(true);
    
    try {
      const response = await candidateService.login(email, password);
      
      if (response.success) {
        navigate(response.data.profileComplete ? '/dashboard/candidate' : '/complete-profile/candidate');
      }
    } catch (error) {
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Candidate Login</h2>
          <p className="auth-subtitle">Sign in to access your candidate portal</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
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
            />
          </div>
          
          <div className="forgot-password">
            <Link to="/forgot-password?role=candidate" className="auth-link">Forgot Password?</Link>
          </div>
          
          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <div className="social-login">
          <GoogleAuthButton
            role="candidate"
            mode="login"
            onError={setError}
            onSuccess={(user) => navigate(authService.getDefaultRoute(user))}
          />
        </div>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register/candidate" className="auth-link">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default CandidateLoginPage; 
