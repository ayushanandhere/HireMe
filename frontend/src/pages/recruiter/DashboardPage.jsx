import React, { useState, useEffect } from 'react';
import { authService, interviewService } from '../../services/api';
import { Link } from 'react-router-dom';
import { 
  FaCalendar, 
  FaUsers, 
  FaBriefcase, 
  FaChartLine, 
  FaPlus, 
  FaArrowRight,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner
} from 'react-icons/fa';
import './Dashboard.css';

const RecruiterDashboardPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState({
    pending: 0,
    upcoming: 0,
    past: 0
  });
  const [activeJobs, setActiveJobs] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user data
        const userData = authService.getUser();
        setUser(userData);

        // Fetch interviews data
        const interviewsResponse = await interviewService.getRecruiterInterviews();
        if (interviewsResponse.success) {
          // Organize interviews by status
          const now = new Date();
          let pendingCount = 0;
          let upcomingCount = 0;
          let pastCount = 0;
          
          interviewsResponse.data.forEach(interview => {
            const interviewDate = new Date(interview.scheduledDateTime);
            
            if (interview.status === 'pending') {
              pendingCount++;
            } else if (['accepted', 'completed'].includes(interview.status)) {
              if (interviewDate > now) {
                upcomingCount++;
              } else {
                pastCount++;
              }
            }
          });
          
          setInterviews({
            pending: pendingCount,
            upcoming: upcomingCount,
            past: pastCount
          });
        }

        // For now, we don't have a real jobs API, so we'll set it to 0
        // In a real app, you would fetch this from a jobs API
        setActiveJobs(0);
      } catch (err) {
        setError('Failed to load data. Please refresh and try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <FaSpinner className="animate-spin" size={32} />
        </div>
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome back, {user?.name || 'Recruiter'}! 👋</h1>
            <p className="dashboard-subtitle">Here's what's happening with your recruitment activities today.</p>
          </div>
          <div className="header-actions">
            <Link to="/dashboard/recruiter/jobs/create" className="primary-action-btn">
              <FaPlus size={20} />
              <span>Create Job</span>
            </Link>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-banner">
          <FaExclamationCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Stats Overview */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card pending">
            <div className="stat-icon">
              <FaClock size={24} />
            </div>
            <div className="stat-content">
              <h3>Pending Interviews</h3>
              <p className="stat-number">{interviews.pending}</p>
              <span className="stat-label">Awaiting response</span>
            </div>
          </div>
          
          <div className="stat-card upcoming">
            <div className="stat-icon">
              <FaCalendar size={24} />
            </div>
            <div className="stat-content">
              <h3>Upcoming Interviews</h3>
              <p className="stat-number">{interviews.upcoming}</p>
              <span className="stat-label">Scheduled</span>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon">
              <FaCheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>Completed Interviews</h3>
              <p className="stat-number">{interviews.past}</p>
              <span className="stat-label">This month</span>
            </div>
          </div>
          
          <div className="stat-card jobs">
            <div className="stat-icon">
              <FaBriefcase size={24} />
            </div>
            <div className="stat-content">
              <h3>Active Jobs</h3>
              <p className="stat-number">{activeJobs}</p>
              <span className="stat-label">Currently hiring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Streamline your recruitment workflow with these powerful tools</p>
        </div>
        
        <div className="actions-grid">
          <Link to="/dashboard/recruiter/jobs" className="action-card primary">
            <div className="action-card-content">
              <div className="action-icon">
                <FaBriefcase size={28} />
              </div>
              <div className="action-content">
                <h3>Manage Jobs</h3>
                <p>View and edit your job postings, track applications and find the perfect candidates</p>
              </div>
            </div>
            <FaArrowRight className="action-arrow" size={20} />
          </Link>
          
          <Link to="/dashboard/recruiter/interviews" className="action-card secondary">
            <div className="action-card-content">
              <div className="action-icon">
                <FaCalendar size={28} />
              </div>
              <div className="action-content">
                <h3>Interview Hub</h3>
                <p>Schedule and manage interviews with candidates in a streamlined workflow</p>
              </div>
            </div>
            <FaArrowRight className="action-arrow" size={20} />
          </Link>
          
          <Link to="/dashboard/recruiter/candidates" className="action-card tertiary">
            <div className="action-card-content">
              <div className="action-icon">
                <FaUsers size={28} />
              </div>
              <div className="action-content">
                <h3>Candidate Pool</h3>
                <p>Browse registered candidates and discover top talent for your open positions</p>
              </div>
            </div>
            <FaArrowRight className="action-arrow" size={20} />
          </Link>
          
          <div className="action-card accent">
            <div className="action-card-content">
              <div className="action-icon">
                <FaChartLine size={28} />
              </div>
              <div className="action-content">
                <h3>Analytics</h3>
                <p>View detailed recruitment insights and optimize your hiring process</p>
              </div>
            </div>
            <FaArrowRight className="action-arrow" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboardPage;
