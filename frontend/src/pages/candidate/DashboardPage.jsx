import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBrain,
  FaFileAlt,
  FaIdBadge,
  FaLightbulb,
  FaMicrophone,
  FaRegClock,
  FaRocket,
  FaSpinner
} from 'react-icons/fa';
import { candidateService } from '../../services/api';
import './CandidateDashboard.css';

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

const focusAreas = [
  {
    title: 'Resume intelligence',
    copy: 'Understand whether your profile is ready for role-specific screening and where to improve it.',
    icon: FaFileAlt
  },
  {
    title: 'Interview training',
    copy: 'Use the prep workspace and mock interview flow before every important conversation.',
    icon: FaBrain
  },
  {
    title: 'Application momentum',
    copy: 'Stay close to stage movement so you know when to prepare, follow up, or reapply.',
    icon: FaRocket
  }
];

const stageSequence = [
  'new_application',
  'resume_screened',
  'job_matched',
  'interview_requested',
  'interview_scheduled',
  'offer_extended'
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

const CandidateDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getDashboardSummary();

      if (!response.success) {
        throw new Error(response.message || 'Failed to load dashboard summary');
      }

      setSummary(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load candidate dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="candidate-cockpit-loading">
        <FaSpinner className="candidate-cockpit-spinner" />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!summary) {
    return <div className="candidate-cockpit-loading">Unable to load dashboard.</div>;
  }

  const recentApplications = summary.applicationSummary.recent || [];
  const upcomingInterviews = summary.interviewSummary.items || [];
  const recommendedJobs = summary.recommendedJobs || [];
  const resumeReady = summary.resumeStatus.hasResume;
  const parsingStatus = summary.resumeStatus.parsingStatus.replace(/_/g, ' ');
  const profile = summary.profile || {};
  const riskCount =
    (summary.applicationSummary.stageCounts.rejected || 0) +
    (summary.applicationSummary.stageCounts.interview_cancelled || 0) +
    (summary.applicationSummary.stageCounts.withdrawn || 0);
  const nextInterview = upcomingInterviews[0];
  const recentApplication = recentApplications[0];
  const nextMove = !resumeReady
    ? {
        tone: 'review',
        badge: 'Resume missing',
        title: 'Upload your resume to unlock screening signal.',
        copy: 'Resume parsing, role-fit recommendations, and recruiter screening all improve once your profile is complete.',
        label: 'Complete profile',
        to: '/dashboard/candidate/profile'
      }
    : nextInterview
      ? {
          tone: 'active',
          badge: 'Interview prep',
          title: `Prepare for ${nextInterview.position?.title || 'your next interview'}.`,
          copy: 'You have a live conversation scheduled. Revisit the interview inbox and practice from the exact role context.',
          label: 'Open interview inbox',
          to: '/dashboard/candidate/interviews'
        }
      : recentApplication
        ? {
            tone: 'positive',
            badge: 'Momentum live',
            title: `Train from ${recentApplication.job?.title || 'your active application'}.`,
            copy: 'You already have hiring signal in motion. Launch the prep workspace before the next status change lands.',
            label: 'Launch training',
            to: `/application/${recentApplication._id}/training`
          }
        : {
            tone: 'review',
            badge: 'Need pipeline',
            title: 'Tune your profile before opening the funnel wider.',
            copy: 'Sharper profile signal improves matching, recruiter review, and the quality of the opportunities surfaced to you.',
            label: 'Open profile',
            to: '/dashboard/candidate/profile'
          };

  return (
    <div className="candidate-cockpit page-shell">
      <section className="candidate-hero-grid">
        <article className="candidate-cockpit-hero surface-card">
          <span className="eyebrow">Candidate command center</span>
          <h1>Stay ready for the next signal.</h1>
          <p>
            Track movement across your hiring pipeline, keep your profile fresh, and prep from the
            exact jobs you are pursuing.
          </p>
          <div className="candidate-hero-meta">
            <span className={`signal-chip ${resumeReady ? 'positive' : 'review'}`}>
              {resumeReady ? 'Resume ready' : 'Resume missing'}
            </span>
            <span className="signal-chip active">{recommendedJobs.length} recommended roles</span>
            <span className="signal-chip ai">{parsingStatus}</span>
          </div>
          <div className="candidate-cockpit-actions">
            <Link to="/dashboard/candidate/jobs" className="action-link primary">
              Browse live jobs <FaArrowRight />
            </Link>
            <Link to="/dashboard/candidate/applications" className="action-link secondary">
              Open pipeline
            </Link>
          </div>
        </article>

        <article className="candidate-next-panel instrument-card">
          <div className="candidate-next-head">
            <span className="eyebrow eyebrow-dark">Next move</span>
            <span className={`signal-chip ${nextMove.tone}`}>{nextMove.badge}</span>
          </div>
          <h2>{nextMove.title}</h2>
          <p>{nextMove.copy}</p>
          <div className="candidate-next-grid">
            <div>
              <span className="candidate-next-label">Applications live</span>
              <strong>{summary.applicationSummary.total}</strong>
            </div>
            <div>
              <span className="candidate-next-label">Interviews ahead</span>
              <strong>{summary.interviewSummary.upcoming}</strong>
            </div>
            <div>
              <span className="candidate-next-label">Resume state</span>
              <strong>{resumeReady ? 'Ready' : 'Action needed'}</strong>
            </div>
          </div>
          <Link to={nextMove.to} className="action-link signal">
            {nextMove.label} <FaArrowRight />
          </Link>
        </article>
      </section>

      <section className="candidate-cockpit-stats">
        <article className="surface-card candidate-metric-card">
          <span>Applications</span>
          <strong>{summary.applicationSummary.total}</strong>
          <p>Across your active hiring pipeline.</p>
          <small className="candidate-metric-line positive">Signal live across every stage.</small>
        </article>
        <article className="surface-card candidate-metric-card">
          <span>Upcoming interviews</span>
          <strong>{summary.interviewSummary.upcoming}</strong>
          <p>Conversations that need preparation now.</p>
          <small className="candidate-metric-line active">Prepare before the calendar catches up.</small>
        </article>
        <article className="surface-card candidate-metric-card">
          <span>Resume status</span>
          <strong>{resumeReady ? 'Ready' : 'Missing'}</strong>
          <p>{parsingStatus}</p>
          <small className={`candidate-metric-line ${resumeReady ? 'positive' : 'review'}`}>
            {resumeReady ? 'Screening signal is available.' : 'Profile context is incomplete.'}
          </small>
        </article>
        <article className="surface-card candidate-metric-card">
          <span>Best-fit roles</span>
          <strong>{recommendedJobs.length}</strong>
          <p>Fresh opportunities matched to your profile.</p>
          <small className="candidate-metric-line ai">AI signal ranked from live jobs.</small>
        </article>
      </section>

      <section className="candidate-cockpit-grid">
        <article className="surface-card candidate-stage-panel">
          <div className="candidate-panel-head">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>Where your applications stand</h2>
            </div>
            <Link to="/dashboard/candidate/applications">Open pipeline</Link>
          </div>
          <div className="candidate-stage-rail">
            {stageSequence.map((stage) => {
              const count = summary.applicationSummary.stageCounts[stage] || 0;
              const tone = getStageTone(stage);

              return (
                <div
                  key={stage}
                  className={`candidate-stage-node tone-${tone}${count > 0 ? ' is-live' : ''}`}
                >
                  <span className="candidate-stage-count mono">{count}</span>
                  <div>
                    <strong>{stageLabels[stage] || stage}</strong>
                    <span>{count > 0 ? 'Applications currently here.' : 'No applications in this stage.'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="candidate-stage-footer">
            <span className="signal-chip active">{summary.applicationSummary.total} active signals</span>
            {riskCount > 0 && (
              <span className="signal-chip alert">{riskCount} stalled or closed</span>
            )}
          </div>
        </article>

        <article className="candidate-prep-panel instrument-card">
          <div className="candidate-panel-head">
            <div>
              <span className="eyebrow eyebrow-dark">Prep workspace</span>
              <h2>What to focus on next</h2>
            </div>
            <span className="signal-chip ai">AI-assisted</span>
          </div>
          <div className="candidate-focus-list">
            {focusAreas.map(({ title, copy, icon }) => (
              <div key={title} className="candidate-focus-item">
                <div className="candidate-focus-icon">
                  {React.createElement(icon)}
                </div>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="candidate-prep-footer">
            <Link to="/dashboard/candidate/interviews" className="action-link signal">
              Open prep surfaces <FaArrowRight />
            </Link>
          </div>
        </article>

        <article className="surface-card candidate-interviews-panel">
          <div className="candidate-panel-head">
            <div>
              <span className="eyebrow">Upcoming</span>
              <h2>Interview queue</h2>
            </div>
            <Link to="/dashboard/candidate/interviews">Interview inbox</Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="candidate-empty">No upcoming interviews yet.</p>
          ) : (
            <div className="candidate-list">
              {upcomingInterviews.map((interview) => (
                <div key={interview._id} className="candidate-list-item">
                  <div>
                    <strong>{interview.position?.title || 'Interview'}</strong>
                    <span>{interview.recruiter?.company || interview.recruiter?.name}</span>
                  </div>
                  <span className="signal-chip active">Scheduled</span>
                  <p>
                    <FaRegClock /> {new Date(interview.scheduledDateTime).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card candidate-recent-panel">
          <div className="candidate-panel-head">
            <div>
              <span className="eyebrow">Recent applications</span>
              <h2>Launch prep from live applications</h2>
            </div>
          </div>
          {recentApplications.length === 0 ? (
            <p className="candidate-empty">Start by applying to a live role.</p>
          ) : (
            <div className="candidate-list">
              {recentApplications.map((application) => (
                <div key={application._id} className="candidate-list-item">
                  <div>
                    <strong>{application.job?.title}</strong>
                    <span>{application.job?.company || application.stageLabel}</span>
                  </div>
                  <span className={`signal-chip ${getStageTone(application.stage)}`}>
                    {application.stageLabel}
                  </span>
                  <div className="candidate-inline-actions">
                    <Link to={`/application/${application._id}/training`}>
                      <FaLightbulb /> Train
                    </Link>
                    <Link to={`/application/${application._id}/mock-interview`}>
                      <FaMicrophone /> Mock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card candidate-recommendations-panel">
          <div className="candidate-panel-head">
            <div>
              <span className="eyebrow">Recommended roles</span>
              <h2>Best next fits from live jobs</h2>
            </div>
          </div>
          {recommendedJobs.length === 0 ? (
            <p className="candidate-empty">Update your skills to unlock better recommendations.</p>
          ) : (
            <div className="candidate-job-grid">
              {recommendedJobs.map((job) => (
                <div key={job._id} className="candidate-job-card">
                  <div className="candidate-job-head">
                    <div>
                      <strong>{job.title}</strong>
                      <span>{job.company}</span>
                    </div>
                    <div className="candidate-fit-meter">
                      <span className="mono">Fit</span>
                      <strong>{job.recommendationScore}%</strong>
                    </div>
                  </div>
                  <p>{job.location || 'Remote-ready role'}</p>
                  <div className="candidate-job-meta">
                    <span className="signal-chip positive">High fit</span>
                    <Link to={`/dashboard/candidate/jobs/${job._id}/apply`}>Apply now</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card candidate-profile-panel">
          <div className="candidate-panel-head">
            <div>
              <span className="eyebrow">Profile upkeep</span>
              <h2>Move profile work into one dedicated surface</h2>
            </div>
            <span className={`signal-chip ${resumeReady ? 'positive' : 'review'}`}>
              {resumeReady ? 'On file' : 'Needs upload'}
            </span>
          </div>
          <div className="candidate-profile-form" id="candidate-profile-form">
            <label>
              Headline
              <input
                value={profile.headline || 'No headline yet'}
                disabled
                placeholder="Add a profile headline in the dedicated profile page"
              />
            </label>
            <label>
              Skills
              <textarea
                value={profile.skills || 'No skills added yet'}
                disabled
                rows="4"
                placeholder="Add your current skill stack"
              />
            </label>
            <label>
              Experience
              <input
                value={profile.experience || 'Not set'}
                disabled
                placeholder="Set your current experience band"
              />
            </label>
            <div className="candidate-profile-footer">
              <p>
                Candidate identity, profile picture, resume uploads, and recruiter-visible details now
                live in a dedicated profile page.
              </p>
              <Link to="/dashboard/candidate/profile" className="action-link primary">
                <FaIdBadge /> Open profile
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default CandidateDashboardPage;
