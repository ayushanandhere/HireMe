import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const [role, setRole] = useState(initialRole === 'recruiter' ? 'recruiter' : 'candidate');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const loginPath = useMemo(() => `/login/${role}`, [role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetUrl('');

    try {
      const response = await authService.requestPasswordReset(role, email);
      setMessage(response.message || 'Reset instructions have been prepared.');
      setResetUrl(response.resetUrl || '');
    } catch (err) {
      setError(err.message || 'Unable to start password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow auth-inline-eyebrow">Account recovery</span>
          <h2>Reset Password</h2>
          <p className="auth-subtitle">Request a reset link for your candidate or recruiter account.</p>
        </div>

        <div className="auth-meta-grid">
          <div className="auth-meta-card signal-positive">
            <strong>Fastest path</strong>
            <span>Choose the correct account type first so the reset goes to the right auth flow.</span>
          </div>
          <div className="auth-meta-card signal-ai">
            <strong>Local testing</strong>
            <span>When running locally, the reset link appears below so you can continue immediately.</span>
          </div>
          <div className="auth-meta-card signal-active">
            <strong>Next step</strong>
            <span>After reset, you return straight to the appropriate sign-in route.</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
        {resetUrl && (
          <div className="auth-info">
            Local reset link: <a href={resetUrl}>{resetUrl}</a>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="role">Account type</label>
            <select
              id="role"
              className="form-control"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Preparing...' : 'Send reset link'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Back to <Link to={loginPath} className="auth-link">sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
