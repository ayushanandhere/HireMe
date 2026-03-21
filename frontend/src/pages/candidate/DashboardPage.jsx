import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaLightbulb, FaMicrophone, FaRegClock, FaSpinner } from 'react-icons/fa';
import { candidateService } from '../../services/api';
import './CandidateDashboard.css';

const stageLabels = {
  new_application: 'New',
  resume_screened: 'Screened',
  job_matched: 'Matched',
  interview_requested: 'Interview req.',
  interview_scheduled: 'Scheduled',
  interview_completed: 'Completed',
  offer_extended: 'Offer',
  offer_accepted: 'Accepted',
  interview_cancelled: 'Cancelled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const stageSequence = [
  'new_application', 'resume_screened', 'job_matched',
  'interview_requested', 'interview_scheduled', 'offer_extended',
];

const getStageTone = (stage) => {
  if (['job_matched', 'offer_extended', 'offer_accepted', 'interview_completed'].includes(stage)) return 'positive';
  if (['resume_screened', 'interview_scheduled'].includes(stage)) return 'active';
  if (['new_application', 'interview_requested'].includes(stage)) return 'review';
  return 'alert';
};

const CandidateDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await candidateService.getDashboardSummary();
        if (res.success) setSummary(res.data);
      } catch { /* noop */ } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <div className="cd-loading"><FaSpinner className="cd-spinner" /></div>;
  }

  if (!summary) {
    return <div className="cd-loading">Unable to load dashboard.</div>;
  }

  const recentApplications = summary.applicationSummary.recent || [];
  const upcomingInterviews = summary.interviewSummary.items || [];
  const recommendedJobs = summary.recommendedJobs || [];
  const resumeReady = summary.resumeStatus.hasResume;
  const riskCount =
    (summary.applicationSummary.stageCounts.rejected || 0) +
    (summary.applicationSummary.stageCounts.interview_cancelled || 0) +
    (summary.applicationSummary.stageCounts.withdrawn || 0);

  const nextInterview = upcomingInterviews[0];
  const recentApp = recentApplications[0];

  const nextMove = !resumeReady
    ? { tone: 'review', title: 'Upload your resume to get started', to: '/dashboard/candidate/profile' }
    : nextInterview
      ? { tone: 'active', title: `Prepare for ${nextInterview.position?.title || 'your next interview'}`, to: '/dashboard/candidate/interviews' }
      : recentApp
        ? { tone: 'positive', title: `Train for ${recentApp.job?.title || 'your application'}`, to: `/application/${recentApp._id}/training` }
        : { tone: 'review', title: 'Complete your profile and start applying', to: '/dashboard/candidate/profile' };

  const stageItems = stageSequence
    .map((s) => ({ stage: s, label: stageLabels[s], count: summary.applicationSummary.stageCounts[s] || 0, tone: getStageTone(s) }))
    .filter(({ count }) => count > 0);

  return (
    <div className="cd page-shell">
      {/* Header */}
      <header className="cd-header">
        <h1>Overview</h1>
        <div className="cd-header-right">
          <span className={`cd-chip ${resumeReady ? 'ok' : 'warn'}`}>
            {resumeReady ? 'Resume ready' : 'Resume missing'}
          </span>
        </div>
      </header>

      {/* Quick actions */}
      <div className="cd-actions">
        <Link to="/dashboard/candidate/jobs" className="action-link primary">Browse jobs <FaArrowRight /></Link>
        <Link to="/dashboard/candidate/applications" className="action-link ghost">Applications</Link>
        <Link to="/dashboard/candidate/profile" className="action-link ghost">Profile</Link>
      </div>

      {/* Next move */}
      <div className={`cd-next tone-${nextMove.tone}`}>
        <div className="cd-next-text">
          <strong>{nextMove.title}</strong>
          <span>Suggested next step</span>
        </div>
        <Link to={nextMove.to} className="action-link primary"><FaArrowRight /></Link>
      </div>

      {/* Stats */}
      <section className="cd-stats">
        <div className="cd-stat">
          <span className="cd-stat-label">Applications</span>
          <strong className="cd-stat-val">{summary.applicationSummary.total}</strong>
        </div>
        <div className="cd-stat">
          <span className="cd-stat-label">Interviews</span>
          <strong className="cd-stat-val">{summary.interviewSummary.upcoming}</strong>
        </div>
        <div className="cd-stat">
          <span className="cd-stat-label">Resume</span>
          <strong className="cd-stat-val">{resumeReady ? 'Ready' : '—'}</strong>
        </div>
        <div className="cd-stat">
          <span className="cd-stat-label">Recommended</span>
          <strong className="cd-stat-val">{recommendedJobs.length}</strong>
        </div>
      </section>

      {/* Pipeline */}
      {stageItems.length > 0 && (
        <section className="cd-section">
          <div className="cd-section-head">
            <h2>Pipeline</h2>
            <Link to="/dashboard/candidate/applications" className="cd-section-link">View all</Link>
          </div>
          <div className="cd-stages">
            {stageItems.map(({ stage, label, count, tone }) => (
              <div key={stage} className={`cd-stage tone-${tone}`}>
                <span className="cd-stage-dot" />
                <strong>{count}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {riskCount > 0 && (
            <div className="cd-stage-footer">
              <span className={`cd-chip warn`}>{riskCount} stalled or closed</span>
            </div>
          )}
        </section>
      )}

      {/* Interviews + Recent apps */}
      <div className="cd-two-col">
        <section className="cd-section">
          <div className="cd-section-head">
            <h2>Interviews</h2>
            <Link to="/dashboard/candidate/interviews" className="cd-section-link">View all</Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="cd-empty">No upcoming interviews</p>
          ) : (
            <div className="cd-list">
              {upcomingInterviews.map((iv) => (
                <div key={iv._id} className="cd-list-item">
                  <div className="cd-list-item-info">
                    <strong>{iv.position?.title || 'Interview'}</strong>
                    <span>{iv.recruiter?.company || iv.recruiter?.name}</span>
                  </div>
                  <div className="cd-list-right">
                    <span className="cd-list-time">
                      <FaRegClock /> {new Date(iv.scheduledDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="cd-section">
          <div className="cd-section-head">
            <h2>Recent applications</h2>
          </div>
          {recentApplications.length === 0 ? (
            <p className="cd-empty">No applications yet</p>
          ) : (
            <div className="cd-list">
              {recentApplications.map((app) => (
                <div key={app._id} className="cd-list-item">
                  <div className="cd-list-item-info">
                    <strong>{app.job?.title}</strong>
                    <span>{app.job?.company}</span>
                  </div>
                  <div className="cd-list-right">
                    <span className={`signal-chip ${getStageTone(app.stage)}`}>{app.stageLabel}</span>
                    <Link to={`/application/${app._id}/training`}><FaLightbulb /></Link>
                    <Link to={`/application/${app._id}/mock-interview`}><FaMicrophone /></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recommended jobs */}
      {recommendedJobs.length > 0 && (
        <section className="cd-section">
          <div className="cd-section-head">
            <h2>Recommended for you</h2>
          </div>
          <div className="cd-recs">
            {recommendedJobs.map((job) => (
              <div key={job._id} className="cd-rec">
                <div className="cd-rec-info">
                  <strong>{job.title}</strong>
                  <span>{job.company} · {job.location || 'Remote'}</span>
                </div>
                <div className="cd-rec-right">
                  <span className="cd-fit">{job.recommendationScore}%</span>
                  <Link to={`/dashboard/candidate/jobs/${job._id}/apply`} className="action-link primary">Apply</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CandidateDashboardPage;
