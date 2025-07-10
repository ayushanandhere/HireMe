import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaEye, FaCheckCircle, FaTimesCircle, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
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
  const [actionSuccess, setActionSuccess] = useState('');
  const { notifications } = useNotifications();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      // Get user data
      const userData = authService.getUser();
      setUser(userData);
      
      // Fetch interviews
      const response = await interviewService.getCandidateInterviews();
      
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

  const handleActionClick = async (interviewId, status) => {
    try {
      setActionSuccess('');
      setError('');
      
      const response = await interviewService.updateInterviewStatus(interviewId, status);
      
      if (response.success) {
        setActionSuccess(`Interview ${status === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
        
        // Update the local state
        setTimeout(() => {
          window.location.reload(); // Refresh to get updated data
        }, 1500);
      }
    } catch (err) {
      setError(`Failed to ${status} interview. Please try again.`);
      console.error(`Error ${status}ing interview:`, err);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading interviews...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Interview Inbox</h1>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {actionSuccess && (
        <div className="alert alert-success" role="alert">
          {actionSuccess}
        </div>
      )}
      
      <div className="dashboard-content">
        {/* Pending Interview Requests */}
        <div className="dashboard-card full-width">
          <h2 className="section-title">Pending Interview Requests</h2>
          
          {interviews.pending.length > 0 ? (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Scheduled Date & Time</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.pending.map((interview) => (
                    <tr key={interview._id}>
                      <td>{interview.recruiter?.company || 'N/A'}</td>
                      <td>{interview.position?.title || 'N/A'}</td>
                      <td>{formatDate(interview.scheduledDateTime)}</td>
                      <td>{interview.duration} minutes</td>
                      <td>
                        <div className="interview-actions">
                          <button 
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleActionClick(interview._id, 'accepted')}
                            title="Accept Interview"
                          >
                            <FaCheckCircle />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleActionClick(interview._id, 'rejected')}
                            title="Decline Interview"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted empty-state">No pending interview requests.</p>
          )}
        </div>
        
        {/* Upcoming Interviews */}
        <div className="dashboard-card full-width">
          <h2 className="section-title">Upcoming Interviews</h2>
          
          {interviews.upcoming.length > 0 ? (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Scheduled Date & Time</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.upcoming.map((interview) => (
                    <tr key={interview._id}>
                      <td>{interview.recruiter?.company || 'N/A'}</td>
                      <td>{interview.position?.title || 'N/A'}</td>
                      <td>{formatDate(interview.scheduledDateTime)}</td>
                      <td>{interview.duration} minutes</td>
                      <td>
                        <div className="interview-actions">
                          <Link 
                            to={`/interview/${interview._id}/meeting`}
                            className="btn btn-sm btn-success me-2"
                            title="Join Video Call"
                          >
                            <FaVideo />
                          </Link>
                          {interview.applicationId && (
                            <Link 
                              to={`/application/${interview.applicationId._id || interview.applicationId}/training`}
                              className="btn btn-sm btn-primary"
                              style={{ 
                                background: 'linear-gradient(to right, #6a11cb, #ff9e00)', 
                                border: 'none' 
                              }}
                              title="AI Interview Training"
                            >
                              <FaGraduationCap />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted empty-state">No upcoming interviews scheduled.</p>
          )}
        </div>
        
        {/* Past Interviews */}
        <div className="dashboard-card full-width">
          <h2 className="section-title">Past Interviews</h2>
          
          {interviews.past.length > 0 ? (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.past.map((interview) => (
                    <tr key={interview._id}>
                      <td>{interview.recruiter?.company || 'N/A'}</td>
                      <td>{interview.position?.title || 'N/A'}</td>
                      <td>{formatDate(interview.scheduledDateTime)}</td>
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
                        {interview.feedback && interview.feedback.isShared ? (
                          <Link 
                            to={`/dashboard/candidate/interviews/${interview._id}`}
                            className="btn btn-sm btn-primary"
                            title="View Feedback"
                          >
                            <FaEye />
                          </Link>
                        ) : (
                          <span className="text-muted">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted empty-state">No past interviews.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewInboxPage; 