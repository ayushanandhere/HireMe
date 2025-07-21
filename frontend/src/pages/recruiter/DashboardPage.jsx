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

        // For demonstration, we'll set a placeholder number for active jobs.
        // In a real app, you would fetch this from a jobs API.
        setActiveJobs(5); 
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
      {/* Enhanced Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <div className="greeting-wrapper">
              <h1 className="dashboard-title">
                Welcome back, <span className="name-highlight">{user?.name || 'Recruiter'}</span>! 
                <span className="wave-emoji">👋</span>
              </h1>
              <p className="dashboard-subtitle">
                Here's your recruitment command center. Track progress, manage interviews, and discover top talent.
              </p>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/dashboard/recruiter/jobs/create" className="create-job-btn">
              <div className="btn-icon">
                <FaPlus size={16} />
              </div>
              <div className="btn-content">
                <span className="btn-text">Create New Job</span>
                <span className="btn-subtitle">Post a role & find talent</span>
              </div>
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
      
      {/* Enhanced Statistics Dashboard */}
      <div className="stats-section">
        <div className="section-header">
          <h2 className="section-title">Dashboard Overview</h2>
          <p className="section-subtitle">Real-time insights into your recruitment activities</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card pending">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">
                <FaClock size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-number">{interviews.pending}</div>
              <div className="stat-label">Pending Interviews</div>
              <div className="stat-description">Awaiting candidate response</div>
            </div>
            <div className="stat-trend">
              <div className="trend-indicator neutral"></div>
            </div>
          </div>
          
          <div className="stat-card upcoming">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">
                <FaCalendar size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-number">{interviews.upcoming}</div>
              <div className="stat-label">Upcoming Interviews</div>
              <div className="stat-description">Scheduled this week</div>
            </div>
            <div className="stat-trend">
              <div className="trend-indicator positive"></div>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">
                <FaCheckCircle size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-number">{interviews.past}</div>
              <div className="stat-label">Completed Interviews</div>
              <div className="stat-description">Successfully conducted</div>
            </div>
            <div className="stat-trend">
              <div className="trend-indicator positive"></div>
            </div>
          </div>
          
          <div className="stat-card jobs">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">
                <FaBriefcase size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-number">{activeJobs}</div>
              <div className="stat-label">Active Jobs</div>
              <div className="stat-description">Currently hiring</div>
            </div>
            <div className="stat-trend">
              <div className="trend-indicator positive"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Streamline your workflow with these powerful tools.</p>
        </div>
        
        <div className="actions-grid">
          <Link to="/dashboard/recruiter/jobs" className="action-card primary">
            <div className="action-card-content">
              <div className="action-icon">
                <FaBriefcase size={28} />
              </div>
              <div className="action-content">
                <h3>Manage Jobs</h3>
                <p>View, edit, and track all your active job postings.</p>
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
                <p>Schedule and manage all candidate interviews.</p>
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
                <p>Discover top talent for your open positions.</p>
              </div>
            </div>
            <FaArrowRight className="action-arrow" size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboardPage;