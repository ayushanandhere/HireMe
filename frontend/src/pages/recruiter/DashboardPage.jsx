import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaSpinner } from 'react-icons/fa';
import { recruiterService } from '../../services/api';
import './Dashboard.css';

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
  'interview_requested', 'interview_scheduled', 'offer_extended', 'rejected',
];

const getStageTone = (stage) => {
  if (['job_matched', 'offer_extended', 'offer_accepted', 'interview_completed'].includes(stage)) return 'positive';
  if (['resume_screened', 'interview_scheduled'].includes(stage)) return 'active';
  if (['new_application', 'interview_requested'].includes(stage)) return 'review';
  return 'alert';
};

const RecruiterDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await recruiterService.getDashboardSummary();
        if (!res.success) throw new Error(res.message || 'Failed to load dashboard');
        setSummary(res.data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="rd-loading"><FaSpinner className="rd-spinner" /></div>;
  }

  if (!summary) {
    return <div className="rd-loading">Unable to load dashboard.</div>;
  }

  const priorityApplications = summary.pipeline.priorityApplications || [];
  const totalApplications = summary.pipeline.totalApplications || 0;
  const stageCounts = summary.pipeline.stageCounts || {};
  const stageItems = stageSequence
    .map((s) => ({ stage: s, label: stageLabels[s], count: stageCounts[s] || 0, tone: getStageTone(s) }))
    .filter(({ count }) => count > 0);

  return (
    <div className="rd page-shell">
      {/* Header */}
      <header className="rd-header">
        <h1>Overview</h1>
        <div className="rd-header-actions">
          <Link to="/dashboard/recruiter/jobs/create" className="action-link primary">Create role <FaArrowRight /></Link>
          <Link to="/dashboard/recruiter/jobs" className="action-link ghost">Manage jobs</Link>
        </div>
      </header>

      {error && <div className="rd-error">{error}</div>}

      {/* Stats */}
      <section className="rd-stats">
        <div className="rd-stat-card">
          <span className="rd-stat-label">Active jobs</span>
          <strong className="rd-stat-value">{summary.jobs.active}</strong>
        </div>
        <div className="rd-stat-card">
          <span className="rd-stat-label">Applications</span>
          <strong className="rd-stat-value">{totalApplications}</strong>
        </div>
        <div className="rd-stat-card">
          <span className="rd-stat-label">Interviews</span>
          <strong className="rd-stat-value">{summary.interviews.upcoming}</strong>
        </div>
        <div className="rd-stat-card">
          <span className="rd-stat-label">Candidates</span>
          <strong className="rd-stat-value">{summary.pipeline.totalCandidates}</strong>
        </div>
      </section>

      {/* Pipeline */}
      {stageItems.length > 0 && (
        <section className="rd-section">
          <div className="rd-section-head">
            <h2>Pipeline</h2>
          </div>
          <div className="rd-pipeline-bar">
            {stageItems.map(({ stage, count, tone }) => (
              <div key={stage} className={`rd-pipeline-seg tone-${tone}`}
                style={{ width: `${Math.max((count / Math.max(totalApplications, 1)) * 100, 8)}%` }} />
            ))}
          </div>
          <div className="rd-pipeline-grid">
            {stageItems.map(({ stage, label, count, tone }) => (
              <div key={stage} className={`rd-pipeline-card tone-${tone}`}>
                <span className="rd-pipe-dot" />
                <strong>{count}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Priority queue */}
      <section className="rd-section">
        <div className="rd-section-head">
          <h2>Priority queue</h2>
          <Link to="/dashboard/recruiter/candidates" className="rd-section-link">All candidates</Link>
        </div>
        {priorityApplications.length === 0 ? (
          <p className="rd-empty">No applications yet. Create a role to get started.</p>
        ) : (
          <div className="rd-queue">
            {priorityApplications.map((app) => (
              <div key={app._id} className="rd-queue-item">
                <div className="rd-queue-info">
                  <strong>{app.candidate?.name || 'Candidate'}</strong>
                  <span>{app.job?.title}</span>
                </div>
                <span className={`rd-queue-chip tone-${getStageTone(app.stage)}`}>{app.stageLabel}</span>
                <div className="rd-queue-fit">{app.candidateRoleFit || app.matchScore || 0}%</div>
                <div className="rd-queue-actions">
                  <Link to={`/dashboard/recruiter/jobs/${app.job?._id}/applications`} className="action-link ghost">Review</Link>
                  {app.stage === 'interview_requested' && (
                    <Link to={`/dashboard/recruiter/schedule-interview/${app.candidate?._id}?jobId=${app.job?._id}&applicationId=${app._id}`} className="action-link primary">Schedule</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Jobs + Interviews */}
      <section className="rd-two-col">
        <div className="rd-section">
          <div className="rd-section-head">
            <h2>Recent jobs</h2>
            <Link to="/dashboard/recruiter/jobs" className="rd-section-link">View all</Link>
          </div>
          {summary.jobs.recent.length === 0 ? (
            <p className="rd-empty">No jobs yet.</p>
          ) : (
            <div className="rd-list">
              {summary.jobs.recent.map((job) => (
                <div key={job._id} className="rd-list-item">
                  <div>
                    <strong>{job.title}</strong>
                    <span>{job.company}</span>
                  </div>
                  <span className="rd-list-status">{job.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rd-section">
          <div className="rd-section-head">
            <h2>Interviews</h2>
            <Link to="/dashboard/recruiter/interviews" className="rd-section-link">View all</Link>
          </div>
          {summary.interviews.items.length === 0 ? (
            <p className="rd-empty">No interviews scheduled.</p>
          ) : (
            <div className="rd-list">
              {summary.interviews.items.map((iv) => (
                <div key={iv._id} className="rd-list-item">
                  <div>
                    <strong>{iv.candidate?.name || 'Candidate'}</strong>
                    <span>{iv.position?.title}</span>
                  </div>
                  <span className="rd-list-date">
                    {new Date(iv.scheduledDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RecruiterDashboardPage;
