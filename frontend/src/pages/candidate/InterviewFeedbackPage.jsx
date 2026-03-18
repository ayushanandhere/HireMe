import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { interviewService } from '../../services/api';
import '../../styles/CandidateFeedback.css';
import { FaArrowLeft, FaStar, FaStarHalfAlt, FaRegStar, FaInfoCircle } from 'react-icons/fa';

const CandidateInterviewFeedbackPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score / 2);
    const hasHalfStar = score % 2 !== 0;

    for (let i = 0; i < 5; i += 1) {
      if (i < fullStars) stars.push(<FaStar key={i} className="filled" />);
      else if (i === fullStars && hasHalfStar) stars.push(<FaStarHalfAlt key={i} className="half" />);
      else stars.push(<FaRegStar key={i} className="empty" />);
    }

    return (
      <div className="candidate-review-stars">
        {stars}
        <span>({score}/10)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="candidate-review-page page-shell">
        <div className="candidate-review-loading">Loading feedback...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-review-page page-shell">
        <div className="candidate-review-message error">{error}</div>
        <button type="button" className="action-link ghost" onClick={() => navigate('/dashboard/candidate/interviews')}>
          <FaArrowLeft /> Back to Interviews
        </button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="candidate-review-page page-shell">
        <div className="candidate-review-message error">Interview not found or you do not have permission to view it.</div>
        <button type="button" className="action-link ghost" onClick={() => navigate('/dashboard/candidate/interviews')}>
          <FaArrowLeft /> Back to Interviews
        </button>
      </div>
    );
  }

  return (
    <div className="candidate-review-page page-shell">
      <section className="candidate-review-hero">
        <article className="candidate-review-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Interview feedback</span>
          <h1>See what signal came out of the interview.</h1>
          <p>
            When feedback is shared, this page gives you a structured view of strengths, gaps, and the
            recruiter’s evaluation across core dimensions.
          </p>
          <div className="candidate-review-hero-actions">
            <Link to="/dashboard/candidate/interviews" className="action-link signal">
              <FaArrowLeft /> Back to Interviews
            </Link>
          </div>
        </article>

        <article className="candidate-review-summary surface-card">
          <div className="candidate-review-summary-row">
            <span>Position</span>
            <strong>{interview.position?.title || 'Not specified'}</strong>
          </div>
          <div className="candidate-review-summary-row">
            <span>Company</span>
            <strong>{interview.recruiter?.company || 'Not specified'}</strong>
          </div>
          <div className="candidate-review-summary-row">
            <span>Interviewed</span>
            <strong>{formatDateTime(interview.scheduledDateTime)}</strong>
          </div>
        </article>
      </section>

      <section className="candidate-review-details surface-card">
        <div className="candidate-review-details-grid">
          <div className="candidate-review-detail-item">
            <span>Position</span>
            <strong>{interview.position?.title || 'Not specified'}</strong>
          </div>
          <div className="candidate-review-detail-item">
            <span>Company</span>
            <strong>{interview.recruiter?.company || 'Not specified'}</strong>
          </div>
          <div className="candidate-review-detail-item">
            <span>Interviewer</span>
            <strong>{interview.recruiter?.name || 'Not specified'}</strong>
          </div>
          <div className="candidate-review-detail-item">
            <span>Date & Time</span>
            <strong>{formatDateTime(interview.scheduledDateTime)}</strong>
          </div>
        </div>
      </section>

      {(!interview.feedback || !interview.feedback.isShared) ? (
        <section className="candidate-review-empty surface-card">
          <FaInfoCircle />
          <h3>Feedback is not available yet</h3>
          <p>
            The recruiter has not shared feedback for this interview yet. Once it is shared, your
            performance assessment will appear here.
          </p>
        </section>
      ) : (
        <section className="candidate-review-grid">
          <article className="candidate-review-card surface-card">
            <div className="candidate-review-card-head">
              <span className="eyebrow">Overview</span>
              <h2>Performance snapshot</h2>
            </div>

            <div className="candidate-review-score-ring">
              <div className="candidate-review-score-circle">
                <span>{interview.feedback.overall.score}</span>
              </div>
              <strong>Overall Score</strong>
              {renderStars(interview.feedback.overall.score)}
            </div>

            <div className="candidate-review-skill">
              <div className="candidate-review-skill-head">
                <span>Technical Skills</span>
                <strong>{interview.feedback.technical.score}</strong>
              </div>
              <div className="candidate-review-bar">
                <div className="candidate-review-progress" style={{ width: `${interview.feedback.technical.score * 10}%` }} />
              </div>
              {interview.feedback.technical.comments ? (
                <p className="candidate-review-comment">{interview.feedback.technical.comments}</p>
              ) : null}
            </div>

            <div className="candidate-review-skill">
              <div className="candidate-review-skill-head">
                <span>Communication Skills</span>
                <strong>{interview.feedback.communication.score}</strong>
              </div>
              <div className="candidate-review-bar">
                <div className="candidate-review-progress" style={{ width: `${interview.feedback.communication.score * 10}%` }} />
              </div>
              {interview.feedback.communication.comments ? (
                <p className="candidate-review-comment">{interview.feedback.communication.comments}</p>
              ) : null}
            </div>
          </article>

          <article className="candidate-review-card surface-card">
            <div className="candidate-review-card-head">
              <span className="eyebrow">Assessment</span>
              <h2>Detailed evaluation</h2>
            </div>

            <div className="candidate-review-skill">
              <div className="candidate-review-skill-head">
                <span>Problem Solving</span>
                <strong>{interview.feedback.problemSolving.score}</strong>
              </div>
              <div className="candidate-review-bar">
                <div className="candidate-review-progress" style={{ width: `${interview.feedback.problemSolving.score * 10}%` }} />
              </div>
              {interview.feedback.problemSolving.comments ? (
                <p className="candidate-review-comment">{interview.feedback.problemSolving.comments}</p>
              ) : null}
            </div>

            <div className="candidate-review-overall">
              <h3>Overall Assessment</h3>
              <p>{interview.feedback.overall.comments || 'No additional comments were provided.'}</p>
            </div>
          </article>
        </section>
      )}
    </div>
  );
};

export default CandidateInterviewFeedbackPage;
