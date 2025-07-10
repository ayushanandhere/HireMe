import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoChat from '../components/VideoChat';
import InterviewFeedback from '../components/InterviewFeedback';
import { interviewService, authService } from '../services/api';
import '../styles/VideoConference.css';

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
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          setError('User authentication required');
          setLoading(false);
          return;
        }

        // Get user info
        const userInfo = authService.getUser();
        const userRole = authService.getUserRole();
        
        if (!userInfo) {
          setError('User information not found. Please login again.');
          setLoading(false);
          return;
        }
        
        // Set user type and name
        setUserType(userRole || '');
        setUserName(userInfo.name || userInfo.email || 'User');
        
        console.log('User authenticated:', userRole, userInfo.name);
        
        // Fetch interview details
        if (!interviewId) {
          setError('Interview ID is required');
          setLoading(false);
          return;
        }
        
        const response = await interviewService.getInterviewById(interviewId);
        
        if (response && response.success) {
          console.log('Interview data loaded successfully');
          setInterview(response.data);
        } else {
          setError('Failed to load interview details');
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
  
  // Handle case when interview is loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3 className="mt-3 mb-2">Setting up your conference...</h3>
        <p className="text-muted">Preparing your virtual interview room</p>
      </div>
    );
  }
  
  // Handle case when there's an error
  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading mb-2">Connection Error</h4>
          <p>{error}</p>
        </div>
        <button className="btn btn-primary px-4 py-2" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }
  
  // Handle case when interview is not found
  if (!interview) {
    return (
      <div className="error-container">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading mb-2">Interview Not Found</h4>
          <p>The interview you're looking for doesn't exist or you don't have permission to access it.</p>
        </div>
        <button className="btn btn-primary px-4 py-2" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }
  
  // Format date nicely
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
  
  // Extract relevant information from the interview
  const interviewInfo = {
    candidateName: interview.candidate?.name || 'Candidate',
    recruiterName: interview.recruiter?.name || 'Recruiter',
    position: interview.position?.title || 'Position',
    company: interview.recruiter?.company || 'Company',
    scheduledTime: formatDateTime(interview.scheduledDateTime),
    duration: interview.duration || 60,
    status: interview.status
  };
  
  // Capitalize status for display
  const capitalizeStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <div className="video-conference-page">
      {/* Modern Interview Info Header */}
      <div className="interview-info">
        <h2>{interviewInfo.position} Interview</h2>
        <div className="interview-details">
          <p>
            <strong>Candidate:</strong> 
            <span className="ms-1">{interviewInfo.candidateName}</span>
          </p>
          <p>
            <strong>Recruiter:</strong> 
            <span className="ms-1">{interviewInfo.recruiterName}</span>
            {interviewInfo.company && (
              <span className="ms-1">({interviewInfo.company})</span>
            )}
          </p>
          <p>
            <strong>Scheduled:</strong> 
            <span className="ms-1">{interviewInfo.scheduledTime}</span>
          </p>
          <p>
            <strong>Duration:</strong> 
            <span className="ms-1">{interviewInfo.duration} minutes</span>
          </p>
          <p>
            <strong>Status:</strong> 
            <span className={`status-${interviewInfo.status} ms-1`}>
              {capitalizeStatus(interviewInfo.status)}
            </span>
          </p>
        </div>
      </div>
      
      {/* Video Conference Section */}
      <div className="video-section">
        <VideoChat 
          interviewId={interviewId} 
          userType={userType}
          userName={userName}
        />
      </div>
      
      {/* Show feedback component for recruiters */}
      {userType === 'recruiter' && (
        <div className="feedback-section">
          <h3>Interview Feedback</h3>
          <p className="text-muted mb-4">
            You can provide feedback during or after the interview. 
            This will help the candidate understand their performance and areas for improvement.
          </p>
          <InterviewFeedback 
            interviewId={interviewId}
            onFeedbackSubmitted={() => {
              // Update interview status to completed
              try {
                interviewService.updateInterviewStatus(interviewId, 'completed');
              } catch (err) {
                console.error('Error updating interview status:', err);
              }
            }}
          />
        </div>
      )}
      
      {/* Show feedback to candidate if it's shared */}
      {userType === 'candidate' && interview.feedback && interview.feedback.isShared && (
        <div className="feedback-section">
          <h3>Recruiter Feedback</h3>
          <p className="text-muted mb-4">
            The recruiter has shared their feedback on your interview performance.
          </p>
          <InterviewFeedback 
            interviewId={interviewId}
            readOnly={true} 
          />
        </div>
      )}
    </div>
  );
};

export default VideoConferencePage; 