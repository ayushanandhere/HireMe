import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBriefcase,
  FaBuilding,
  FaFileAlt,
  FaInfoCircle,
  FaMicrophone,
  FaSpinner
} from 'react-icons/fa';
import { authService, applicationService } from '../../services/api';
import './MyApplicationsPage.css';

const stageLabels = {
  new_application: 'New',
  resume_screened: 'Screened',
  job_matched: 'Matched',
  interview_requested: 'Interview requested',
  interview_scheduled: 'Interview scheduled',
  interview_completed: 'Interview completed',
  interview_cancelled: 'Interview cancelled',
  offer_extended: 'Offer extended',
  offer_accepted: 'Offer accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

const compactStageLabels = {
  new_application: 'New',
  resume_screened: 'Screened',
  job_matched: 'Matched',
  interview_requested: 'Interview',
  interview_scheduled: 'Scheduled',
  interview_completed: 'Completed',
  interview_cancelled: 'Cancelled',
  offer_extended: 'Offer',
  offer_accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

const getStageTone = (stage) => {
  if (['job_matched', 'offer_extended', 'offer_accepted', 'interview_completed'].includes(stage)) {
    return 'positive';
  }
  if (['resume_screened', 'interview_scheduled'].includes(stage)) {
    return 'active';
  }
  if (['new_application', 'interview_requested'].includes(stage)) {
    return 'review';
  }
  return 'alert';
};

const getApplicationNote = (stage) => {
  switch (stage) {
    case 'new_application':
      return {
        tone: 'review',
        text: 'Application received. Awaiting recruiter review.',
      };
    case 'resume_screened':
      return {
        tone: 'active',
        text: 'Resume screened. Waiting for the next recruiter decision.',
      };
    case 'job_matched':
      return {
        tone: 'positive',
        text: 'Strong role fit signal recorded for this application.',
      };
    case 'interview_requested':
      return {
        tone: 'review',
        text: 'Interview requested by recruiter.',
      };
    case 'interview_scheduled':
      return {
        tone: 'active',
        text: 'Interview scheduled.',
      };
    case 'interview_completed':
      return {
        tone: 'positive',
        text: 'Interview completed. Waiting for recruiter feedback.',
      };
    case 'offer_extended':
      return {
        tone: 'positive',
        text: 'Offer extended. Review the next steps carefully.',
      };
    case 'offer_accepted':
      return {
        tone: 'positive',
        text: 'Offer accepted.',
      };
    case 'rejected':
      return {
        tone: 'alert',
        text: 'Application closed.',
      };
    case 'interview_cancelled':
      return {
        tone: 'alert',
        text: 'Interview cancelled.',
      };
    case 'withdrawn':
      return {
        tone: 'alert',
        text: 'Application withdrawn.',
      };
    default:
      return {
        tone: 'active',
        text: 'Status updated.',
      };
  }
};

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const userData = authService.getUser();
      if (!userData || !userData._id) {
        throw new Error('User data not found');
      }

      const data = await applicationService.getCandidateApplications(userData._id);

      if (data.success) {
        setApplications(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch applications');
      }
    } catch (err) {
      setError('Error fetching your applications. Please try again.');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const visibleApplications = applications.filter((application) => application?.job?._id);

  const activeCount = visibleApplications.filter(
    (application) => !['rejected', 'withdrawn', 'interview_cancelled'].includes(application.stage)
  ).length;
  const interviewCount = visibleApplications.filter((application) =>
    ['interview_requested', 'interview_scheduled', 'interview_completed'].includes(application.stage)
  ).length;
  const offerCount = visibleApplications.filter((application) =>
    ['offer_extended', 'offer_accepted'].includes(application.stage)
  ).length;

  if (loading) {
    return (
      <div className="applications-hub-loading">
        <FaSpinner className="applications-hub-spinner" />
      </div>
    );
  }

  return (
    <div className="applications-hub page-shell">
      <section className="applications-header">
        <div className="applications-header-left">
          <h1>Applications</h1>
          <div className="applications-header-meta">
            <span className="signal-chip active">{visibleApplications.length} total</span>
            {activeCount > 0 && (
              <span className="signal-chip positive">{activeCount} active</span>
            )}
            {interviewCount > 0 && (
              <span className="signal-chip review">{interviewCount} interviews</span>
            )}
            {offerCount > 0 && (
              <span className="signal-chip positive">{offerCount} offers</span>
            )}
          </div>
        </div>
        <div className="applications-header-actions">
          <Link to="/dashboard/candidate/jobs" className="action-link primary">
            Browse jobs <FaArrowRight />
          </Link>
          <Link to="/dashboard/candidate" className="action-link ghost">
            Dashboard
          </Link>
        </div>
      </section>

      {error && (
        <div className="applications-error">
          <FaInfoCircle /> {error}
        </div>
      )}

      {visibleApplications.length === 0 ? (
        <section className="applications-empty surface-card">
          <FaFileAlt />
          <h2>No applications yet.</h2>
          <Link to="/dashboard/candidate/jobs" className="action-link primary">
            Browse jobs
          </Link>
        </section>
      ) : (
        <section className="applications-grid">
          {visibleApplications.map((application) => {
            const tone = getStageTone(application.stage);
            const stageLabel = compactStageLabels[application.stage] || application.stage;
            const stageFullLabel = stageLabels[application.stage] || application.stage;
            const matchScore = application.matchScore || application.candidateRoleFit || 0;
            const note = getApplicationNote(application.stage);

            return (
              <article key={application._id} className="application-card surface-card">
                <div className="application-card-top">
                  <span className={`signal-chip ${tone}`} title={stageFullLabel}>
                    {stageLabel}
                  </span>
                  <span className="application-date mono">{formatDate(application.createdAt)}</span>
                </div>

                <div className="application-card-head">
                  <div>
                    <h3>{application.job?.title}</h3>
                    <span>
                      <FaBuilding /> {application.job?.company}
                    </span>
                  </div>
                  {matchScore > 0 && (
                    <div className="application-score-pill">
                      <span className="mono">Fit</span>
                      <strong>{matchScore}%</strong>
                    </div>
                  )}
                </div>

                <div className="application-meta">
                  {application.job?.type && (
                    <span>
                      <FaBriefcase /> {application.job.type}
                    </span>
                  )}
                  {application.job?.location && <span>{application.job.location}</span>}
                </div>

                {matchScore > 0 && (
                  <div className="application-meter">
                    <div className="application-meter-track">
                      <div
                        className={`application-meter-bar tone-${tone}`}
                        style={{ width: `${Math.max(matchScore, 6)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className={`application-note ${note.tone}`}>{note.text}</div>

                <div className="application-card-actions">
                  <Link
                    to={`/dashboard/candidate/applications/${application._id}`}
                    className="action-link secondary"
                  >
                    Details
                  </Link>
                  <Link to={`/application/${application._id}/training`} className="action-link ghost">
                    Training
                  </Link>
                  <Link
                    to={`/application/${application._id}/mock-interview`}
                    className="action-link ghost"
                  >
                    <FaMicrophone /> Mock
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default MyApplicationsPage;
