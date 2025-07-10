import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Spinner, ProgressBar } from 'react-bootstrap'; // Added ProgressBar
import { FaBuilding, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaFileAlt, FaInfoCircle, FaMicrophone } from 'react-icons/fa'; // Added more icons
import { authService } from '../../services/api';
import './MyApplicationsPage.css'; // Import new CSS

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Get user data
      const userData = authService.getUser();
      if (!userData || !userData._id) {
        throw new Error('User data not found');
      }
      
      // Fetch applications
      const response = await fetch(`http://localhost:5000/api/applications/candidate/${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch applications');
      }
    } catch (err) {
      setError('Error fetching your applications. Please try again.');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    // Updated to return class names for better styling control
    let badgeVariant = 'secondary';
    let statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    switch (status) {
      case 'new_application': badgeVariant = 'info'; break;
      case 'resume_screened': badgeVariant = 'primary'; break;
      case 'job_matched': badgeVariant = 'success'; break;
      case 'interview_requested': badgeVariant = 'warning'; statusText = 'Interview Requested'; break;
      case 'interview_scheduled': badgeVariant = 'warning'; statusText = 'Interview Scheduled'; break;
      case 'interview_completed': badgeVariant = 'info'; statusText = 'Interview Completed'; break;
      case 'interview_cancelled': badgeVariant = 'danger'; statusText = 'Interview Cancelled'; break;
      case 'offer_extended': badgeVariant = 'success'; statusText = 'Offer Extended'; break;
      case 'offer_accepted': badgeVariant = 'success'; statusText = 'Offer Accepted'; break;
      case 'rejected': badgeVariant = 'danger'; break;
      case 'withdrawn': badgeVariant = 'dark'; break;
      default: break;
    }
    return <span className={`status-badge status-badge-${badgeVariant}`}>{statusText}</span>;
  };

  const getStatusIcon = (status) => {
    // Updated to return icons with consistent class for styling
    switch (status) {
      case 'new_application':
      case 'resume_screened':
      case 'job_matched':
        return <FaHourglassHalf className="status-icon status-icon-pending" />;
      case 'interview_requested':
      case 'interview_scheduled':
        return <FaHourglassHalf className="status-icon status-icon-warning" />;
      case 'offer_extended':
      case 'offer_accepted':
      case 'interview_completed':
        return <FaCheckCircle className="status-icon status-icon-success" />;
      case 'interview_cancelled':
      case 'rejected':
      case 'withdrawn':
        return <FaTimesCircle className="status-icon status-icon-danger" />;
      default:
        return <FaFileAlt className="status-icon status-icon-default" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="my-applications-page">
      <header className="map-header">
        <h1 className="map-title">My Applications</h1>
        <Link to="/dashboard/candidate/jobs" className="map-browse-jobs-btn">
          <FaSearch className="me-2" /> Browse More Jobs
        </Link>
      </header>

      {error && (
        <div className="map-error-alert">
          <FaInfoCircle className="me-2" /> {error}
        </div>
      )}

      {applications.length === 0 && !loading && (
        <div className="map-empty-state">
          <FaFileAlt className="map-empty-icon" />
          <h2>No Applications Found</h2>
          <p>You haven't applied to any jobs yet. Start your job search today!</p>
          <Link to="/dashboard/candidate/jobs" className="map-browse-jobs-btn-empty">
            <FaSearch className="me-2" /> Browse Available Jobs
          </Link>
        </div>
      )}

      {applications.length > 0 && (
        <div className="map-applications-grid">
          {applications.map(application => (
            <div key={application._id} className="map-application-card">
              <div className="map-card-header">
                <div className="map-job-title">{application.job.title}</div>
                <div className="map-status-icon-wrapper">
                  {getStatusIcon(application.stage)}
                </div>
              </div>
              <div className="map-company-info">
                <FaBuilding className="map-icon" /> {application.job.company}
              </div>
              <div className="map-job-details">
                <span><FaBriefcase className="map-icon" /> {application.job.type}</span>
                {application.job.location && <span>{application.job.location}</span>}
              </div>
              <div className="map-date-applied">
                <FaCalendarAlt className="map-icon" /> Applied: {formatDate(application.createdAt)}
              </div>
              <div className="map-status-section">
                Current Status: {getStatusBadge(application.stage)}
              </div>

              {/* Special messages based on stage */}
              {application.stage === 'interview_requested' && (
                <div className="map-alert map-alert-warning">
                  <strong>Interview Requested!</strong> Check notifications.
                </div>
              )}
              {application.stage === 'interview_scheduled' && (
                <div className="map-alert map-alert-info">
                  <strong>Interview Scheduled!</strong> Prepare well.
                </div>
              )}
              {application.stage === 'interview_cancelled' && (
                <div className="map-alert map-alert-danger">
                  <strong>Interview Cancelled!</strong> The recruiter has cancelled this interview.
                </div>
              )}
              {application.stage === 'rejected' && (
                <div className="map-alert map-alert-danger">
                  <strong>Application Update:</strong> Recruiter is pursuing other candidates.
                </div>
              )}

              {/* Match Scores - Using React-Bootstrap ProgressBar */}
              {(application.matchScore > 0 || application.feedbackScore > 0) && (
                <div className="map-scores-section">
                  {application.matchScore > 0 && (
                    <div className="map-score-item">
                      <label>Job Match:</label>
                      <ProgressBar 
                        now={application.matchScore} 
                        label={`${application.matchScore}%`} 
                        variant="info" 
                        animated 
                        className="map-progress-bar"
                      />
                    </div>
                  )}
                  {application.feedbackScore > 0 && (
                    <div className="map-score-item">
                      <label>Feedback Score:</label>
                      <ProgressBar 
                        now={application.feedbackScore} 
                        label={`${application.feedbackScore}%`} 
                        variant="success" 
                        animated 
                        className="map-progress-bar"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="map-action-buttons">
                <Link to={`/application/${application._id}/training`} className="map-training-btn">
                  <FaBriefcase className="me-2" /> AI Interview Training
                </Link>
                <Link to={`/application/${application._id}/mock-interview`} className="map-mock-interview-btn">
                  <FaMicrophone className="me-2" /> AI Voice Interview
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
