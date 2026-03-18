import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFileAlt,
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
    month: 'long',
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
  const recruiter = job?.recruiterProfile;
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
        <p>Loading application packet...</p>
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
      <section className="application-detail-header surface-card">
        <div className="application-detail-header-copy">
          <div className="application-detail-header-top">
            <span className="eyebrow">Application packet</span>
            <span className="signal-chip active">{application.stageLabel}</span>
          </div>
          <h1>{job.title}</h1>
          <div className="application-detail-header-meta">
            <span>{job.company}</span>
            {job.location && <span>{job.location}</span>}
            <span>Applied {formatDate(application.createdAt)}</span>
            <span>{application.resumeSource === 'job-specific' ? 'Custom resume submitted' : 'Profile resume submitted'}</span>
          </div>
        </div>

        <div className="application-detail-header-actions">
          <button
            type="button"
            className="action-link ghost"
            onClick={() => navigate('/dashboard/candidate/applications')}
          >
            <FaArrowLeft /> Back to applications
          </button>
          <Link to="/dashboard/candidate/profile" className="action-link secondary">
            My profile
          </Link>
        </div>
      </section>

      {error && <div className="application-detail-banner error">{error}</div>}

      <section className="application-detail-layout">
        <main className="application-detail-main">
          <article className="application-detail-card surface-card">
            <div className="application-detail-card-head">
              <div>
                <span className="eyebrow">Submitted details</span>
                <h2>Exact application sent</h2>
              </div>
              <span className="signal-chip active">
                {application.resumeSource === 'job-specific' ? 'Job-specific resume' : 'Profile resume'}
              </span>
            </div>

            <div className="application-detail-grid">
              <div className="application-detail-info-block">
                <span className="application-detail-label">Submitted resume</span>
                <strong>
                  {application.submittedResume?.available
                    ? application.submittedResume.fileName || 'Resume attached'
                    : 'No submitted resume'}
                </strong>
                <p>
                  {application.resumeSource === 'job-specific'
                    ? 'This role was submitted with a separate uploaded resume.'
                    : 'This role was submitted using the profile resume on file at that time.'}
                </p>
                <div className="application-detail-inline-actions">
                  <button
                    type="button"
                    className="action-link ghost"
                    onClick={() => handleOpenResume('submitted')}
                    disabled={!application.submittedResume?.available}
                  >
                    <FaEye /> View submitted resume
                  </button>
                  <button
                    type="button"
                    className="action-link ghost"
                    onClick={() => handleDownloadResume('submitted')}
                    disabled={!application.submittedResume?.available}
                  >
                    <FaDownload /> Download submitted resume
                  </button>
                </div>
              </div>

              <div className="application-detail-info-block">
                <span className="application-detail-label">Submitted notes</span>
                <strong>{application.candidateNotes ? 'Included' : 'Not included'}</strong>
                <p>{application.candidateNotes || 'No extra notes were sent with this application.'}</p>
              </div>
            </div>

            <div className="application-detail-profile-head submitted">
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
              {submittedProfile.experience && <span>Experience {submittedProfile.experience}</span>}
            </div>

            <div className="application-detail-info-block compact">
              <span className="application-detail-label">Submitted summary</span>
              <p>{submittedProfile.bio || 'No summary was included in the profile snapshot for this application.'}</p>
            </div>

            <div className="application-detail-skills">
              {submittedSkills.length > 0 ? (
                submittedSkills.map((skill) => (
                  <span key={skill} className="application-detail-skill-pill">
                    {skill}
                  </span>
                ))
              ) : (
                <p>No skills were captured in the submitted profile snapshot.</p>
              )}
            </div>
          </article>
        </main>

        <aside className="application-detail-sidebar">
          <article className="application-detail-profile surface-card">
            <div className="application-detail-card-head">
              <div>
                <span className="eyebrow">Current profile</span>
                <h2>Live profile now</h2>
              </div>
            </div>

            {recruiter && (
              <div className="application-detail-info-block compact">
                <span className="application-detail-label">Recruiter / role</span>
                <strong>{recruiter.name || job.company}</strong>
                <p>{job.company}{recruiter.title ? ` • ${recruiter.title}` : ''}</p>
              </div>
            )}

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

                <div className="application-detail-skills">
                  {currentSkills.length > 0 ? (
                    currentSkills.map((skill) => (
                      <span key={skill} className="application-detail-skill-pill">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p>No skills listed on the current profile.</p>
                  )}
                </div>

                <div className="application-detail-info-block compact">
                  <span className="application-detail-label">Current profile resume</span>
                  <strong>
                    {application.profileResume?.available
                      ? application.profileResume.fileName || 'Resume on profile'
                      : 'No profile resume'}
                  </strong>
                  <div className="application-detail-inline-actions">
                    <button
                      type="button"
                      className="action-link ghost"
                      onClick={() => handleOpenResume('profile')}
                      disabled={!application.profileResume?.available}
                    >
                      <FaEye /> View profile resume
                    </button>
                    <button
                      type="button"
                      className="action-link ghost"
                      onClick={() => handleDownloadResume('profile')}
                      disabled={!application.profileResume?.available}
                    >
                      <FaDownload /> Download profile resume
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="application-detail-profile-actions">
              <Link to="/dashboard/candidate/profile" className="action-link secondary">
                Open full profile
              </Link>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};

export default CandidateApplicationDetailPage;
