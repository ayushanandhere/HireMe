import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, candidateService } from '../../services/api';
import '../AuthPages.css';

const CandidateCompleteProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    skills: '',
    experience: '',
    resume: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await candidateService.getProfile();
        if (response.success) {
          setFormData((current) => ({
            ...current,
            skills: response.data.skills || '',
            experience: response.data.experience || '',
          }));
        }
      } catch (err) {
        setError(err.message || 'Unable to load profile.');
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'resume') {
      setFormData((current) => ({ ...current, resume: files?.[0] || null }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.skills.trim() || !formData.experience.trim()) {
      setError('Skills and experience are required.');
      return;
    }

    if (!formData.resume) {
      setError('Please upload your resume to continue.');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('skills', formData.skills);
      payload.append('experience', formData.experience);
      payload.append('resume', formData.resume);

      const response = await candidateService.updateProfile(payload);
      if (!response.success) {
        throw new Error(response.message || 'Unable to complete profile.');
      }

      navigate('/dashboard/candidate/profile', { replace: true });
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
          <span className="eyebrow auth-inline-eyebrow">Candidate setup</span>
          <h2>Complete Candidate Profile</h2>
          <p className="auth-subtitle">Add the minimum details needed for matching and applications.</p>
        </div>

        <div className="auth-insight-grid">
          <div className="auth-insight-card">
            <strong>What this unlocks</strong>
            <span>Role fit scoring, resume analysis, and job application access across the candidate workflow.</span>
          </div>
          <div className="auth-insight-card">
            <strong>What to provide</strong>
            <span>Skills, experience band, and your current resume. You can refine everything again later.</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-grid">
            <div className="form-group">
              <label htmlFor="skills">Skills</label>
              <input
                type="text"
                id="skills"
                name="skills"
                className="form-control"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, Product sense"
              />
            </div>

            <div className="form-group">
              <label htmlFor="experience">Experience</label>
              <select
                id="experience"
                name="experience"
                className="form-control"
                value={formData.experience}
                onChange={handleChange}
              >
                <option value="">Select experience</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="resume">Resume</label>
            <input
              type="file"
              id="resume"
              name="resume"
              className="form-control"
              accept=".pdf,application/pdf"
              onChange={handleChange}
            />
            <small className="text-muted">Upload a PDF so the matching engine has real evidence to parse.</small>
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

export default CandidateCompleteProfilePage;
