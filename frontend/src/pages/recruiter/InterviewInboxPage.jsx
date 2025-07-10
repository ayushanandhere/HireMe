import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaVideo, FaTimes, FaPaperPlane, FaStar, FaRobot, FaArrowRight } from 'react-icons/fa';
import { authService, interviewService } from '../../services/api';
import videoService from '../../services/videoService';
import { useNotifications } from '../../contexts/NotificationContext';
import './Dashboard.css';

const InterviewInboxPage = () => {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState({
    pending: [],
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      // Get user data
      const userData = authService.getUser();
      setUser(userData);
      
      // Fetch interviews
      const response = await interviewService.getRecruiterInterviews();
      
      if (response.success) {
        // Organize interviews by status
        const now = new Date();
        const pending = [];
        const upcoming = [];
        const past = [];
        
        response.data.forEach(interview => {
          const interviewDate = new Date(interview.scheduledDateTime);
          
          if (interview.status === 'pending') {
            pending.push(interview);
          } else if (['accepted', 'completed'].includes(interview.status)) {
            if (interviewDate > now) {
              upcoming.push(interview);
            } else {
              past.push(interview);
            }
          }
        });
        
        setInterviews({
          pending,
          upcoming,
          past
        });
      }
    } catch (err) {
      setError('Failed to load interviews. Please refresh and try again.');
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch interviews on component mount
  useEffect(() => {
    fetchInterviews();
  }, []);

  // Refetch interviews when a new notification related to interviews is received
  useEffect(() => {
    // Check if any of the notifications are interview related
    const interviewNotifications = notifications.filter(notification => 
      notification.type.includes('interview_') || 
      (notification.relatedTo && notification.relatedTo.model === 'Interview')
    );
    
    if (interviewNotifications.length > 0) {
      console.log('Received interview notification, refreshing data');
      fetchInterviews();
    }
  }, [notifications]);

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const handleStatusUpdate = async (interviewId, newStatus) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const response = await interviewService.updateInterviewStatus(interviewId, newStatus);
      
      if (response.success) {
        setSuccessMessage(`Interview ${newStatus === 'cancelled' ? 'cancelled' : 'updated'} successfully!`);
        
        // Update local state to reflect the change
        const updatedInterviews = { ...interviews };
        
        // Find and update the interview in any of the categories
        ['pending', 'upcoming', 'past'].forEach(category => {
          const index = updatedInterviews[category].findIndex(i => i._id === interviewId);
          
          if (index !== -1) {
            const interview = { ...updatedInterviews[category][index], status: newStatus };
            
            // Remove from current category
            updatedInterviews[category].splice(index, 1);
            
            // Add to appropriate category based on new status and date
            const interviewDate = new Date(interview.scheduledDateTime);
            const now = new Date();
            
            if (newStatus === 'cancelled') {
              updatedInterviews.past.push(interview);
              updatedInterviews.past.sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime));
            } else if (newStatus === 'accepted' && interviewDate > now) {
              updatedInterviews.upcoming.push(interview);
              updatedInterviews.upcoming.sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime));
            } else {
              updatedInterviews.past.push(interview);
              updatedInterviews.past.sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime));
            }
          }
        });
        
        setInterviews(updatedInterviews);
      }
    } catch (err) {
      setError(err.message || 'Failed to update interview status. Please try again.');
    }
  };
  
  const handleFeedbackClick = (interviewId) => {
    // Navigate to feedback page
    window.location.href = `/dashboard/recruiter/interviews/${interviewId}/feedback`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Interview Management</h1>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}
      
      <div className="dashboard-content">
        {/* Pending Interview Requests */}
        <div className="dashboard-card full-width">
          <h2 className="section-title">Pending Interview Requests</h2>
          
          {interviews.pending.length === 0 ? (
            <p className="text-muted empty-state">No pending interview requests.</p>
          ) : (
            <div className="table-responsive">
              <table className="table modern-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position</th>
                    <th>Scheduled For</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.pending.map(interview => (
                    <tr key={interview._id}>
                      <td>{interview.candidate.name}</td>
                      <td>{interview.position.title}</td>
                      <td>{formatDateTime(interview.scheduledDateTime)}</td>
                      <td>{interview.duration} mins</td>
                      <td>
                        <span className="badge bg-warning">Pending</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger ms-2"
                          onClick={() => handleStatusUpdate(interview._id, 'cancelled')}
                          title="Cancel Interview"
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Upcoming Interviews */}
        <div className="dashboard-card full-width">
          <h2 className="section-title">Upcoming Interviews</h2>
          
          {interviews.upcoming.length === 0 ? (
            <p className="text-muted empty-state">No upcoming interviews scheduled.</p>
          ) : (
            <div className="table-responsive">
              <table className="table modern-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position</th>
                    <th>Scheduled For</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.upcoming.map(interview => (
                    <tr key={interview._id}>
                      <td>{interview.candidate.name}</td>
                      <td>{interview.position.title}</td>
                      <td>{formatDateTime(interview.scheduledDateTime)}</td>
                      <td>{interview.duration} mins</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link
                            to={`/interview/${interview._id}/briefing`}
                            className="btn btn-sm btn-primary me-2"
                            title="AI Interview Briefing"
                            style={{
                              background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FaRobot /> <span className="d-none d-md-inline">Briefing</span>
                          </Link>
                          <Link
                            to={`/interview/${interview._id}/meeting`}
                            className="btn btn-sm btn-success me-2"
                            title="Join Video Call"
                          >
                            <FaVideo /> <span className="d-none d-md-inline">Join Call</span>
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleStatusUpdate(interview._id, 'cancelled')}
                            title="Cancel Interview"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Past Interviews */}
        <div className="dashboard-card full-width">
          <h2 className="section-title">Past Interviews</h2>
          
          {interviews.past.length === 0 ? (
            <p className="text-muted empty-state">No past interviews found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table modern-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position</th>
                    <th>Scheduled On</th>
                    <th>Status</th>
                    <th>Feedback</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.past.map(interview => (
                    <tr key={interview._id}>
                      <td>{interview.candidate.name}</td>
                      <td>{interview.position.title}</td>
                      <td>{formatDateTime(interview.scheduledDateTime)}</td>
                      <td>
                        <span className={`badge ${
                          interview.status === 'completed' ? 'bg-success' : 
                          interview.status === 'cancelled' ? 'bg-danger' : 
                          interview.status === 'rejected' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {interview.feedback ? (
                          <span className="text-success">
                            <FaStar className="me-1" />
                            {interview.feedback.overallScore}/10
                          </span>
                        ) : (
                          <span className="text-muted">Not rated</span>
                        )}
                      </td>
                      <td>
                        {interview.status === 'completed' && !interview.feedback && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleFeedbackClick(interview._id)}
                            title="Add Feedback"
                          >
                            <FaPaperPlane />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewInboxPage; 