import { useState, useEffect } from 'react';
import { Button, Form, Row, Col, Card, Alert } from 'react-bootstrap';
import { interviewService, authService } from '../services/api';
import { FaStar, FaStarHalfAlt, FaRegStar, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/InterviewFeedback.css';

const InterviewFeedback = ({ interviewId, readOnly = false, onFeedbackSubmitted }) => {
  const [feedback, setFeedback] = useState({
    technical: 0,
    communication: 0,
    problemSolving: 0,
    overall: 0,
    comments: {
      technical: '',
      communication: '',
      problemSolving: '',
      overall: ''
    },
    isShared: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [userRole, setUserRole] = useState('');
  
  useEffect(() => {
    // Get user role
    const role = authService.getUserRole();
    setUserRole(role);
    
    // Fetch existing feedback if available
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const response = await interviewService.getFeedback(interviewId);
        
        if (response.success && response.data.feedback) {
          setExistingFeedback(response.data.feedback);
          
          // Initialize form with existing data
          setFeedback({
            technical: response.data.feedback.technical.score || 0,
            communication: response.data.feedback.communication.score || 0,
            problemSolving: response.data.feedback.problemSolving.score || 0,
            overall: response.data.feedback.overall.score || 0,
            comments: {
              technical: response.data.feedback.technical.comments || '',
              communication: response.data.feedback.communication.comments || '',
              problemSolving: response.data.feedback.problemSolving.comments || '',
              overall: response.data.feedback.overall.comments || ''
            },
            isShared: response.data.feedback.isShared || false
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
    
    if (interviewId) {
      fetchFeedback();
    }
  }, [interviewId]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (['technical', 'communication', 'problemSolving', 'overall'].includes(name)) {
      setFeedback(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
    } else if (name.startsWith('comments-')) {
      const commentType = name.replace('comments-', '');
      setFeedback(prev => ({
        ...prev,
        comments: {
          ...prev.comments,
          [commentType]: value
        }
      }));
    }
  };
  
  const handleVisibilityToggle = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const newVisibility = !feedback.isShared;
      const response = await interviewService.updateFeedbackVisibility(interviewId, newVisibility);
      
      if (response.success) {
        setFeedback(prev => ({
          ...prev,
          isShared: newVisibility
        }));
        
        setSuccess(`Feedback is now ${newVisibility ? 'visible' : 'hidden'} to the candidate`);
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
      
      // Prepare feedback data
      const feedbackData = {
        technical: feedback.technical,
        communication: feedback.communication,
        problemSolving: feedback.problemSolving,
        overall: feedback.overall,
        comments: feedback.comments,
        isShared: feedback.isShared
      };
      
      // Submit feedback
      const response = await interviewService.submitFeedback(interviewId, feedbackData);
      
      if (response.success) {
        setSuccess('Feedback submitted successfully');
        setExistingFeedback(response.data);
        
        // Call the callback if provided
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(response.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderRatingOptions = () => {
    const options = [];
    for (let i = 0; i <= 10; i++) {
      options.push(
        <option key={i} value={i}>
          {i} - {getRatingLabel(i)}
        </option>
      );
    }
    return options;
  };
  
  const getRatingLabel = (score) => {
    if (score === 0) return 'Not rated';
    if (score <= 2) return 'Poor';
    if (score <= 4) return 'Below Average';
    if (score <= 6) return 'Average';
    if (score <= 8) return 'Good';
    if (score <= 9) return 'Excellent';
    return 'Outstanding';
  };
  
  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score / 2);
    const hasHalfStar = score % 2 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-warning" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-warning" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-muted" />);
      }
    }
    
    return <div className="d-flex">{stars} <span className="ms-2">({score}/10)</span></div>;
  };
  
  if (isLoading) {
    return <div className="text-center my-4">Loading feedback data...</div>;
  }
  
  // Read-only view for candidates
  if (userRole === 'candidate' || readOnly) {
    if (!existingFeedback) {
      return (
        <div className="feedback-form">
          <div className="text-center p-4">
            <p className="mb-0">No feedback available for this interview yet.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="feedback-display">
        <h4>Interview Feedback</h4>
        
        <div className="overall-score">
          <div className="overall-score-value">{existingFeedback.overall.score}</div>
          <div className="overall-score-label">Overall Score</div>
          {renderStars(existingFeedback.overall.score)}
        </div>
        
        <Row className="mb-4">
          <Col md={6} className="mb-4 mb-md-0">
            <h5>Technical Skills</h5>
            <div className="feedback-score">
              <span className="feedback-score-label">Score:</span>
              <span className="feedback-score-value">{existingFeedback.technical.score}</span>
            </div>
            {existingFeedback.technical.comments && (
              <div className="feedback-comments">
                {existingFeedback.technical.comments}
              </div>
            )}
          </Col>
          <Col md={6}>
            <h5>Communication Skills</h5>
            <div className="feedback-score">
              <span className="feedback-score-label">Score:</span>
              <span className="feedback-score-value">{existingFeedback.communication.score}</span>
            </div>
            {existingFeedback.communication.comments && (
              <div className="feedback-comments">
                {existingFeedback.communication.comments}
              </div>
            )}
          </Col>
        </Row>
        
        <Row>
          <Col md={6} className="mb-4 mb-md-0">
            <h5>Problem-Solving Skills</h5>
            <div className="feedback-score">
              <span className="feedback-score-label">Score:</span>
              <span className="feedback-score-value">{existingFeedback.problemSolving.score}</span>
            </div>
            {existingFeedback.problemSolving.comments && (
              <div className="feedback-comments">
                {existingFeedback.problemSolving.comments}
              </div>
            )}
          </Col>
          <Col md={6}>
            <h5>Overall Assessment</h5>
            {existingFeedback.overall.comments && (
              <div className="feedback-comments">
                {existingFeedback.overall.comments}
              </div>
            )}
          </Col>
        </Row>
      </div>
    );
  }
  
  // Form view for recruiters
  return (
    <div className="feedback-form">
      <h4>Provide Interview Feedback</h4>
      
      {existingFeedback && (
        <div className="d-flex justify-content-end mb-3">
          <Button 
            variant={feedback.isShared ? "primary" : "outline-secondary"} 
            size="sm"
            onClick={handleVisibilityToggle}
            disabled={isLoading}
            className="visibility-toggle"
          >
            {feedback.isShared ? <><FaEye className="me-2" /> Visible to Candidate</> : <><FaEyeSlash className="me-2" /> Hidden from Candidate</>}
          </Button>
        </div>
      )}
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row className="mb-4">
          <Col md={6} className="mb-4 mb-md-0">
            <div className="form-group">
              <h4>Technical Skills</h4>
              <div className="score-input">
                <label>Score:</label>
                <div className="score-slider">
                  <input
                    type="range"
                    name="technical"
                    min="0"
                    max="10"
                    value={feedback.technical}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="score-display">{feedback.technical}</div>
              </div>
              <div>{getRatingLabel(feedback.technical)}</div>
              <textarea
                name="comments-technical"
                placeholder="Comments on technical skills (optional)"
                value={feedback.comments.technical}
                onChange={handleInputChange}
                className="form-control mt-3"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </Col>
          <Col md={6}>
            <div className="form-group">
              <h4>Communication Skills</h4>
              <div className="score-input">
                <label>Score:</label>
                <div className="score-slider">
                  <input
                    type="range"
                    name="communication"
                    min="0"
                    max="10"
                    value={feedback.communication}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="score-display">{feedback.communication}</div>
              </div>
              <div>{getRatingLabel(feedback.communication)}</div>
              <textarea
                name="comments-communication"
                placeholder="Comments on communication skills (optional)"
                value={feedback.comments.communication}
                onChange={handleInputChange}
                className="form-control mt-3"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={6} className="mb-4 mb-md-0">
            <div className="form-group">
              <h4>Problem-Solving Skills</h4>
              <div className="score-input">
                <label>Score:</label>
                <div className="score-slider">
                  <input
                    type="range"
                    name="problemSolving"
                    min="0"
                    max="10"
                    value={feedback.problemSolving}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="score-display">{feedback.problemSolving}</div>
              </div>
              <div>{getRatingLabel(feedback.problemSolving)}</div>
              <textarea
                name="comments-problemSolving"
                placeholder="Comments on problem-solving skills (optional)"
                value={feedback.comments.problemSolving}
                onChange={handleInputChange}
                className="form-control mt-3"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </Col>
          <Col md={6}>
            <div className="form-group">
              <h4>Overall Assessment</h4>
              <div className="score-input">
                <label>Score:</label>
                <div className="score-slider">
                  <input
                    type="range"
                    name="overall"
                    min="0"
                    max="10"
                    value={feedback.overall}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="score-display">{feedback.overall}</div>
              </div>
              <div>{getRatingLabel(feedback.overall)}</div>
              <textarea
                name="comments-overall"
                placeholder="Overall comments (optional)"
                value={feedback.comments.overall}
                onChange={handleInputChange}
                className="form-control mt-3"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </Col>
        </Row>
        
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="feedbackVisibility"
            checked={feedback.isShared}
            onChange={() => setFeedback(prev => ({ ...prev, isShared: !prev.isShared }))}
            disabled={isLoading}
          />
          <label className="form-check-label" htmlFor="feedbackVisibility">
            Share feedback with candidate
          </label>
        </div>
        
        <div className="d-flex justify-content-end mt-4">
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Submitting...' : (existingFeedback ? 'Update Feedback' : 'Submit Feedback')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default InterviewFeedback; 