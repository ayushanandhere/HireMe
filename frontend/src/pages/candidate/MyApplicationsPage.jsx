import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaFileAlt,
  FaInfoCircle,
  FaMicrophone,
  FaSearch,
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
      month: 'long',
      day: 'numeric'
    });
  };

  const activeCount = applications.filter(
    (application) => !['rejected', 'withdrawn', 'interview_cancelled'].includes(application.stage)
  ).length;
  const interviewCount = applications.filter((application) =>
    ['interview_requested', 'interview_scheduled', 'interview_completed'].includes(application.stage)
  ).length;
  const offerCount = applications.filter((application) =>
    ['offer_extended', 'offer_accepted'].includes(application.stage)
  ).length;

  if (loading) {
    return (
      <div className="applications-hub-loading">
        <FaSpinner className="applications-hub-spinner" />
        <p>Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="applications-hub page-shell">
      <section className="applications-hero">
        <article className="applications-hero-copy surface-card">
          <span className="eyebrow">Pipeline tracker</span>
          <h1>Read the pipeline before it surprises you.</h1>
          <p>
            Every application is a live signal. Track stage movement, open prep workflows at the
            right moment, and avoid drifting out of position.
          </p>
          <div className="applications-hero-actions">
            <Link to="/dashboard/candidate/jobs" className="action-link primary">
              Browse more roles <FaArrowRight />
            </Link>
            <Link to="/dashboard/candidate" className="action-link ghost">
              Return to overview
            </Link>
          </div>
        </article>

        <article className="applications-hero-panel instrument-card">
          <div className="applications-hero-head">
            <span className="eyebrow eyebrow-dark">Signal summary</span>
            <span className="signal-chip ai">Tracked pipeline</span>
          </div>
          <div className="applications-hero-stats">
            <div>
              <span className="applications-stat-label">Total</span>
              <strong>{applications.length}</strong>
            </div>
            <div>
              <span className="applications-stat-label">Active</span>
              <strong>{activeCount}</strong>
            </div>
            <div>
              <span className="applications-stat-label">Interviews</span>
              <strong>{interviewCount}</strong>
            </div>
            <div>
              <span className="applications-stat-label">Offers</span>
              <strong>{offerCount}</strong>
            </div>
          </div>
        </article>
      </section>

      {error && (
        <div className="applications-error">
          <FaInfoCircle /> {error}
        </div>
      )}

      {applications.length === 0 ? (
        <section className="applications-empty surface-card">
          <FaFileAlt />
          <h2>No applications tracked yet.</h2>
          <p>Start with a role worth pursuing, then return here to monitor movement and prep.</p>
          <Link to="/dashboard/candidate/jobs" className="action-link primary">
            Browse available jobs
          </Link>
        </section>
      ) : (
        <section className="applications-grid">
          {applications.map((application) => {
            const tone = getStageTone(application.stage);
            const stageLabel = stageLabels[application.stage] || application.stage;
            const matchScore = application.matchScore || application.candidateRoleFit || 0;
            const feedbackScore = application.feedbackScore || 0;

            return (
              <article key={application._id} className="application-card surface-card">
                <div className="application-card-top">
                  <span className={`signal-chip ${tone}`}>{stageLabel}</span>
                  <span className="application-date mono">{formatDate(application.createdAt)}</span>
                </div>

                <div className="application-card-head">
                  <div>
                    <h3>{application.job?.title}</h3>
                    <span>
                      <FaBuilding /> {application.job?.company}
                    </span>
                  </div>
                  <div className="application-score-pill">
                    <span className="mono">Fit</span>
                    <strong>{matchScore}%</strong>
                  </div>
                </div>

                <div className="application-meta">
                  <span>
                    <FaBriefcase /> {application.job?.type || 'Role'}
                  </span>
                  {application.job?.location && <span>{application.job.location}</span>}
                  {feedbackScore > 0 && <span>Feedback {feedbackScore}%</span>}
                </div>

                {matchScore > 0 && (
                  <div className="application-meter">
                    <div className="application-meter-head">
                      <span>Candidate-role fit</span>
                      <strong>{matchScore}%</strong>
                    </div>
                    <div className="application-meter-track">
                      <div
                        className={`application-meter-bar tone-${tone}`}
                        style={{ width: `${Math.max(matchScore, 6)}%` }}
                      />
                    </div>
                  </div>
                )}

                {application.stage === 'interview_requested' && (
                  <div className="application-note review">
                    Recruiter has requested an interview. Open prep before the schedule lands.
                  </div>
                )}
                {application.stage === 'interview_scheduled' && (
                  <div className="application-note active">
                    Interview is scheduled. This application is now in execution mode.
                  </div>
                )}
                {application.stage === 'rejected' && (
                  <div className="application-note alert">
                    This role is closed. Use the signal to tighten the next application.
                  </div>
                )}
                {application.stage === 'interview_cancelled' && (
                  <div className="application-note alert">
                    Interview was cancelled. Watch for rescheduling before redirecting effort.
                  </div>
                )}

                <div className="application-card-actions">
                  <Link
                    to={`/dashboard/candidate/applications/${application._id}`}
                    className="action-link secondary"
                  >
                    Review packet
                  </Link>
                  <Link to={`/application/${application._id}/training`} className="action-link ghost">
                    Training room
                  </Link>
                  <Link
                    to={`/application/${application._id}/mock-interview`}
                    className="action-link ghost"
                  >
                    <FaMicrophone /> Mock interview
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
