import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiRefreshCcw, FiShield } from 'react-icons/fi';
import { authService, persistAuthSession } from '../services/api';
import './AuthPages.css';

const getHashParams = () => {
  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(rawHash);
};

const GoogleAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = getHashParams();
    const token = params.get('token');
    const role = params.get('role');
    const user = params.get('user');
    const authError = params.get('error');

    if (authError) {
      setError(authError);
      return;
    }

    if (!token || !role || !user) {
      setError('Google authentication response was incomplete.');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      persistAuthSession(role, {
        ...parsedUser,
        token,
      });

      navigate(authService.getDefaultRoute({ ...parsedUser, token }), {
        replace: true,
      });
    } catch (parseError) {
      console.error('Error parsing Google auth callback payload:', parseError);
      setError('Unable to complete Google sign-in.');
    }
  }, [navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow auth-inline-eyebrow">
            {error ? <FiAlertCircle /> : <FiShield />}
            Google auth bridge
          </span>
          <h2>{error ? 'Google Sign-In Failed' : 'Completing Google Sign-In'}</h2>
          <p className="auth-subtitle">
            {error ? 'Review the error below and try again.' : 'Please wait while we sign you in.'}
          </p>
        </div>

        {error ? (
          <>
            <div className="auth-error">{error}</div>
            <div className="auth-insight-grid">
              <div className="auth-insight-card">
                <strong>Most common cause</strong>
                <span>The authentication window expired or the callback payload was incomplete.</span>
              </div>
              <div className="auth-insight-card">
                <strong>Best recovery path</strong>
                <span>Return to the sign-in screen and restart the role-specific Google flow.</span>
              </div>
            </div>
            <div className="auth-footer">
              <Link to="/login/candidate" className="auth-link">Candidate sign in</Link>
              {' · '}
              <Link to="/login/recruiter" className="auth-link">Recruiter sign in</Link>
            </div>
          </>
        ) : (
          <>
            <div className="auth-info">
              <FiRefreshCcw className="me-2" />
              Syncing your Google session with the correct HireMe workspace and redirect target.
            </div>
            <div className="auth-insight-grid">
              <div className="auth-insight-card">
                <strong>Role-aware redirect</strong>
                <span>You will be sent to the candidate or recruiter workspace that matches your account.</span>
              </div>
              <div className="auth-insight-card">
                <strong>Session persistence</strong>
                <span>Your token and profile context are being stored before navigation continues.</span>
              </div>
            </div>
            <div className="form-action">
            <button type="button" className="btn-submit" disabled>
              Signing you in...
            </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallbackPage;
