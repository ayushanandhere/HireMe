import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, Card, Alert, Button } from 'react-bootstrap';
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
  
  const handleFeedbackSubmitted = (feedbackData) => {
    setSuccessMessage('Feedback submitted successfully!');
    
    // Update the interview object with the new feedback
    setInterview(prev => ({
      ...prev,
      feedback: feedbackData
    }));
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (loading) {
    return <div className="loading">Loading interview details...</div>;
  }
  
  if (error) {
    return (
      <div className="dashboard-container">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/dashboard/recruiter/interviews')}>
          <FaArrowLeft className="me-2" /> Back to Interviews
        </Button>
      </div>
    );
  }
  
  if (!interview) {
    return (
      <div className="dashboard-container">
        <Alert variant="warning">Interview not found or you don't have permission to view it.</Alert>
        <Button variant="secondary" onClick={() => navigate('/dashboard/recruiter/interviews')}>
          <FaArrowLeft className="me-2" /> Back to Interviews
        </Button>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Provide Interview Feedback</h1>
        <Link to="/dashboard/recruiter/interviews" className="btn btn-outline-secondary">
          <FaArrowLeft className="me-2" /> Back to Interviews
        </Link>
      </div>
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}
      
      <div className="dashboard-content">
        <Card className="mb-4">
          <Card.Header>
            <h4 className="mb-0">Interview Details</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Candidate:</strong> {interview.candidate?.name || 'Not specified'}</p>
                <p><strong>Position:</strong> {interview.position.title}</p>
              </Col>
              <Col md={6}>
                <p><strong>Date & Time:</strong> {formatDateTime(interview.scheduledDateTime)}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${interview.status}`}>
                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                </span></p>
              </Col>
            </Row>
            
            {interview.notes && (
              <div className="mt-3">
                <h5>Interview Notes</h5>
                <p className="feedback-comment">{interview.notes}</p>
              </div>
            )}
          </Card.Body>
        </Card>
        
        <InterviewFeedback 
          interviewId={interviewId} 
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
        
        <div className="mt-4">
          <Link to="/dashboard/recruiter/interviews" className="btn btn-secondary">
            <FaArrowLeft className="me-2" /> Back to Interviews
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecruiterInterviewFeedbackPage; 