import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaFileUpload,
  FaGlobe,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaSpinner
} from 'react-icons/fa';
import { applicationService, buildAssetUrl, candidateService, jobService } from '../../services/api';
import './JobApplicationPage.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const jobData = await jobService.getJobById(jobId);
        if (!jobData.success) {
          throw new Error(jobData.message || 'Failed to fetch job details');
        }

        const candidateData = await candidateService.getProfile();
        if (!candidateData.success) {
          throw new Error(candidateData.message || 'Failed to fetch candidate profile');
        }

        setJob(jobData.data);
        setCandidate(candidateData.data);

        const applicationsData = await applicationService.getCandidateApplications(candidateData.data._id);
        if (applicationsData.success) {
          const hasApplied = applicationsData.data.some(
            (application) => application.job?._id === jobId
          );
          setAlreadyApplied(hasApplied);

          if (hasApplied) {
            setSuccess('You have already applied for this role.');
          }
        }
      } catch (err) {
        setError(err.message || 'Error loading data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const handleResumeChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      setResumeFile(selectedFile);
      setUseExistingResume(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (useExistingResume && !candidate?.hasResume) {
        setError('Upload a resume before applying.');
        setSubmitting(false);
        return;
      }

      if (!useExistingResume && !resumeFile) {
        setError('Select a resume file before submitting.');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('candidateId', candidate._id);
      formData.append('jobId', jobId);
      formData.append('notes', notes);

      if (!useExistingResume && resumeFile) {
        formData.append('resume', resumeFile);
      }

      const data = await applicationService.createApplication(formData);

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess('Application submitted. Redirecting to Applications...');
      setAlreadyApplied(true);

      setTimeout(() => {
        navigate('/dashboard/candidate/applications');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error submitting application. Please try again.');
      console.error('Error submitting application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="job-apply-loading">
        <FaSpinner className="job-apply-spinner" />
        <p>Loading application...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-apply-loading">
        <div className="job-apply-banner error">
          <FaInfoCircle />
          <span>Job not found or no longer available.</span>
        </div>
      </div>
    );
  }

  const recruiterProfile = job.recruiterProfile;
  const recruiterName = recruiterProfile?.name || recruiterProfile?.company || 'Hiring team';
  const recruiterTitle = recruiterProfile?.title
    ? `${recruiterProfile.title}${recruiterProfile.company ? `, ${recruiterProfile.company}` : ''}`
    : recruiterProfile?.company || 'Recruiter';
  const recruiterAvatarLabel = recruiterName.charAt(0).toUpperCase();
  const skillList = Array.isArray(job.skills) ? job.skills : [];
  const usesStoredResume = candidate?.hasResume && useExistingResume;
  const submitDisabled = submitting || alreadyApplied;
  const submitLabel = alreadyApplied
    ? 'Already applied'
    : submitting
      ? 'Submitting...'
      : 'Submit application';

  return (
    <div className="job-apply page-shell">
      <section className="job-apply-header surface-card">
        <div className="job-apply-header-main">
          <div className="job-apply-header-top">
            <span className="job-apply-page-label">Application</span>
            {alreadyApplied && <span className="signal-chip positive">Already applied</span>}
          </div>

          <h1>{job.title}</h1>

          <div className="job-apply-header-meta">
            <span>
              <FaBuilding />
              {job.company}
            </span>
            {job.location && (
              <span>
                <FaMapMarkerAlt />
                {job.location}
              </span>
            )}
            {job.type && <span>{job.type}</span>}
            {job.experienceLevel && <span>{job.experienceLevel}</span>}
            <span>
              <FaCalendarAlt />
              {formatDate(job.createdAt)}
            </span>
          </div>

          <div className="job-apply-header-actions">
            <Link to="/dashboard/candidate/jobs" className="action-link ghost">
              <FaArrowLeft /> Back to listings
            </Link>
            <Link to="/dashboard/candidate/applications" className="action-link secondary">
              Applications
            </Link>
          </div>
        </div>

        {recruiterProfile && (
          <aside className="job-apply-contact-card">
            <div className="job-apply-contact-head">
              <span className="job-apply-page-label muted">Recruiter</span>
            </div>

            <div className="job-apply-contact-profile">
              <div className="job-apply-contact-avatar">
                {recruiterProfile.profilePictureUrl ? (
                  <img
                    src={buildAssetUrl(recruiterProfile.profilePictureUrl)}
                    alt={recruiterName}
                  />
                ) : (
                  <span>{recruiterAvatarLabel}</span>
                )}
              </div>

              <div className="job-apply-contact-copy">
                <strong>{recruiterName}</strong>
                <span>{recruiterTitle}</span>
              </div>
            </div>

            <div className="job-apply-contact-grid">
              <div>
                <span className="job-apply-meta-label">Resume</span>
                <strong>{candidate?.hasResume ? 'On file' : 'Required'}</strong>
              </div>
              <div>
                <span className="job-apply-meta-label">Status</span>
                <strong>{alreadyApplied ? 'Submitted' : 'Open'}</strong>
              </div>
            </div>

            {(recruiterProfile.location || recruiterProfile.companyWebsite) && (
              <div className="job-apply-contact-links">
                {recruiterProfile.location && (
                  <span>
                    <FaMapMarkerAlt />
                    {recruiterProfile.location}
                  </span>
                )}
                {recruiterProfile.companyWebsite && (
                  <a href={recruiterProfile.companyWebsite} target="_blank" rel="noreferrer">
                    <FaGlobe />
                    {recruiterProfile.companyWebsite.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}
          </aside>
        )}
      </section>

      {(error || success) && (
        <div className="job-apply-feedback-stack">
          {error && (
            <div className="job-apply-banner error">
              <FaInfoCircle />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="job-apply-banner success">
              <FaCheckCircle />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      <section className="job-apply-layout">
        <article className="job-apply-role-card surface-card">
          <div className="job-apply-section-heading">
            <h2>Role details</h2>
          </div>

          <section className="job-apply-section">
            <h3>Description</h3>
            <div className="job-apply-content-block">
              <p>{job.description}</p>
            </div>
          </section>

          {skillList.length > 0 && (
            <section className="job-apply-section">
              <h3>Required skills</h3>
              <div className="job-apply-skill-grid">
                {skillList.map((skill) => (
                  <span key={skill} className="job-apply-skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {job.educationRequirements && (
            <section className="job-apply-section">
              <h3>Education</h3>
              <div className="job-apply-content-block subdued">
                <p>{job.educationRequirements}</p>
              </div>
            </section>
          )}
        </article>

        <aside className="job-apply-sidebar">
          <article className="job-apply-form-card surface-card">
            <div className="job-apply-section-heading compact">
              <h2>Submit application</h2>
              <span className={`signal-chip ${candidate?.hasResume ? 'positive' : 'review'}`}>
                {candidate?.hasResume ? 'Resume on file' : 'Resume needed'}
              </span>
            </div>

            <form className="job-apply-form" onSubmit={handleSubmit}>
              <section className="job-apply-form-section">
                <label className="job-apply-form-label">Resume source</label>

                {candidate?.hasResume ? (
                  <div className="job-apply-choice-grid">
                    <label className={`job-apply-choice ${usesStoredResume ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="resumeMode"
                        checked={usesStoredResume}
                        onChange={() => setUseExistingResume(true)}
                      />
                      <span>Use profile resume</span>
                    </label>

                    <label className={`job-apply-choice ${!usesStoredResume ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="resumeMode"
                        checked={!usesStoredResume}
                        onChange={() => setUseExistingResume(false)}
                      />
                      <span>Upload new resume</span>
                    </label>
                  </div>
                ) : (
                  <div className="job-apply-inline-note review">
                    Resume upload is required.
                  </div>
                )}
              </section>

              {(!candidate?.hasResume || !usesStoredResume) && (
                <section className="job-apply-upload-card">
                  <label className="job-apply-file-picker" htmlFor="job-application-resume">
                    <FaFileUpload />
                    <span>{resumeFile ? 'Replace file' : 'Choose file'}</span>
                  </label>
                  <input
                    id="job-application-resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    required={!candidate?.hasResume}
                  />
                  <div className="job-apply-file-meta">
                    <strong>{resumeFile ? resumeFile.name : 'No file selected'}</strong>
                    <span>PDF, DOC, or DOCX</span>
                  </div>
                </section>
              )}

              <section className="job-apply-form-section">
                <label className="job-apply-form-label" htmlFor="application-notes">
                  Notes
                </label>
                <textarea
                  id="application-notes"
                  rows={5}
                  placeholder="Optional"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </section>

              <div className="job-apply-submit-row">
                <button type="submit" className="job-apply-submit" disabled={submitDisabled}>
                  <FaPaperPlane />
                  {submitLabel}
                </button>

                {alreadyApplied && (
                  <Link to="/dashboard/candidate/applications" className="action-link ghost">
                    View application
                  </Link>
                )}
              </div>
            </form>
          </article>
        </aside>
      </section>
    </div>
  );
};

export default JobApplicationPage;
