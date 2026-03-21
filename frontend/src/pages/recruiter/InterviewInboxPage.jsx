import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
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
    new Date(dateTimeStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
          <Link to="/dashboard/recruiter" className="action-link ghost">
            Dashboard
          </Link>
          <Link to="/dashboard/recruiter/jobs" className="action-link primary">
            Manage roles
          </Link>
        </div>
      </section>

      {error && <div className="iv-alert iv-alert-error">{error}</div>}
      {successMessage && <div className="iv-alert iv-alert-success">{successMessage}</div>}

      <div className="iv-board">
        <section className="iv-section surface-card">
          <div className="iv-section-head">
            <div>
              <span className="iv-section-label">Pending</span>
              <h2>Waiting on a decision</h2>
            </div>
            <span className="signal-chip review">{interviews.pending.length} open</span>
          </div>
          {interviews.pending.length === 0 ? (
            <p className="iv-empty">No pending interview requests.</p>
          ) : (
            <div className="iv-list">
              {interviews.pending.map((interview) => (
                <article key={interview._id} className="iv-card surface-card">
                  <div className="iv-card-top">
                    <span className="signal-chip review">Pending</span>
                    <span className="iv-card-date mono">{formatDateTime(interview.scheduledDateTime)}</span>
                  </div>
                  <div className="iv-card-head">
                    <div>
                      <h3>{interview.candidate?.name}</h3>
                      <span>{interview.position?.title}</span>
                    </div>
                  </div>
                  <div className="iv-card-meta">
                    <span>{interview.duration} min</span>
                  </div>
                  <div className="iv-card-note review">Still waiting on recruiter action before this moves forward.</div>
                  <div className="iv-card-actions">
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

        <section className="iv-section surface-card">
          <div className="iv-section-head">
            <div>
              <span className="iv-section-label">Upcoming</span>
              <h2>Scheduled</h2>
            </div>
            <span className="signal-chip active">{interviews.upcoming.length} scheduled</span>
          </div>
          {interviews.upcoming.length === 0 ? (
            <p className="iv-empty">No upcoming interviews scheduled.</p>
          ) : (
            <div className="iv-list">
              {interviews.upcoming.map((interview) => (
                <article key={interview._id} className="iv-card surface-card">
                  <div className="iv-card-top">
                    <span className="signal-chip active">Scheduled</span>
                    <span className="iv-card-date mono">{formatDateTime(interview.scheduledDateTime)}</span>
                  </div>
                  <div className="iv-card-head">
                    <div>
                      <h3>{interview.candidate?.name}</h3>
                      <span>{interview.position?.title}</span>
                    </div>
                  </div>
                  <div className="iv-card-meta">
                    <span>{interview.duration} min</span>
                  </div>
                  <div className="iv-card-note active">Everything is confirmed. Brief, join, or cancel from here.</div>
                  <div className="iv-card-actions">
                    <Link to={`/interview/${interview._id}/briefing`} className="action-link ghost">
                      <FaRobot /> Briefing
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

        <section className="iv-section surface-card">
          <div className="iv-section-head">
            <div>
              <span className="iv-section-label">Past</span>
              <h2>Completed</h2>
            </div>
            <span className="signal-chip ai">{interviews.past.length} recorded</span>
          </div>
          {interviews.past.length === 0 ? (
            <p className="iv-empty">No past interviews found.</p>
          ) : (
            <div className="iv-list">
              {interviews.past.map((interview) => (
                <article key={interview._id} className="iv-card surface-card">
                  <div className="iv-card-top">
                    <span className={`signal-chip ${getStatusTone(interview.status)}`}>{interview.status}</span>
                    <span className="iv-card-date mono">{formatDateTime(interview.scheduledDateTime)}</span>
                  </div>
                  <div className="iv-card-head">
                    <div>
                      <h3>{interview.candidate?.name}</h3>
                      <span>{interview.position?.title}</span>
                    </div>
                  </div>
                  <div className="iv-card-meta">
                    {interview.feedback ? (
                      <span><FaStar /> {interview.feedback.overallScore}/10</span>
                    ) : (
                      <span>No rating</span>
                    )}
                  </div>
                  <div className="iv-card-note neutral">
                    {interview.status === 'completed' && !interview.feedback
                      ? 'Feedback still needs to be submitted.'
                      : 'This interview is closed.'}
                  </div>
                  <div className="iv-card-actions">
                    {interview.status === 'completed' && !interview.feedback ? (
                      <button
                        type="button"
                        className="action-link ghost"
                        onClick={() => navigate(`/dashboard/recruiter/interviews/${interview._id}/feedback`)}
                      >
                        <FaPaperPlane /> Add feedback
                      </button>
                    ) : (
                      <span className="iv-note">No further action</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InterviewInboxPage;
