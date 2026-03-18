import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/api';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const { role, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(role, token, password);
      navigate(authService.getDefaultRoute(response.data), { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow auth-inline-eyebrow">Secure reset</span>
          <h2>Create New Password</h2>
          <p className="auth-subtitle">Choose a new password for your account.</p>
        </div>

        <div className="auth-insight-grid">
          <div className="auth-insight-card">
            <strong>Minimum requirement</strong>
            <span>Use at least six characters. Stronger passwords will protect both candidate and recruiter workflows.</span>
          </div>
          <div className="auth-insight-card">
            <strong>After confirmation</strong>
            <span>You will be routed back into the app using the same account role tied to this reset token.</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Back to <Link to={`/login/${role || 'candidate'}`} className="auth-link">sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
