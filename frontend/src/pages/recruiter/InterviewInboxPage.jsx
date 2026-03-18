import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaPaperPlane,
  FaRobot,
  FaStar,
  FaTimes,
  FaVideo
} from 'react-icons/fa';
import { interviewService } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import '../candidate/InterviewInboxPage.css';

const getStatusTone = (status) => {
  if (['accepted', 'completed'].includes(status)) return 'positive';
  if (['pending'].includes(status)) return 'review';
  return 'alert';
};

const InterviewInboxPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState({
    pending: [],
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { notifications } = useNotifications();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await interviewService.getRecruiterInterviews();

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

  const formatDateTime = (dateTimeStr) =>
    new Date(dateTimeStr).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

  const handleStatusUpdate = async (interviewId, newStatus) => {
    try {
      setError('');
      setSuccessMessage('');

      const response = await interviewService.updateInterviewStatus(interviewId, newStatus);
      if (response.success) {
        setSuccessMessage(`Interview ${newStatus === 'cancelled' ? 'cancelled' : 'updated'} successfully.`);
        fetchInterviews();
      }
    } catch (err) {
      setError(err.message || 'Failed to update interview status. Please try again.');
    }
  };

  if (loading) {
    return <div className="interview-hub-loading">Loading interviews...</div>;
  }

  return (
    <div className="interview-hub page-shell">
      <section className="interview-hub-hero">
        <article className="interview-hub-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Interview operations</span>
          <h1>Keep scheduled conversations from slipping.</h1>
          <p>
            Pending confirmations, live interview prep, and post-interview follow-up all route
            through this hub.
          </p>
          <div className="interview-hub-hero-actions">
            <Link to="/dashboard/recruiter" className="action-link signal">
              Return to overview
            </Link>
            <Link to="/dashboard/recruiter/jobs" className="action-link ghost">
              Manage roles
            </Link>
          </div>
        </article>

        <article className="interview-hub-hero-panel surface-card">
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
      {successMessage && <div className="interview-hub-success">{successMessage}</div>}

      <section className="interview-hub-section surface-card">
        <div className="interview-hub-head">
          <div>
            <span className="eyebrow">Pending interviews</span>
            <h2>Requests waiting on recruiter action</h2>
          </div>
          <span className="signal-chip review">{interviews.pending.length} pending</span>
        </div>
        {interviews.pending.length === 0 ? (
          <p className="interview-hub-empty">No pending interview requests.</p>
        ) : (
          <div className="interview-hub-list">
            {interviews.pending.map((interview) => (
              <article key={interview._id} className="interview-hub-card surface-card">
                <div className="interview-hub-card-head">
                  <div>
                    <h3>{interview.candidate?.name}</h3>
                    <span>{interview.position?.title}</span>
                  </div>
                  <span className="signal-chip review">Pending</span>
                </div>
                <div className="interview-hub-meta">
                  <span>{formatDateTime(interview.scheduledDateTime)}</span>
                  <span>{interview.duration} mins</span>
                </div>
                <div className="interview-hub-actions">
                  <button
                    type="button"
                    className="action-link ghost"
                    onClick={() => handleStatusUpdate(interview._id, 'cancelled')}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="interview-hub-section surface-card">
        <div className="interview-hub-head">
          <div>
            <span className="eyebrow">Upcoming interviews</span>
            <h2>Brief, meet, and keep the loop tight</h2>
          </div>
          <span className="signal-chip active">{interviews.upcoming.length} live</span>
        </div>
        {interviews.upcoming.length === 0 ? (
          <p className="interview-hub-empty">No upcoming interviews scheduled.</p>
        ) : (
          <div className="interview-hub-list">
            {interviews.upcoming.map((interview) => (
              <article key={interview._id} className="interview-hub-card surface-card">
                <div className="interview-hub-card-head">
                  <div>
                    <h3>{interview.candidate?.name}</h3>
                    <span>{interview.position?.title}</span>
                  </div>
                  <span className={`signal-chip ${getStatusTone(interview.status)}`}>Accepted</span>
                </div>
                <div className="interview-hub-meta">
                  <span>{formatDateTime(interview.scheduledDateTime)}</span>
                  <span>{interview.duration} mins</span>
                </div>
                <div className="interview-hub-actions">
                  <Link to={`/interview/${interview._id}/briefing`} className="action-link secondary">
                    <FaRobot /> Briefing room
                  </Link>
                  <Link to={`/interview/${interview._id}/meeting`} className="action-link primary">
                    <FaVideo /> Join call
                  </Link>
                  <button
                    type="button"
                    className="action-link ghost"
                    onClick={() => handleStatusUpdate(interview._id, 'cancelled')}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="interview-hub-section surface-card">
        <div className="interview-hub-head">
          <div>
            <span className="eyebrow">Past interviews</span>
            <h2>Feedback and completion state</h2>
          </div>
          <span className="signal-chip ai">{interviews.past.length} recorded</span>
        </div>
        {interviews.past.length === 0 ? (
          <p className="interview-hub-empty">No past interviews found.</p>
        ) : (
          <div className="interview-hub-list">
            {interviews.past.map((interview) => (
              <article key={interview._id} className="interview-hub-card surface-card">
                <div className="interview-hub-card-head">
                  <div>
                    <h3>{interview.candidate?.name}</h3>
                    <span>{interview.position?.title}</span>
                  </div>
                  <span className={`signal-chip ${getStatusTone(interview.status)}`}>{interview.status}</span>
                </div>
                <div className="interview-hub-meta">
                  <span>{formatDateTime(interview.scheduledDateTime)}</span>
                  {interview.feedback ? (
                    <span>
                      <FaStar /> {interview.feedback.overallScore}/10
                    </span>
                  ) : (
                    <span>No rating yet</span>
                  )}
                </div>
                <div className="interview-hub-actions">
                  {interview.status === 'completed' && !interview.feedback ? (
                    <button
                      type="button"
                      className="action-link secondary"
                      onClick={() => navigate(`/dashboard/recruiter/interviews/${interview._id}/feedback`)}
                    >
                      <FaPaperPlane /> Add feedback
                    </button>
                  ) : (
                    <span className="interview-hub-note">No further action required</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default InterviewInboxPage;
