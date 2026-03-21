import { useState, useEffect } from 'react';
import { interviewService, authService } from '../services/api';
import { FiEye, FiEyeOff, FiSend, FiStar } from 'react-icons/fi';
import '../styles/InterviewFeedback.css';

const CATEGORIES = [
  { key: 'technical', label: 'Technical Skills' },
  { key: 'communication', label: 'Communication' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'overall', label: 'Overall' }
];

const getRatingLabel = (s) => {
  if (s === 0) return 'Not rated';
  if (s <= 2) return 'Poor';
  if (s <= 4) return 'Below average';
  if (s <= 6) return 'Average';
  if (s <= 8) return 'Good';
  if (s <= 9) return 'Excellent';
  return 'Outstanding';
};

const getTone = (s) => {
  if (s === 0) return '';
  if (s <= 3) return 'alert';
  if (s <= 5) return 'review';
  if (s <= 7) return 'active';
  return 'positive';
};

const InterviewFeedback = ({ interviewId, readOnly = false, onFeedbackSubmitted }) => {
  const [feedback, setFeedback] = useState({
    technical: 0, communication: 0, problemSolving: 0, overall: 0,
    comments: { technical: '', communication: '', problemSolving: '', overall: '' },
    isShared: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setUserRole(authService.getUserRole());

    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const res = await interviewService.getFeedback(interviewId);
        if (res.success && res.data.feedback) {
          const fb = res.data.feedback;
          setExistingFeedback(fb);
          setFeedback({
            technical: fb.technical.score || 0,
            communication: fb.communication.score || 0,
            problemSolving: fb.problemSolving.score || 0,
            overall: fb.overall.score || 0,
            comments: {
              technical: fb.technical.comments || '',
              communication: fb.communication.comments || '',
              problemSolving: fb.problemSolving.comments || '',
              overall: fb.overall.comments || ''
            },
            isShared: fb.isShared || false
          });
        }
      } catch (err) {
        if (err.message !== 'This feedback has not been shared with you yet') {
          setError(err.message || 'Failed to fetch feedback');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (interviewId) fetchFeedback();
  }, [interviewId]);

  const handleScore = (key, val) => {
    setFeedback((p) => ({ ...p, [key]: parseInt(val, 10) }));
  };

  const handleComment = (key, val) => {
    setFeedback((p) => ({ ...p, comments: { ...p.comments, [key]: val } }));
  };

  const handleVisibilityToggle = async () => {
    try {
      setIsLoading(true);
      setError('');
      const next = !feedback.isShared;
      const res = await interviewService.updateFeedbackVisibility(interviewId, next);
      if (res.success) {
        setFeedback((p) => ({ ...p, isShared: next }));
        setSuccess(`Feedback is now ${next ? 'visible' : 'hidden'} to the candidate`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update visibility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      const res = await interviewService.submitFeedback(interviewId, {
        technical: feedback.technical,
        communication: feedback.communication,
        problemSolving: feedback.problemSolving,
        overall: feedback.overall,
        comments: feedback.comments,
        isShared: feedback.isShared
      });
      if (res.success) {
        setSuccess('Feedback saved successfully');
        setExistingFeedback(res.data);
        setTimeout(() => setSuccess(''), 3000);
        onFeedbackSubmitted?.(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !existingFeedback && !feedback.technical) {
    return (
      <div className="ifb-loading">
        <div className="ifb-spinner" />
        <p>Loading feedback…</p>
      </div>
    );
  }

  /* ── Read-only view (candidate) ── */
  if (userRole === 'candidate' || readOnly) {
    if (!existingFeedback) {
      return (
        <div className="ifb-empty surface-card">
          <FiStar />
          <p>No feedback available for this interview yet.</p>
        </div>
      );
    }

    return (
      <div className="ifb-readonly">
        <div className="ifb-overall-ring">
          <div className={`ifb-ring ${getTone(existingFeedback.overall.score)}`}>
            <span className="ifb-ring-val">{existingFeedback.overall.score}</span>
            <span className="ifb-ring-of">/10</span>
          </div>
          <span className="ifb-ring-label">Overall Score</span>
        </div>

        <div className="ifb-ro-grid">
          {CATEGORIES.filter(c => c.key !== 'overall').map(({ key, label }) => (
            <div key={key} className="ifb-ro-card surface-card">
              <div className="ifb-ro-head">
                <span className="ifb-ro-title">{label}</span>
                <span className={`ifb-ro-badge ${getTone(existingFeedback[key].score)}`}>
                  {existingFeedback[key].score}/10
                </span>
              </div>
              {existingFeedback[key].comments && (
                <p className="ifb-ro-comment">{existingFeedback[key].comments}</p>
              )}
            </div>
          ))}
        </div>

        {existingFeedback.overall.comments && (
          <div className="ifb-ro-overall surface-card">
            <span className="ifb-ro-title">Overall Comments</span>
            <p className="ifb-ro-comment">{existingFeedback.overall.comments}</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Form view (recruiter) ── */
  return (
    <form className="ifb-form" onSubmit={handleSubmit}>
      {error && <div className="ifb-alert alert">{error}</div>}
      {success && <div className="ifb-alert positive">{success}</div>}

      {existingFeedback && (
        <button
          type="button"
          className={`ifb-visibility ${feedback.isShared ? 'shared' : ''}`}
          onClick={handleVisibilityToggle}
          disabled={isLoading}
        >
          {feedback.isShared ? <FiEye /> : <FiEyeOff />}
          {feedback.isShared ? 'Visible to candidate' : 'Hidden from candidate'}
        </button>
      )}

      <div className="ifb-grid">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="ifb-card surface-card">
            <div className="ifb-card-head">
              <h3>{label}</h3>
              <span className={`ifb-score-badge ${getTone(feedback[key])}`}>
                {feedback[key]}
              </span>
            </div>

            <div className="ifb-score-row">
              <div className="ifb-score-dots">
                {[...Array(11)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`ifb-dot ${feedback[key] === i ? 'selected' : ''} ${i > 0 && i <= feedback[key] ? 'filled' : ''} ${getTone(i)}`}
                    onClick={() => handleScore(key, i)}
                    disabled={isLoading}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <span className={`ifb-rating-label ${getTone(feedback[key])}`}>
                {getRatingLabel(feedback[key])}
              </span>
            </div>

            <textarea
              placeholder={`Comments on ${label.toLowerCase()} (optional)`}
              value={feedback.comments[key]}
              onChange={(e) => handleComment(key, e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        ))}
      </div>

      <footer className="ifb-footer">
        <label className="ifb-share">
          <input
            type="checkbox"
            checked={feedback.isShared}
            onChange={() => setFeedback((p) => ({ ...p, isShared: !p.isShared }))}
            disabled={isLoading}
          />
          <span>Share feedback with candidate</span>
        </label>

        <button type="submit" className="ifb-submit" disabled={isLoading}>
          <FiSend />
          {isLoading ? 'Saving…' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
        </button>
      </footer>
    </form>
  );
};

export default InterviewFeedback;
