import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFileAlt,
  FaLinkedin,
  FaMagic,
  FaMapMarkerAlt,
  FaPhone,
  FaSpinner,
} from 'react-icons/fa';
import EnhancedResumeAnalysis from '../../components/EnhancedResumeAnalysis';
import { applicationService, buildAssetUrl } from '../../services/api';
import './ApplicationDetailPage.css';

const stageToneMap = {
  new_application: 'review',
  resume_screened: 'active',
  job_matched: 'positive',
  interview_requested: 'review',
  interview_scheduled: 'active',
  interview_completed: 'positive',
  rejected: 'alert',
  withdrawn: 'alert',
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ApplicationDetailPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
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

  const loadAnalysis = async () => {
    if (!application) {
      return;
    }

    try {
      setLoadingAnalysis(true);
      setError('');

      const response = application.stage === 'new_application'
        ? await applicationService.parseResume(application._id)
        : await applicationService.getResumeAnalysis(application._id);

      if (!response.success) {
        throw new Error(response.message || 'Unable to analyze the submitted resume.');
      }

      if (response.data.application) {
        setApplication(response.data.application);
      }

      setAnalysis({
        enhancedAnalysis: response.data.parsedResume?.enhancedAnalysis || response.data.enhancedAnalysis,
        resumeSource: response.data.resumeSource
          || response.data.application?.resumeSource
          || application.resumeSource,
      });
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err.message || 'Unable to analyze the submitted resume.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

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
      const baseName = (application?.candidate?.name || 'candidate')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const suffix = scope === 'profile' ? 'profile-resume' : 'submitted-resume';
      await applicationService.downloadApplicationResume(
        applicationId,
        scope,
        `${baseName || 'candidate'}-${suffix}.pdf`
      );
    } catch (err) {
      setError(err.message || 'Unable to download the resume right now.');
    }
  };

  const candidate = application?.candidate;
  const submittedProfile = application?.submittedProfile || {};
  const job = application?.job;
  const stageTone = application ? stageToneMap[application.stage] || 'review' : 'review';
  const avatarSrc = candidate?.profilePictureUrl ? buildAssetUrl(candidate.profilePictureUrl) : '';
  const submittedAvatarSrc = submittedProfile?.profilePictureUrl
    ? buildAssetUrl(submittedProfile.profilePictureUrl)
    : '';
  const skills = useMemo(
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

  if (!application || !candidate || !job) {
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
            <span className="eyebrow">Application review</span>
            <span className={`signal-chip ${stageTone}`}>{application.stageLabel}</span>
          </div>
          <h1>{candidate.name}</h1>
          <div className="application-detail-header-meta">
            <span>{job.title}</span>
            <span>{job.company}</span>
            <span>Applied {formatDate(application.createdAt)}</span>
            <span>{application.resumeSource === 'job-specific' ? 'Custom resume submitted' : 'Profile resume submitted'}</span>
          </div>
        </div>

        <div className="application-detail-header-actions">
          <button
            type="button"
            className="action-link ghost"
            onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/applications`)}
          >
            <FaArrowLeft /> Back to applications
          </button>
          <Link
            to={`/dashboard/recruiter/candidates/${candidate._id}`}
            className="action-link secondary"
          >
            Candidate profile
          </Link>
        </div>
      </section>

      {error && <div className="application-detail-banner error">{error}</div>}

      <section className="application-detail-layout">
        <main className="application-detail-main">
          <article className="application-detail-card surface-card">
            <div className="application-detail-card-head">
              <div>
                <span className="eyebrow">Submitted application</span>
                <h2>Application packet</h2>
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
                    ? 'Candidate uploaded a separate resume for this role.'
                    : 'Candidate used the resume that was on profile at the time of application.'}
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
                <span className="application-detail-label">Candidate notes</span>
                <strong>{application.candidateNotes ? 'Provided' : 'Not provided'}</strong>
                <p>{application.candidateNotes || 'No additional notes were included with this application.'}</p>
              </div>
            </div>

            <div className="application-detail-profile-head submitted">
              {submittedAvatarSrc ? (
                <div className="application-detail-avatar">
                  <img src={submittedAvatarSrc} alt={submittedProfile.name || candidate.name} />
                </div>
              ) : (
                <div className="application-detail-avatar">
                  {(submittedProfile.name || candidate.name).charAt(0)}
                </div>
              )}
              <div className="application-detail-profile-copy">
                <strong>{submittedProfile.name || candidate.name}</strong>
                {submittedProfile.headline && <span>{submittedProfile.headline}</span>}
                <span><FaEnvelope /> {submittedProfile.email || candidate.email}</span>
              </div>
            </div>

            <div className="application-detail-profile-grid">
              {submittedProfile.location && (
                <span><FaMapMarkerAlt /> {submittedProfile.location}</span>
              )}
              {submittedProfile.phone && (
                <span><FaPhone /> {submittedProfile.phone}</span>
              )}
              {submittedProfile.linkedin && (
                <a href={submittedProfile.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
              {submittedProfile.experience && (
                <span>Experience {submittedProfile.experience}</span>
              )}
            </div>

            <div className="application-detail-info-block compact">
              <span className="application-detail-label">Submitted summary</span>
              <p>{submittedProfile.bio || 'No profile summary was captured for this application.'}</p>
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

            <div className="application-detail-history">
              <h3>Application history</h3>
              <div className="application-detail-history-list">
                {(application.history || []).slice().reverse().map((entry, index) => (
                  <div key={`${entry.stage}-${index}`} className="application-detail-history-item">
                    <strong>{entry.stage?.replace(/_/g, ' ')}</strong>
                    <span>{formatDate(entry.timestamp)}</span>
                    <p>{entry.notes || 'No notes recorded.'}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="application-detail-card surface-card">
            <div className="application-detail-card-head">
              <div>
                <span className="eyebrow">Job-specific AI review</span>
                <h2>Submitted resume analysis</h2>
              </div>
              <button
                type="button"
                className="action-link primary"
                onClick={loadAnalysis}
                disabled={loadingAnalysis || !application.submittedResume?.available}
              >
                {loadingAnalysis ? (
                  <>
                    <FaSpinner className="application-detail-inline-spinner" /> Processing...
                  </>
                ) : (
                  <>
                    <FaMagic /> {application.stage === 'new_application' ? 'Parse submitted resume' : 'Refresh analysis'}
                  </>
                )}
              </button>
            </div>

            {analysis?.enhancedAnalysis ? (
              <EnhancedResumeAnalysis
                enhancedAnalysis={analysis.enhancedAnalysis}
                resumeSource={analysis.resumeSource === 'job-specific' ? 'job-specific' : 'generic'}
              />
            ) : (
              <div className="application-detail-empty">
                <FaFileAlt />
                <h3>No application analysis yet</h3>
                <p>
                  Run AI parsing from this section to evaluate the exact resume that was submitted for this role.
                </p>
              </div>
            )}
          </article>
        </main>

        <aside className="application-detail-sidebar">
          <article className="application-detail-profile surface-card">
            <div className="application-detail-card-head">
              <div>
                <span className="eyebrow">Candidate profile</span>
                <h2>Current profile</h2>
              </div>
            </div>

            <div className="application-detail-profile-head">
              {avatarSrc ? (
                <div className="application-detail-avatar">
                  <img src={avatarSrc} alt={candidate.name} />
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
              {candidate.location && (
                <span><FaMapMarkerAlt /> {candidate.location}</span>
              )}
              {candidate.phone && (
                <span><FaPhone /> {candidate.phone}</span>
              )}
              {candidate.linkedin && (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
            </div>

            <div className="application-detail-skills">
              {skills.length > 0 ? (
                skills.map((skill) => (
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

            <div className="application-detail-profile-actions">
              <Link to={`/dashboard/recruiter/candidates/${candidate._id}`} className="action-link secondary">
                Open full profile
              </Link>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};

export default ApplicationDetailPage;
