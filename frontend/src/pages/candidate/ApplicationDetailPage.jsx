import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaSpinner,
} from 'react-icons/fa';
import { applicationService, buildAssetUrl } from '../../services/api';
import '../recruiter/ApplicationDetailPage.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const CandidateApplicationDetailPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await applicationService.getApplicationById(applicationId);
        if (!response.success) {
          throw new Error(response.message || 'Failed to load application.');
        }

        setApplication(response.data);
      } catch (err) {
        console.error('Error loading application:', err);
        setError(err.message || 'Unable to load application.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const handleOpenResume = async (scope) => {
    try {
      setError('');
      await applicationService.viewApplicationResume(applicationId, scope);
    } catch (err) {
      setError(err.message || 'Unable to open the resume right now.');
    }
  };

  const handleDownloadResume = async (scope) => {
    try {
      setError('');
      const suffix = scope === 'profile' ? 'profile-resume' : 'submitted-resume';
      await applicationService.downloadApplicationResume(applicationId, scope, `${suffix}.pdf`);
    } catch (err) {
      setError(err.message || 'Unable to download the resume right now.');
    }
  };

  const candidate = application?.candidate;
  const submittedProfile = application?.submittedProfile || {};
  const job = application?.job;
  const currentAvatarSrc = candidate?.profilePictureUrl ? buildAssetUrl(candidate.profilePictureUrl) : '';
  const submittedAvatarSrc = submittedProfile?.profilePictureUrl
    ? buildAssetUrl(submittedProfile.profilePictureUrl)
    : '';

  const currentSkills = useMemo(
    () => (candidate?.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean),
    [candidate?.skills]
  );
  const submittedSkills = useMemo(
    () => (submittedProfile?.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean),
    [submittedProfile?.skills]
  );

  if (loading) {
    return (
      <div className="application-detail-loading">
        <FaSpinner className="application-detail-spinner" />
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="application-detail-loading">
        <div className="application-detail-banner error">{error}</div>
      </div>
    );
  }

  if (!application || !job) {
    return (
      <div className="application-detail-loading">
        <div className="application-detail-banner error">Application not found.</div>
      </div>
    );
  }

  return (
    <div className="application-detail page-shell">
      {/* Header */}
      <section className="application-detail-header surface-card">
        <div className="application-detail-header-copy">
          <div className="application-detail-header-top">
            <span className={`signal-chip ${application.stage === 'rejected' || application.stage === 'interview_cancelled' ? 'alert' : 'active'}`}>
              {application.stageLabel}
            </span>
          </div>
          <h1>{job.title}</h1>
          <div className="application-detail-header-meta">
            <span>{job.company}</span>
            {job.location && <span>{job.location}</span>}
            <span>Applied {formatDate(application.createdAt)}</span>
          </div>
        </div>

        <div className="application-detail-header-actions">
          <button
            type="button"
            className="action-link ghost"
            onClick={() => navigate('/dashboard/candidate/applications')}
          >
            <FaArrowLeft /> Back
          </button>
          <Link to="/dashboard/candidate/profile" className="action-link ghost">
            My profile
          </Link>
        </div>
      </section>

      {error && <div className="application-detail-banner error">{error}</div>}

      <section className="application-detail-layout">
        {/* Main */}
        <main className="application-detail-main">
          {/* Resume */}
          <article className="application-detail-card surface-card">
            <h2>Submitted resume</h2>
            <div className="application-detail-info-block">
              <strong>
                {application.submittedResume?.available
                  ? application.submittedResume.fileName || 'Resume attached'
                  : 'No resume attached'}
              </strong>
              <span className="application-detail-resume-type">
                {application.resumeSource === 'job-specific' ? 'Job-specific upload' : 'Profile resume'}
              </span>
              <div className="application-detail-inline-actions">
                <button
                  type="button"
                  className="action-link ghost"
                  onClick={() => handleOpenResume('submitted')}
                  disabled={!application.submittedResume?.available}
                >
                  <FaEye /> View
                </button>
                <button
                  type="button"
                  className="action-link ghost"
                  onClick={() => handleDownloadResume('submitted')}
                  disabled={!application.submittedResume?.available}
                >
                  <FaDownload /> Download
                </button>
              </div>
            </div>
          </article>

          {/* Notes */}
          {application.candidateNotes && (
            <article className="application-detail-card surface-card">
              <h2>Your notes</h2>
              <p>{application.candidateNotes}</p>
            </article>
          )}

          {/* Submitted profile snapshot */}
          <article className="application-detail-card surface-card">
            <h2>Profile at submission</h2>

            <div className="application-detail-profile-head">
              {submittedAvatarSrc ? (
                <div className="application-detail-avatar">
                  <img src={submittedAvatarSrc} alt={submittedProfile.name || candidate?.name || 'Candidate'} />
                </div>
              ) : (
                <div className="application-detail-avatar">
                  {(submittedProfile.name || candidate?.name || 'C').charAt(0)}
                </div>
              )}
              <div className="application-detail-profile-copy">
                <strong>{submittedProfile.name || candidate?.name || 'Candidate'}</strong>
                {submittedProfile.headline && <span>{submittedProfile.headline}</span>}
                {submittedProfile.email && <span><FaEnvelope /> {submittedProfile.email}</span>}
              </div>
            </div>

            <div className="application-detail-profile-grid">
              {submittedProfile.location && <span><FaMapMarkerAlt /> {submittedProfile.location}</span>}
              {submittedProfile.phone && <span><FaPhone /> {submittedProfile.phone}</span>}
              {submittedProfile.linkedin && (
                <a href={submittedProfile.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
              {submittedProfile.experience && <span>Experience: {submittedProfile.experience}</span>}
            </div>

            {submittedProfile.bio && (
              <p className="application-detail-bio">{submittedProfile.bio}</p>
            )}

            {submittedSkills.length > 0 && (
              <div className="application-detail-skills">
                {submittedSkills.map((skill) => (
                  <span key={skill} className="application-detail-skill-pill">{skill}</span>
                ))}
              </div>
            )}
          </article>
        </main>

        {/* Sidebar */}
        <aside className="application-detail-sidebar">
          <article className="application-detail-profile surface-card">
            <h2>Current profile</h2>

            {candidate && (
              <>
                <div className="application-detail-profile-head">
                  {currentAvatarSrc ? (
                    <div className="application-detail-avatar">
                      <img src={currentAvatarSrc} alt={candidate.name} />
                    </div>
                  ) : (
                    <div className="application-detail-avatar">{candidate.name.charAt(0)}</div>
                  )}
                  <div className="application-detail-profile-copy">
                    <strong>{candidate.name}</strong>
                    {candidate.headline && <span>{candidate.headline}</span>}
                    <span><FaEnvelope /> {candidate.email}</span>
                  </div>
                </div>

                <div className="application-detail-profile-grid">
                  {candidate.location && <span><FaMapMarkerAlt /> {candidate.location}</span>}
                  {candidate.phone && <span><FaPhone /> {candidate.phone}</span>}
                  {candidate.linkedin && (
                    <a href={candidate.linkedin} target="_blank" rel="noreferrer">
                      <FaLinkedin /> LinkedIn
                    </a>
                  )}
                </div>

                {currentSkills.length > 0 && (
                  <div className="application-detail-skills">
                    {currentSkills.map((skill) => (
                      <span key={skill} className="application-detail-skill-pill">{skill}</span>
                    ))}
                  </div>
                )}

                {application.profileResume?.available && (
                  <div className="application-detail-info-block">
                    <strong>{application.profileResume.fileName || 'Profile resume'}</strong>
                    <div className="application-detail-inline-actions">
                      <button
                        type="button"
                        className="action-link ghost"
                        onClick={() => handleOpenResume('profile')}
                      >
                        <FaEye /> View
                      </button>
                      <button
                        type="button"
                        className="action-link ghost"
                        onClick={() => handleDownloadResume('profile')}
                      >
                        <FaDownload /> Download
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <Link to="/dashboard/candidate/profile" className="action-link secondary">
              Open full profile
            </Link>
          </article>
        </aside>
      </section>
    </div>
  );
};

export default CandidateApplicationDetailPage;
