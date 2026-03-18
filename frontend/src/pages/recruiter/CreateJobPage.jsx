import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaCode,
  FaGraduationCap,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { jobService, authService } from '../../services/api';
import './CreateJobPage.css';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'full-time',
    skills: '',
    experienceLevel: 'entry',
    experienceYears: '',
    applicationDeadline: '',
    educationRequirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = authService.getUser();
  const company = user?.company || user?.name || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.title || !formData.description) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      const response = await jobService.createJob({
        ...formData,
        company
      });

      if (response.success) {
        setSuccess('Job created successfully.');
        setTimeout(() => navigate('/dashboard/recruiter/jobs'), 1600);
      } else {
        setError(response.message || 'Failed to create job.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-creation-page page-shell">
      <section className="job-creation-hero">
        <article className="job-creation-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Role publishing</span>
          <h1>Create a role with clean matching signal.</h1>
          <p>
            Structure the position clearly so candidates, screening, and AI-assisted fit scoring all
            start from the same brief.
          </p>
          <div className="job-creation-hero-actions">
            <button
              type="button"
              className="action-link signal"
              onClick={() => navigate('/dashboard/recruiter/jobs')}
            >
              <FaArrowLeft /> Back to jobs
            </button>
          </div>
        </article>

        <article className="job-creation-company surface-card">
          <span className="eyebrow">Publisher</span>
          <div className="job-creation-company-mark">
            <FaBuilding />
          </div>
          <strong>{company || 'Recruiter workspace'}</strong>
          <p>Every job created here is attached to this company identity and routed into your recruiter pipeline.</p>
        </article>
      </section>

      {error && <div className="job-creation-message error">{error}</div>}
      {success && <div className="job-creation-message success">{success}</div>}

      <section className="job-creation-grid">
        <aside className="job-creation-guide surface-card">
          <div className="job-guide-block">
            <span className="eyebrow">What matters</span>
            <h3>Clear inputs produce better screening.</h3>
            <p>
              Title, description, skills, and experience constraints directly shape the signals you see
              later in job applications and interview prep.
            </p>
          </div>
          <div className="job-guide-list">
            <div className="job-guide-item">
              <strong>Title</strong>
              <span>Use the hiring-facing role name candidates recognize immediately.</span>
            </div>
            <div className="job-guide-item">
              <strong>Skills</strong>
              <span>List core technologies and competencies only. Avoid dumping full toolchains.</span>
            </div>
            <div className="job-guide-item">
              <strong>Description</strong>
              <span>Write responsibilities and expectations, not marketing copy.</span>
            </div>
          </div>
        </aside>

        <form className="job-creation-form surface-card" onSubmit={handleSubmit}>
          <div className="job-form-section">
            <div className="job-form-section-head">
              <span className="eyebrow">Role brief</span>
              <h2>Core job definition</h2>
            </div>

            <label className="job-field">
              <span><FaBriefcase /> Job Title *</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Senior Backend Engineer"
                required
              />
            </label>

            <label className="job-field">
              <span><FaCode /> Job Description *</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={7}
                placeholder="Describe the role, ownership, and technical expectations."
                required
              />
              <small>Use a concrete hiring brief. It becomes the baseline for analysis later.</small>
            </label>
          </div>

          <div className="job-form-section">
            <div className="job-form-section-head">
              <span className="eyebrow">Matching inputs</span>
              <h2>Constraints and filters</h2>
            </div>

            <div className="job-form-grid">
              <label className="job-field">
                <span><FaMapMarkerAlt /> Location</span>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Remote or Bengaluru"
                />
              </label>

              <label className="job-field">
                <span>Job Type</span>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </label>

              <label className="job-field job-field-full">
                <span>Skills</span>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Node.js, PostgreSQL, system design, REST APIs"
                />
                <small>Comma-separated skills used for downstream candidate matching.</small>
              </label>

              <label className="job-field">
                <span>Experience Level</span>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive Level</option>
                </select>
              </label>

              <label className="job-field">
                <span>Years of Experience</span>
                <select
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                >
                  <option value="">Select years</option>
                  <option value="0-1">0-1 years</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </label>

              <label className="job-field">
                <span><FaCalendarAlt /> Application Deadline</span>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                />
              </label>

              <label className="job-field job-field-full">
                <span><FaGraduationCap /> Education Requirements</span>
                <input
                  type="text"
                  name="educationRequirements"
                  value={formData.educationRequirements}
                  onChange={handleChange}
                  placeholder="Bachelor's degree in Computer Science or equivalent experience"
                />
              </label>
            </div>
          </div>

          <div className="job-form-actions">
            <button
              type="button"
              className="action-link ghost"
              onClick={() => navigate('/dashboard/recruiter/jobs')}
            >
              Cancel
            </button>
            <button type="submit" className="action-link primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreateJobPage;
