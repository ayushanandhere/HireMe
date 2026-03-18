import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, recruiterService } from '../../services/api';
import '../AuthPages.css';

const RecruiterCompleteProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await recruiterService.getProfile();
        if (response.success) {
          setFormData({
            name: response.data.name || '',
            company: response.data.company || '',
            phone: response.data.phone || '',
          });
        }
      } catch (err) {
        setError(err.message || 'Unable to load profile.');
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.company.trim()) {
      setError('Name and company are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await recruiterService.updateProfile(formData);
      if (!response.success) {
        throw new Error(response.message || 'Unable to complete profile.');
      }

      navigate('/dashboard/recruiter/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to complete profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="eyebrow auth-inline-eyebrow">Recruiter setup</span>
          <h2>Complete Recruiter Profile</h2>
          <p className="auth-subtitle">Confirm the company details you want candidates to see.</p>
        </div>

        <div className="auth-insight-grid">
          <div className="auth-insight-card">
            <strong>Why it matters</strong>
            <span>Candidates see this identity first. Clear company and recruiter details make outreach feel credible.</span>
          </div>
          <div className="auth-insight-card">
            <strong>Minimum needed</strong>
            <span>Your name, company, and a contact number so scheduling and interview coordination stay frictionless.</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-grid">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                className="form-control"
                value={formData.company}
                onChange={handleChange}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (123) 456-7890"
            />
            <small className="text-muted">Optional, but useful when interview coordination needs a direct line.</small>
          </div>

          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Finish setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruiterCompleteProfilePage;
