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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (loading) {
    return <div className="interview-hub-loading">Loading interviews...</div>;
  }

  return (
    <div className="interview-hub page-shell">
      <section className="interview-hub-hero">
        <article className="interview-hub-hero-copy surface-card">
          <span className="eyebrow">Interview inbox</span>
          <h1>Know what needs a response, then prep from the right role.</h1>
          <p>
            Pending requests, scheduled interviews, and past outcomes live here in one queue so you
            can respond without losing context.
          </p>
          <div className="interview-hub-hero-actions">
            <Link to="/dashboard/candidate" className="action-link ghost">
              Back to overview
            </Link>
            <Link to="/dashboard/candidate/applications" className="action-link secondary">
              Open applications
            </Link>
          </div>
        </article>

        <article className="interview-hub-hero-panel instrument-card">
          <div className="interview-hub-stat-grid">
            <div>
              <span className="interview-hub-stat-label">Pending</span>
              <strong>{interviews.pending.length}</strong>
            </div>
            <div>
              <span className="interview-hub-stat-label">Upcoming</span>
              <strong>{interviews.upcoming.length}</strong>
            </div>
            <div>
              <span className="interview-hub-stat-label">Past</span>
              <strong>{interviews.past.length}</strong>
            </div>
          </div>
        </article>
      </section>

      {error && <div className="interview-hub-error">{error}</div>}
      {actionSuccess && <div className="interview-hub-success">{actionSuccess}</div>}

      <section className="interview-hub-section surface-card">
        <div className="interview-hub-head">
          <div>
            <span className="eyebrow">Pending requests</span>
            <h2>Requests waiting on your response</h2>
          </div>
          <span className="signal-chip review">{interviews.pending.length} open</span>
        </div>
        {interviews.pending.length > 0 ? (
          <div className="interview-hub-list">
            {interviews.pending.map((interview) => (
              <article key={interview._id} className="interview-hub-card surface-card">
                <div className="interview-hub-card-head">
                  <div>
                    <h3>{interview.position?.title || 'Interview'}</h3>
                    <span>{interview.recruiter?.company || 'Company unavailable'}</span>
                  </div>
                  <span className={`signal-chip ${getStatusTone(interview.status)}`}>Pending</span>
                </div>
                <div className="interview-hub-meta">
                  <span>{formatDate(interview.scheduledDateTime)}</span>
                  <span>{interview.duration} minutes</span>
                </div>
                <div className="interview-hub-actions">
                  <button
                    type="button"
                    className="action-link primary"
                    onClick={() => handleActionClick(interview._id, 'accepted')}
                  >
                    <FaCheckCircle /> Accept
                  </button>
                  <button
                    type="button"
                    className="action-link ghost"
                    onClick={() => handleActionClick(interview._id, 'rejected')}
                  >
                    <FaTimesCircle /> Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="interview-hub-empty">No pending interview requests.</p>
        )}
      </section>

      <section className="interview-hub-section surface-card">
        <div className="interview-hub-head">
          <div>
            <span className="eyebrow">Upcoming interviews</span>
            <h2>Conversations already scheduled</h2>
          </div>
          <span className="signal-chip active">{interviews.upcoming.length} scheduled</span>
        </div>
        {interviews.upcoming.length > 0 ? (
          <div className="interview-hub-list">
            {interviews.upcoming.map((interview) => (
              <article key={interview._id} className="interview-hub-card surface-card">
                <div className="interview-hub-card-head">
                  <div>
                    <h3>{interview.position?.title || 'Interview'}</h3>
                    <span>{interview.recruiter?.company || 'Company unavailable'}</span>
                  </div>
                  <span className="signal-chip active">Scheduled</span>
                </div>
                <div className="interview-hub-meta">
                  <span>{formatDate(interview.scheduledDateTime)}</span>
                  <span>{interview.duration} minutes</span>
                </div>
                <div className="interview-hub-actions">
                  <Link to={`/interview/${interview._id}/meeting`} className="action-link primary">
                    <FaVideo /> Join call
                  </Link>
                  {interview.applicationId && (
                    <Link
                      to={`/application/${interview.applicationId._id || interview.applicationId}/training`}
                      className="action-link secondary"
                    >
                      <FaGraduationCap /> Training room
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="interview-hub-empty">No upcoming interviews scheduled.</p>
        )}
      </section>

      <section className="interview-hub-section surface-card">
        <div className="interview-hub-head">
          <div>
            <span className="eyebrow">Past interviews</span>
            <h2>Closed loops and feedback</h2>
          </div>
          <span className="signal-chip ai">{interviews.past.length} recorded</span>
        </div>
        {interviews.past.length > 0 ? (
          <div className="interview-hub-list">
            {interviews.past.map((interview) => (
              <article key={interview._id} className="interview-hub-card surface-card">
                <div className="interview-hub-card-head">
                  <div>
                    <h3>{interview.position?.title || 'Interview'}</h3>
                    <span>{interview.recruiter?.company || 'Company unavailable'}</span>
                  </div>
                  <span className={`signal-chip ${getStatusTone(interview.status)}`}>
                    {interview.status}
                  </span>
                </div>
                <div className="interview-hub-meta">
                  <span>{formatDate(interview.scheduledDateTime)}</span>
                  <span>{interview.duration} minutes</span>
                </div>
                <div className="interview-hub-actions">
                  {interview.feedback && interview.feedback.isShared ? (
                    <Link
                      to={`/dashboard/candidate/interviews/${interview._id}`}
                      className="action-link secondary"
                    >
                      <FaEye /> View feedback
                    </Link>
                  ) : (
                    <span className="interview-hub-note">Feedback not available</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="interview-hub-empty">No past interviews.</p>
        )}
      </section>
    </div>
  );
};

export default InterviewInboxPage;
