import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import InterviewFeedback from '../../components/InterviewFeedback';
import { interviewService } from '../../services/api';
import '../../styles/Feedback.css';

const getStatusTone = (s) => {
  if (['accepted', 'scheduled'].includes(s)) return 'positive';
  if (s === 'completed') return 'active';
  if (s === 'pending') return 'review';
  if (['cancelled', 'rejected'].includes(s)) return 'alert';
  return 'ai';
};

const RecruiterInterviewFeedbackPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await interviewService.getInterviewById(interviewId);
        if (res.success) setInterview(res.data);
        else setError('Failed to load interview details');
      } catch (err) {
        setError(err.message || 'Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };
    if (interviewId) fetch();
  }, [interviewId]);

  const handleFeedbackSubmitted = (feedbackData) => {
    setToast('Feedback saved successfully.');
    setInterview((prev) => ({ ...prev, feedback: feedbackData }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setToast(''), 4000);
  };

  if (loading) {
    return (
      <div className="fb-shell">
        <div className="fb-loading">
          <div className="fb-spinner" />
          <p>Loading assessment…</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="fb-shell">
        <div className="fb-empty surface-card">
          <span className="signal-chip alert">Error</span>
          <h2>{error || 'Interview not found'}</h2>
          <p>This session may have been removed or you don't have access.</p>
          <button type="button" className="action-link secondary" onClick={() => navigate('/dashboard/recruiter/interviews')}>
            <FiArrowLeft /> Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  const candidateName = interview.candidate?.name || 'Candidate';
  const position = interview.position?.title || 'Position';
  const status = interview.status || 'scheduled';
  const dateStr = new Date(interview.scheduledDateTime).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="fb-shell">
      {toast && <div className="fb-toast">{toast}</div>}

      <header className="fb-header">
        <div className="fb-header-text">
          <h1>Interview Feedback</h1>
          <div className="fb-header-meta">
            <span>{candidateName}</span>
            <span className="fb-dot" />
            <span>{position}</span>
            <span className="fb-dot" />
            <span>{dateStr}</span>
            <span className="fb-dot" />
            <span className={`signal-chip ${getStatusTone(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </header>

      {interview.notes && (
        <div className="fb-notes surface-card">
          <span className="fb-notes-label">Session notes</span>
          <p>{interview.notes}</p>
        </div>
      )}

      <InterviewFeedback interviewId={interviewId} onFeedbackSubmitted={handleFeedbackSubmitted} />
    </div>
  );
};

export default RecruiterInterviewFeedbackPage;
