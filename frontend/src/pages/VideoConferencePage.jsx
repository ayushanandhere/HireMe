import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import VideoChat from '../components/VideoChat';
import { authService, interviewService } from '../services/api';
import '../styles/VideoConference.css';

const getStatusTone = (status) => {
  switch (status) {
    case 'accepted':
    case 'scheduled':
      return 'positive';
    case 'completed':
      return 'active';
    case 'pending':
      return 'review';
    case 'cancelled':
    case 'rejected':
      return 'alert';
    default:
      return 'ai';
  }
};

const capitalizeStatus = (status = '') => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const VideoConferencePage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setError('Authentication required.');
          setLoading(false);
          return;
        }

        const userInfo = authService.getUser();
        const userRole = authService.getUserRole();

        if (!userInfo) {
          setError('User not found. Please sign in again.');
          setLoading(false);
          return;
        }

        setUserType(userRole || '');
        setUserName(userInfo.name || userInfo.email || 'User');
        setUserId(userInfo._id || userInfo.id || '');

        if (!interviewId) {
          setError('Interview ID is required.');
          setLoading(false);
          return;
        }

        const response = await interviewService.getInterviewById(interviewId);

        if (response?.success) {
          setInterview(response.data);
        } else {
          setError('Failed to load interview details.');
        }
      } catch (err) {
        console.error('Error in video conference setup:', err);
        setError(err.message || 'Failed to load interview details.');
      } finally {
        setLoading(false);
      }
    };

    loadInterviewData();
  }, [interviewId]);

  const handleMarkComplete = async () => {
    try {
      setIsCompleting(true);
      setCompletionError('');
      setCompletionMessage('');

      const response = await interviewService.updateInterviewStatus(interviewId, 'completed');

      if (response?.success) {
        setInterview(response.data);
        setCompletionMessage('Interview marked as completed.');
        setTimeout(() => setCompletionMessage(''), 3000);
      }
    } catch (err) {
      setCompletionError(err.message || 'Unable to mark as completed.');
      setTimeout(() => setCompletionError(''), 4000);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="vc-shell page-shell">
        <div className="container vc-center">
          <div className="vc-loading-card">
            <div className="vc-spinner" />
            <p>Preparing interview room…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vc-shell page-shell">
        <div className="container vc-center">
          <div className="vc-error-card surface-card">
            <span className="signal-chip alert">Error</span>
            <h2>Unable to open room</h2>
            <p>{error}</p>
            <button type="button" className="action-link secondary" onClick={() => navigate(-1)}>
              <FiArrowLeft /> Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="vc-shell page-shell">
        <div className="container vc-center">
          <div className="vc-error-card surface-card">
            <span className="signal-chip review">Unavailable</span>
            <h2>Interview not found</h2>
            <p>This session may have been removed or you don't have access.</p>
            <button type="button" className="action-link secondary" onClick={() => navigate(-1)}>
              <FiArrowLeft /> Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const info = {
    candidateName: interview.candidate?.name || 'Candidate',
    recruiterName: interview.recruiter?.name || 'Recruiter',
    position: interview.position?.title || 'Position',
    duration: interview.duration || 60,
    status: interview.status || 'scheduled'
  };

  const otherParty = userType === 'recruiter' ? info.candidateName : info.recruiterName;
  const meetingCode = (interview.meetingId || interview._id || interviewId).toString().slice(-12).toUpperCase();
  const isRecruiterView = userType === 'recruiter';
  const isCompleted = info.status === 'completed';
  const canMarkComplete = isRecruiterView && !['completed', 'cancelled', 'rejected'].includes(info.status);

  return (
    <div className="vc-shell page-shell">
      <div className="container vc-layout">
        <header className="vc-header">
          <button type="button" className="vc-back" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="vc-header-center">
            <h1>{info.position}</h1>
            <div className="vc-header-meta">
              <span className={`signal-chip ${getStatusTone(info.status)}`}>
                {capitalizeStatus(info.status)}
              </span>
              <span className="vc-sep" />
              <span className="mono">{meetingCode}</span>
              <span className="vc-sep" />
              <span>{info.duration} min</span>
              <span className="vc-sep" />
              <span>{otherParty}</span>
            </div>
          </div>
        </header>

        {completionMessage && <div className="vc-toast positive">{completionMessage}</div>}
        {completionError && <div className="vc-toast alert">{completionError}</div>}

        <VideoChat
          interviewId={interviewId}
          userId={userId}
          userType={userType}
          userName={userName}
          counterpartName={otherParty}
          meetingCode={meetingCode}
          onMarkComplete={handleMarkComplete}
          canMarkComplete={canMarkComplete}
          isCompleting={isCompleting}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
};

export default VideoConferencePage;
