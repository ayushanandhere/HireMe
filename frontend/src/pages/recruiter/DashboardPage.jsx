import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBriefcase,
  FaCalendar,
  FaClipboardList,
  FaSpinner,
  FaUsers
} from 'react-icons/fa';
import { recruiterService } from '../../services/api';
import './Dashboard.css';

const stageLabels = {
  new_application: 'New',
  resume_screened: 'Screened',
  job_matched: 'Matched',
  interview_requested: 'Interview requested',
  interview_scheduled: 'Interview scheduled',
  interview_completed: 'Interview completed',
  offer_extended: 'Offer extended',
  offer_accepted: 'Offer accepted',
  interview_cancelled: 'Interview cancelled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

const stageSequence = [
  'new_application',
  'resume_screened',
  'job_matched',
  'interview_requested',
  'interview_scheduled',
  'offer_extended',
  'rejected'
];

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

const RecruiterDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const response = await recruiterService.getDashboardSummary();

        if (!response.success) {
          throw new Error(response.message || 'Failed to load recruiter dashboard');
        }

        setSummary(response.data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load recruiter dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="recruiter-cockpit-loading">
        <FaSpinner className="recruiter-cockpit-spinner" />
        <p>Loading recruiter cockpit...</p>
      </div>
    );
  }

  if (!summary) {
    return <div className="recruiter-cockpit-loading">Unable to load dashboard.</div>;
  }

  const priorityApplications = summary.pipeline.priorityApplications || [];
  const totalApplications = summary.pipeline.totalApplications || 0;
  const stageCounts = summary.pipeline.stageCounts || {};
  const stageItems = stageSequence
    .map((stage) => ({
      stage,
      label: stageLabels[stage] || stage,
      count: stageCounts[stage] || 0,
      tone: getStageTone(stage)
    }))
    .filter(({ count }) => count > 0);
  const topPriority = priorityApplications[0];
  const funnelSignal = topPriority
    ? {
        tone: topPriority.stage === 'interview_requested' ? 'active' : 'review',
        badge: 'Queue live',
        title: `Move ${topPriority.candidate?.name || 'the next candidate'} on ${
          topPriority.job?.title || 'the current role'
        }.`,
        copy: 'Priority applications are already sorted by fit and urgency. Move the queue before the signal cools down.',
        to: `/dashboard/recruiter/jobs/${topPriority.job?._id}/applications`,
        label: 'Review priority queue'
      }
    : summary.interviews.upcoming > 0
      ? {
          tone: 'active',
          badge: 'Interviews live',
          title: 'Brief and close this week’s interview slate.',
          copy: 'Attention should shift from intake to interview execution. Keep the loop tight while meetings are scheduled.',
          to: '/dashboard/recruiter/interviews',
          label: 'Open interview hub'
        }
      : {
          tone: 'review',
          badge: 'Need intake',
          title: 'Create or publish the next role to seed the funnel.',
          copy: 'No urgent queue yet. The next leverage point is role creation, not over-optimizing an empty pipeline.',
          to: '/dashboard/recruiter/jobs/create',
          label: 'Create a role'
        };

  return (
    <div className="recruiter-cockpit page-shell">
      <section className="recruiter-hero-grid">
        <article className="recruiter-cockpit-hero instrument-card">
          <span className="eyebrow eyebrow-dark">Recruiter screening cockpit</span>
          <h1>Move from applications to decisions.</h1>
          <p>
            Review active roles, prioritize promising candidates, and keep interviews moving
            through a cleaner, more interpretable hiring pipeline.
          </p>
          <div className="recruiter-cockpit-actions">
            <Link to="/dashboard/recruiter/jobs/create" className="action-link primary">
              Create a role <FaArrowRight />
            </Link>
            <Link to="/dashboard/recruiter/jobs" className="action-link signal">
              Manage current jobs
            </Link>
            <Link to="/dashboard/recruiter/profile" className="action-link ghost">
              Manage profile
            </Link>
          </div>
          <div className="recruiter-hero-strip">
            <div>
              <span className="recruiter-hero-label">Priority queue</span>
              <strong>{priorityApplications.length}</strong>
            </div>
            <div>
              <span className="recruiter-hero-label">Upcoming interviews</span>
              <strong>{summary.interviews.upcoming}</strong>
            </div>
            <div>
              <span className="recruiter-hero-label">Active jobs</span>
              <strong>{summary.jobs.active}</strong>
            </div>
          </div>
        </article>

        <article className="recruiter-command-panel surface-card">
          <div className="recruiter-command-head">
            <span className="eyebrow">Funnel pressure</span>
            <span className={`signal-chip ${funnelSignal.tone}`}>{funnelSignal.badge}</span>
          </div>
          <h2>{funnelSignal.title}</h2>
          <p>{funnelSignal.copy}</p>
          <div className="recruiter-command-metrics">
            <div>
              <span className="recruiter-command-label">Applications</span>
              <strong>{totalApplications}</strong>
            </div>
            <div>
              <span className="recruiter-command-label">Candidates</span>
              <strong>{summary.pipeline.totalCandidates}</strong>
            </div>
            <div>
              <span className="recruiter-command-label">Live roles</span>
              <strong>{summary.jobs.active}</strong>
            </div>
          </div>
          <Link to={funnelSignal.to} className="action-link secondary">
            {funnelSignal.label} <FaArrowRight />
          </Link>
        </article>
      </section>

      <section className="recruiter-cockpit-stats">
        <article className="surface-card recruiter-metric-card">
          <span>Active jobs</span>
          <strong>{summary.jobs.active}</strong>
          <p>Published roles recruiting now.</p>
          <small className="recruiter-metric-line active">Roles define current intake capacity.</small>
        </article>
        <article className="surface-card recruiter-metric-card">
          <span>Total applications</span>
          <strong>{summary.pipeline.totalApplications}</strong>
          <p>Candidates currently in your funnel.</p>
          <small className="recruiter-metric-line review">Queue pressure should convert into decisions.</small>
        </article>
        <article className="surface-card recruiter-metric-card">
          <span>Upcoming interviews</span>
          <strong>{summary.interviews.upcoming}</strong>
          <p>Meetings scheduled and not yet closed.</p>
          <small className="recruiter-metric-line active">Execution mode is now live.</small>
        </article>
        <article className="surface-card recruiter-metric-card">
          <span>Candidate pool</span>
          <strong>{summary.pipeline.totalCandidates}</strong>
          <p>Unique people active across your roles.</p>
          <small className="recruiter-metric-line ai">Signal ranked against role demand.</small>
        </article>
      </section>

      <section className="recruiter-cockpit-grid">
        <article className="recruiter-panel recruiter-priority-panel">
          <div className="recruiter-panel-head">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h2>Best next candidates to move</h2>
            </div>
            <Link to="/dashboard/recruiter/candidates">Candidate pool</Link>
          </div>
          {priorityApplications.length === 0 ? (
            <p className="recruiter-empty">No applications yet. Create or publish a role to begin.</p>
          ) : (
            <div className="recruiter-priority-list">
              {priorityApplications.map((application) => (
                <div key={application._id} className="recruiter-priority-card">
                  <div className="recruiter-priority-main">
                    <div>
                      <strong>{application.candidate?.name || 'Candidate'}</strong>
                      <span>{application.job?.title}</span>
                    </div>
                    <div className="recruiter-fit-meter">
                      <span className="mono">Fit</span>
                      <strong>{application.candidateRoleFit || application.matchScore || 0}%</strong>
                    </div>
                  </div>
                  <div className="recruiter-priority-meta">
                    <span className={`signal-chip ${getStageTone(application.stage)}`}>
                      {application.stageLabel}
                    </span>
                    <small>{application.stageLabel}</small>
                  </div>
                  <div className="recruiter-priority-actions">
                    <Link to={`/dashboard/recruiter/jobs/${application.job?._id}/applications`}>
                      Review application
                    </Link>
                    {application.stage === 'interview_requested' && (
                      <Link
                        to={`/dashboard/recruiter/schedule-interview/${application.candidate?._id}?jobId=${application.job?._id}&applicationId=${application._id}`}
                      >
                        Schedule interview
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="recruiter-panel recruiter-pipeline-panel instrument-card">
          <div className="recruiter-panel-head">
            <div>
              <span className="eyebrow eyebrow-dark">Pipeline view</span>
              <h2>Stage distribution across all roles</h2>
            </div>
            <span className="signal-chip ai">Signal density</span>
          </div>
          <div className="recruiter-stage-meter">
            {stageItems.map(({ stage, count, tone }) => (
              <div
                key={stage}
                className={`recruiter-stage-segment tone-${tone}`}
                style={{ width: `${Math.max((count / Math.max(totalApplications, 1)) * 100, 8)}%` }}
              />
            ))}
          </div>
          <div className="recruiter-stage-grid">
            {stageItems.map(({ stage, label, count, tone }) => (
              <div key={stage} className={`recruiter-stage-card tone-${tone}`}>
                <strong>{count}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="recruiter-panel recruiter-jobs-panel">
          <div className="recruiter-panel-head">
            <div>
              <span className="eyebrow">Role activity</span>
              <h2>Recent jobs</h2>
            </div>
            <Link to="/dashboard/recruiter/jobs">All jobs</Link>
          </div>
          <div className="recruiter-list">
            {summary.jobs.recent.map((job) => (
              <div key={job._id} className="recruiter-list-item">
                <div>
                  <strong>{job.title}</strong>
                  <span>{job.company}</span>
                </div>
                <span className="signal-chip active">{job.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="recruiter-panel recruiter-interviews-panel">
          <div className="recruiter-panel-head">
            <div>
              <span className="eyebrow">Interview queue</span>
              <h2>What needs attention this week</h2>
            </div>
            <Link to="/dashboard/recruiter/interviews">Interview hub</Link>
          </div>
          {summary.interviews.items.length === 0 ? (
            <p className="recruiter-empty">No interviews scheduled yet.</p>
          ) : (
            <div className="recruiter-list">
              {summary.interviews.items.map((interview) => (
                <div key={interview._id} className="recruiter-list-item">
                  <div>
                    <strong>{interview.candidate?.name || 'Candidate'}</strong>
                    <span>{interview.position?.title}</span>
                  </div>
                  <small>{new Date(interview.scheduledDateTime).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="recruiter-panel recruiter-actions-panel">
          <div className="recruiter-panel-head">
            <div>
              <span className="eyebrow">Next-best actions</span>
              <h2>Keep the funnel moving</h2>
            </div>
          </div>
          <div className="recruiter-action-grid">
            <Link to="/dashboard/recruiter/jobs" className="recruiter-action-card">
              <FaBriefcase />
              <div>
                <strong>Manage live jobs</strong>
                <p>Close stale roles and keep active openings clear.</p>
              </div>
            </Link>
            <Link to="/dashboard/recruiter/candidates" className="recruiter-action-card">
              <FaUsers />
              <div>
                <strong>Screen candidates</strong>
                <p>Inspect resumes, ATS signal, and match explanations.</p>
              </div>
            </Link>
            <Link to="/dashboard/recruiter/interviews" className="recruiter-action-card">
              <FaCalendar />
              <div>
                <strong>Run interviews</strong>
                <p>Schedule, brief, and close the loop with feedback.</p>
              </div>
            </Link>
            <Link to="/dashboard/recruiter/jobs/create" className="recruiter-action-card">
              <FaClipboardList />
              <div>
                <strong>Create a role</strong>
                <p>Seed the funnel with a fresh, visible opening.</p>
              </div>
            </Link>
          </div>
        </article>
      </section>

      {error && <div className="recruiter-error">{error}</div>}
    </div>
  );
};

export default RecruiterDashboardPage;
