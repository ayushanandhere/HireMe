import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiShield,
  FiUser,
  FiVideo
} from 'react-icons/fi';
import VideoChat from '../components/VideoChat';
import InterviewFeedback from '../components/InterviewFeedback';
import { authService, interviewService } from '../services/api';
import '../styles/VideoConference.css';

const formatDateTime = (dateString) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Date(dateString).toLocaleDateString(undefined, options);
};

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

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setError('User authentication required.');
          setLoading(false);
          return;
        }

        const userInfo = authService.getUser();
        const userRole = authService.getUserRole();

        if (!userInfo) {
          setError('User information not found. Please sign in again.');
          setLoading(false);
          return;
        }

        setUserType(userRole || '');
        setUserName(userInfo.name || userInfo.email || 'User');

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
        setError(err.message || 'Failed to load interview details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewData();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="conference-shell page-shell">
        <div className="container">
          <div className="conference-state-card instrument-card">
            <span className="eyebrow eyebrow-dark">Room Setup</span>
            <h1>Preparing the interview room.</h1>
            <p>
              We are checking access, loading meeting context, and getting the conference
              surfaces ready for the session.
            </p>
            <div className="conference-loading-bar" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conference-shell page-shell">
        <div className="container">
          <div className="conference-state-card surface-card conference-state-card-light">
            <span className="signal-chip alert">Connection issue</span>
            <h1>Unable to open the interview room.</h1>
            <p>{error}</p>
            <div className="conference-state-actions">
              <button type="button" className="action-link primary" onClick={() => navigate(-1)}>
                <FiArrowLeft />
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="conference-shell page-shell">
        <div className="container">
          <div className="conference-state-card surface-card conference-state-card-light">
            <span className="signal-chip review">Unavailable</span>
            <h1>Interview not found.</h1>
            <p>
              This session may have been removed or you may not have permission to access it.
            </p>
            <div className="conference-state-actions">
              <button type="button" className="action-link primary" onClick={() => navigate(-1)}>
                <FiArrowLeft />
                Return to previous screen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const interviewInfo = {
    candidateName: interview.candidate?.name || 'Candidate',
    recruiterName: interview.recruiter?.name || 'Recruiter',
    position: interview.position?.title || 'Position',
    company: interview.recruiter?.company || 'Company',
    scheduledTime: formatDateTime(interview.scheduledDateTime),
    duration: interview.duration || 60,
    status: interview.status || 'scheduled'
  };

  const otherParty =
    userType === 'recruiter' ? interviewInfo.candidateName : interviewInfo.recruiterName;

  return (
    <div className="conference-shell page-shell">
      <div className="container conference-layout">
        <section className="conference-hero-grid">
          <div className="conference-overview instrument-card">
            <div className="conference-overview-head">
              <span className="eyebrow eyebrow-dark">
                <FiVideo />
                Live interview room
              </span>
              <span className={`signal-chip ${getStatusTone(interviewInfo.status)}`}>
                {capitalizeStatus(interviewInfo.status)}
              </span>
            </div>

            <h1>{interviewInfo.position} session</h1>
            <p>
              {userType === 'recruiter'
                ? 'Review the briefing, monitor the call state, and capture evidence while the conversation is live.'
                : 'Join with your role context in front of you so the interview stays grounded in the actual application.'}
            </p>

            <div className="conference-highlight-grid">
              <div className="conference-highlight-card">
                <span>Counterpart</span>
                <strong>{otherParty}</strong>
              </div>
              <div className="conference-highlight-card">
                <span>Company</span>
                <strong>{interviewInfo.company}</strong>
              </div>
              <div className="conference-highlight-card">
                <span>Room mode</span>
                <strong>{userType === 'recruiter' ? 'Evaluation' : 'Candidate focus'}</strong>
              </div>
            </div>
          </div>

          <aside className="conference-brief surface-card">
            <span className="eyebrow">Session protocol</span>
            <div className="conference-detail-list">
              <div>
                <span><FiCalendar /> Scheduled</span>
                <strong>{interviewInfo.scheduledTime}</strong>
              </div>
              <div>
                <span><FiClock /> Duration</span>
                <strong>{interviewInfo.duration} minutes</strong>
              </div>
              <div>
                <span><FiUser /> Candidate</span>
                <strong>{interviewInfo.candidateName}</strong>
              </div>
              <div>
                <span><FiShield /> Recruiter</span>
                <strong>{interviewInfo.recruiterName}</strong>
              </div>
            </div>

            <div className="conference-guidance">
              <div>
                <span className="signal-chip ai">Room guidance</span>
                <p>
                  Check camera and microphone before starting. Use screen sharing only when you
                  want the other participant to review a document or work sample live.
                </p>
              </div>
              <div>
                <span className="signal-chip active">Live note</span>
                <p>
                  The call controls stay visible below the stream so mute, video, and exit actions
                  remain one tap away on both desktop and mobile.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="conference-video-stage surface-card">
          <div className="conference-stage-header">
            <div>
              <span className="eyebrow">Meeting channel</span>
              <h2>Video and controls</h2>
            </div>
            <div className="conference-stage-meta">
              <span className="conference-stage-meta-item">
                <FiActivity />
                Real-time
              </span>
              <span className="conference-stage-meta-item mono">{interviewId}</span>
            </div>
          </div>
          <div className="conference-video-wrap">
            <VideoChat interviewId={interviewId} userType={userType} userName={userName} />
          </div>
        </section>

        {userType === 'recruiter' && (
          <section className="conference-feedback-shell surface-card">
            <div className="conference-feedback-head">
              <div>
                <span className="eyebrow">Decision record</span>
                <h2>Interview feedback</h2>
              </div>
              <p>
                Capture evidence while the interview is fresh. This keeps candidate communication
                and follow-up decisions aligned with the live session.
              </p>
            </div>
            <InterviewFeedback
              interviewId={interviewId}
              onFeedbackSubmitted={() => {
                try {
                  interviewService.updateInterviewStatus(interviewId, 'completed');
                } catch (err) {
                  console.error('Error updating interview status:', err);
                }
              }}
            />
          </section>
        )}

        {userType === 'candidate' && interview.feedback?.isShared && (
          <section className="conference-feedback-shell surface-card">
            <div className="conference-feedback-head">
              <div>
                <span className="eyebrow">Shared review</span>
                <h2>Recruiter feedback</h2>
              </div>
              <p>
                The recruiter has shared the interview assessment for this session. Review the
                notes alongside your preparation flow and next steps.
              </p>
            </div>
            <InterviewFeedback interviewId={interviewId} readOnly />
          </section>
        )}
      </div>
    </div>
  );
};

export default VideoConferencePage;
