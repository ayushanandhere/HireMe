import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../AuthPages.css';
import { authService, recruiterService } from '../../services/api';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const RecruiterLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email'); return; }

    setError('');
    setLoading(true);

    try {
      const response = await recruiterService.login(email, password);
      if (response.success) {
        navigate(authService.getDefaultRoute(response.data));
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Recruiter sign in</h2>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" className="form-control" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" className="form-control" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="forgot-password">
            <Link to="/forgot-password?role=recruiter" className="auth-link">Forgot password?</Link>
          </div>
          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="divider"><span>or</span></div>

        <div className="social-login">
          <GoogleAuthButton role="recruiter" mode="login" onError={setError} onSuccess={(user) => navigate(authService.getDefaultRoute(user))} />
        </div>

        <div className="auth-footer">
          No account? <Link to="/register/recruiter" className="auth-link">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLoginPage;
