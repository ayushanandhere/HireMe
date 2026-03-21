import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCheckCircle,
  FaEye,
  FaGraduationCap,
  FaTimesCircle,
  FaVideo
} from 'react-icons/fa';
import { interviewService } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import './InterviewInboxPage.css';

const getStatusTone = (status) => {
  if (['accepted', 'completed'].includes(status)) return 'positive';
  if (['pending'].includes(status)) return 'review';
  return 'alert';
};

const InterviewInboxPage = () => {
  const [interviews, setInterviews] = useState({
    pending: [],
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const { notifications } = useNotifications();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await interviewService.getCandidateInterviews();

      if (response.success) {
        const now = new Date();
        const pending = [];
        const upcoming = [];
        const past = [];

        response.data.forEach((interview) => {
          const interviewDate = new Date(interview.scheduledDateTime);

          if (interview.status === 'pending') {
            pending.push(interview);
          } else if (['accepted', 'completed'].includes(interview.status)) {
            if (interviewDate > now) {
              upcoming.push(interview);
            } else {
              past.push(interview);
            }
          } else {
            past.push(interview);
          }
        });

        setInterviews({ pending, upcoming, past });
      }
    } catch (err) {
      setError('Failed to load interviews. Please refresh and try again.');
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    const interviewNotifications = notifications.filter(
      (notification) =>
        notification.type.includes('interview_') ||
        (notification.relatedTo && notification.relatedTo.model === 'Interview')
    );

    if (interviewNotifications.length > 0) {
      fetchInterviews();
    }
  }, [notifications]);

  const handleActionClick = async (interviewId, status) => {
    try {
      setActionSuccess('');
      setError('');

      const response = await interviewService.updateInterviewStatus(interviewId, status);

      if (response.success) {
        setActionSuccess(`Interview ${status === 'accepted' ? 'accepted' : 'declined'} successfully.`);
        fetchInterviews();
      }
    } catch (err) {
      setError(`Failed to ${status} interview. Please try again.`);
      console.error(`Error ${status}ing interview:`, err);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  if (loading) {
    return <div className="iv-loading"><div className="iv-spinner" /><p>Loading...</p></div>;
  }

  return (
    <div className="iv-page page-shell">
      <section className="iv-header">
        <div className="iv-header-left">
          <h1>Interviews</h1>
          <div className="iv-header-meta">
            <span className="signal-chip review">{interviews.pending.length} pending</span>
            <span className="signal-chip active">{interviews.upcoming.length} upcoming</span>
            <span className="signal-chip ai">{interviews.past.length} past</span>
          </div>
        </div>
        <div className="iv-header-actions">
          <Link to="/dashboard/candidate" className="action-link ghost">
            Dashboard
          </Link>
          <Link to="/dashboard/candidate/applications" className="action-link secondary">
            Applications
          </Link>
        </div>
      </section>

      {error && <div className="iv-alert iv-alert-error">{error}</div>}
      {actionSuccess && <div className="iv-alert iv-alert-success">{actionSuccess}</div>}

      <div className="iv-board">
        <section className="iv-section surface-card">
          <div className="iv-section-head">
            <div>
              <span className="iv-section-label">Pending</span>
              <h2>Waiting on you</h2>
            </div>
            <span className="signal-chip review">{interviews.pending.length} open</span>
          </div>
          {interviews.pending.length > 0 ? (
            <div className="iv-list">
              {interviews.pending.map((interview) => (
                <article key={interview._id} className="iv-card surface-card">
                  <div className="iv-card-top">
                    <span className="signal-chip review">Pending</span>
                    <span className="iv-card-date mono">{formatDate(interview.scheduledDateTime)}</span>
                  </div>
                  <div className="iv-card-head">
                    <div>
                      <h3>{interview.position?.title || 'Interview'}</h3>
                      <span>{interview.recruiter?.company || 'Company unavailable'}</span>
                    </div>
                  </div>
                  <div className="iv-card-meta">
                    <span>{interview.duration} min</span>
                  </div>
                  <div className="iv-card-note review">Review the request and confirm only if the timing works.</div>
                  <div className="iv-card-actions">
                    <button type="button" className="action-link primary" onClick={() => handleActionClick(interview._id, 'accepted')}>
                      <FaCheckCircle /> Accept
                    </button>
                    <button type="button" className="action-link ghost" onClick={() => handleActionClick(interview._id, 'rejected')}>
                      <FaTimesCircle /> Decline
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="iv-empty">No interview requests waiting.</p>
          )}
        </section>

        <section className="iv-section surface-card">
          <div className="iv-section-head">
            <div>
              <span className="iv-section-label">Upcoming</span>
              <h2>Scheduled</h2>
            </div>
            <span className="signal-chip active">{interviews.upcoming.length} scheduled</span>
          </div>
          {interviews.upcoming.length > 0 ? (
            <div className="iv-list">
              {interviews.upcoming.map((interview) => (
                <article key={interview._id} className="iv-card surface-card">
                  <div className="iv-card-top">
                    <span className="signal-chip active">Scheduled</span>
                    <span className="iv-card-date mono">{formatDate(interview.scheduledDateTime)}</span>
                  </div>
                  <div className="iv-card-head">
                    <div>
                      <h3>{interview.position?.title || 'Interview'}</h3>
                      <span>{interview.recruiter?.company || 'Company unavailable'}</span>
                    </div>
                  </div>
                  <div className="iv-card-meta">
                    <span>{interview.duration} min</span>
                  </div>
                  <div className="iv-card-note active">Prep is done here. Join the call when it is time.</div>
                  <div className="iv-card-actions">
                    <Link to={`/interview/${interview._id}/meeting`} className="action-link primary">
                      <FaVideo /> Join call
                    </Link>
                    {interview.applicationId && (
                      <Link
                        to={`/application/${interview.applicationId._id || interview.applicationId}/training`}
                        className="action-link ghost"
                      >
                        <FaGraduationCap /> Training
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="iv-empty">No upcoming interviews.</p>
          )}
        </section>

        <section className="iv-section surface-card">
          <div className="iv-section-head">
            <div>
              <span className="iv-section-label">Past</span>
              <h2>Completed</h2>
            </div>
            <span className="signal-chip ai">{interviews.past.length} recorded</span>
          </div>
          {interviews.past.length > 0 ? (
            <div className="iv-list">
              {interviews.past.map((interview) => (
                <article key={interview._id} className="iv-card surface-card">
                  <div className="iv-card-top">
                    <span className={`signal-chip ${getStatusTone(interview.status)}`}>{interview.status}</span>
                    <span className="iv-card-date mono">{formatDate(interview.scheduledDateTime)}</span>
                  </div>
                  <div className="iv-card-head">
                    <div>
                      <h3>{interview.position?.title || 'Interview'}</h3>
                      <span>{interview.recruiter?.company || 'Company unavailable'}</span>
                    </div>
                  </div>
                  <div className="iv-card-meta">
                    <span>{interview.duration} min</span>
                  </div>
                  <div className="iv-card-note neutral">
                    {interview.feedback && interview.feedback.isShared
                      ? 'Feedback is available for review.'
                      : 'Feedback is not available yet.'}
                  </div>
                  <div className="iv-card-actions">
                    {interview.feedback && interview.feedback.isShared ? (
                      <Link
                        to={`/dashboard/candidate/interviews/${interview._id}`}
                        className="action-link ghost"
                      >
                        <FaEye /> View feedback
                      </Link>
                    ) : (
                      <span className="iv-note">No further action</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="iv-empty">No past interviews.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default InterviewInboxPage;
