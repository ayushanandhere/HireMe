import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import InterviewFeedback from '../../components/InterviewFeedback';
import { interviewService } from '../../services/api';
import '../../styles/Feedback.css';
import { FaArrowLeft } from 'react-icons/fa';

const RecruiterInterviewFeedbackPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        setLoading(true);
        const response = await interviewService.getInterviewById(interviewId);
        if (response.success) {
          setInterview(response.data);
        } else {
          setError('Failed to load interview details');
        }
      } catch (err) {
        setError(err.message || 'Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) fetchInterviewDetails();
  }, [interviewId]);

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

  const handleFeedbackSubmitted = (feedbackData) => {
    setSuccessMessage('Feedback submitted successfully.');
    setInterview((prev) => ({
      ...prev,
      feedback: feedbackData
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="review-shell-loading">Loading interview details...</div>;
  }

  if (error) {
    return (
      <div className="review-shell page-shell">
        <div className="review-message error">{error}</div>
        <button type="button" className="action-link ghost" onClick={() => navigate('/dashboard/recruiter/interviews')}>
          <FaArrowLeft /> Back to Interviews
        </button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="review-shell page-shell">
        <div className="review-message error">Interview not found or you do not have permission to view it.</div>
        <button type="button" className="action-link ghost" onClick={() => navigate('/dashboard/recruiter/interviews')}>
          <FaArrowLeft /> Back to Interviews
        </button>
      </div>
    );
  }

  return (
    <div className="review-shell page-shell">
      <section className="review-hero">
        <article className="review-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Interview assessment</span>
          <h1>Turn the conversation into usable hiring signal.</h1>
          <p>
            Score the candidate clearly across technical strength, communication, and problem solving,
            then decide whether to share the assessment back.
          </p>
          <div className="review-hero-actions">
            <Link to="/dashboard/recruiter/interviews" className="action-link signal">
              <FaArrowLeft /> Back to Interviews
            </Link>
          </div>
        </article>

        <article className="review-summary surface-card">
          <div className="review-summary-row">
            <span>Candidate</span>
            <strong>{interview.candidate?.name || 'Not specified'}</strong>
          </div>
          <div className="review-summary-row">
            <span>Position</span>
            <strong>{interview.position?.title || 'Not specified'}</strong>
          </div>
          <div className="review-summary-row">
            <span>Status</span>
            <strong>{interview.status}</strong>
          </div>
        </article>
      </section>

      {successMessage && <div className="review-message success">{successMessage}</div>}

      <section className="review-details surface-card">
        <div className="review-details-head">
          <div>
            <span className="eyebrow">Interview context</span>
            <h2>What happened in this session</h2>
          </div>
          <span className="signal-chip ai">{formatDateTime(interview.scheduledDateTime)}</span>
        </div>

        <div className="review-detail-grid">
          <div className="review-detail-item">
            <span>Candidate</span>
            <strong>{interview.candidate?.name || 'Not specified'}</strong>
          </div>
          <div className="review-detail-item">
            <span>Position</span>
            <strong>{interview.position?.title || 'Not specified'}</strong>
          </div>
          <div className="review-detail-item">
            <span>Date & Time</span>
            <strong>{formatDateTime(interview.scheduledDateTime)}</strong>
          </div>
          <div className="review-detail-item">
            <span>Status</span>
            <strong>{interview.status}</strong>
          </div>
        </div>

        {interview.notes ? (
          <div className="review-notes">
            <h3>Interview Notes</h3>
            <p>{interview.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="review-form-wrap surface-card">
        <InterviewFeedback interviewId={interviewId} onFeedbackSubmitted={handleFeedbackSubmitted} />
      </section>
    </div>
  );
};

export default RecruiterInterviewFeedbackPage;
