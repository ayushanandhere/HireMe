import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, Card, Alert, Button } from 'react-bootstrap';
import InterviewFeedback from '../../components/InterviewFeedback';
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
        
        // Get interview details
        const response = await interviewService.getInterviewById(interviewId);
        
        if (response.success) {
          setInterview(response.data);
        } else {
          setError('Failed to load interview details');
        }
      } catch (err) {
        console.error('Error fetching interview details:', err);
        setError(err.message || 'Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };
    
    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId]);
  
  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Helper function to render stars based on score
  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score / 2);
    const hasHalfStar = score % 2 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="filled" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="half" />);
      } else {
        stars.push(<FaRegStar key={i} className="empty" />);
      }
    }
    
    return <div className="star-rating">{stars} <span className="ms-2">({score}/10)</span></div>;
  };

  if (loading) {
    return (
      <div className="feedback-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="mt-3">Loading feedback...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="feedback-page-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <Button className="back-button mt-3" onClick={() => navigate('/dashboard/candidate/interviews')}>
            <FaArrowLeft className="me-2" /> Back to Interviews
          </Button>
        </div>
      </div>
    );
  }
  
  if (!interview) {
    return (
      <div className="feedback-page-container">
        <div className="error-container">
          <p className="error-message">Interview not found or you don't have permission to view it.</p>
          <Button className="back-button mt-3" onClick={() => navigate('/dashboard/candidate/interviews')}>
            <FaArrowLeft className="me-2" /> Back to Interviews
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="feedback-page-container">
      <div className="feedback-page-header">
        <h1>Interview Feedback</h1>
        <Link to="/dashboard/candidate/interviews" className="back-button">
          <FaArrowLeft className="me-2" /> Back to Interviews
        </Link>
      </div>
      
      <div className="interview-details-card">
        <div className="card-body">
          <h4>Interview Details</h4>
          <div className="detail-row">
            <div className="detail-item">
              <div className="detail-label">Position</div>
              <div className="detail-value">{interview.position.title}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Company</div>
              <div className="detail-value">{interview.recruiter?.company || 'Not specified'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Interviewer</div>
              <div className="detail-value">{interview.recruiter?.name || 'Not specified'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Date & Time</div>
              <div className="detail-value">{formatDateTime(interview.scheduledDateTime)}</div>
            </div>
          </div>
        </div>
      </div>
      
      {(!interview.feedback || !interview.feedback.isShared) ? (
        <div className="no-feedback">
          <div className="no-feedback-icon">
            <FaInfoCircle />
          </div>
          <div className="no-feedback-message">
            Feedback for this interview is not yet available or has not been shared with you.
          </div>
          <p className="text-muted">
            Once the recruiter shares feedback, you'll be able to view your performance assessment here.
          </p>
        </div>
      ) : (
        <div className="feedback-content">
          <div className="feedback-score-card">
            <div className="card-header">Performance Overview</div>
            <div className="card-body">
              <div className="overall-score-container">
                <div className="overall-score-circle">
                  <div className="overall-score-value">{interview.feedback.overall.score}</div>
                </div>
                <div className="overall-score-label">Overall Score</div>
                {renderStars(interview.feedback.overall.score)}
              </div>
              
              <div className="skill-score">
                <div className="skill-header">
                  <div className="skill-name">Technical Skills</div>
                  <div className="skill-value">{interview.feedback.technical.score}</div>
                </div>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: `${interview.feedback.technical.score * 10}%` }}></div>
                </div>
                {interview.feedback.technical.comments && (
                  <div className="skill-comment">{interview.feedback.technical.comments}</div>
                )}
              </div>
              
              <div className="skill-score">
                <div className="skill-header">
                  <div className="skill-name">Communication Skills</div>
                  <div className="skill-value">{interview.feedback.communication.score}</div>
                </div>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: `${interview.feedback.communication.score * 10}%` }}></div>
                </div>
                {interview.feedback.communication.comments && (
                  <div className="skill-comment">{interview.feedback.communication.comments}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="feedback-score-card">
            <div className="card-header">Detailed Assessment</div>
            <div className="card-body">
              <div className="skill-score">
                <div className="skill-header">
                  <div className="skill-name">Problem-Solving Skills</div>
                  <div className="skill-value">{interview.feedback.problemSolving.score}</div>
                </div>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: `${interview.feedback.problemSolving.score * 10}%` }}></div>
                </div>
                {interview.feedback.problemSolving.comments && (
                  <div className="skill-comment">{interview.feedback.problemSolving.comments}</div>
                )}
              </div>
              
              <div className="skill-score mt-4">
                <div className="skill-header">
                  <div className="skill-name">Overall Assessment</div>
                </div>
                {interview.feedback.overall.comments ? (
                  <div className="skill-comment">{interview.feedback.overall.comments}</div>
                ) : (
                  <div className="text-muted">No additional comments provided.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInterviewFeedbackPage; 