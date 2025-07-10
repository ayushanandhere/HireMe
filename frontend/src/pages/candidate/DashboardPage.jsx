import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, candidateService, interviewService, candidatesService } from '../../services/api';
import { FaCalendarCheck, FaUserTie, FaBriefcase, FaChartLine, FaBookmark, FaFileAlt, FaSearch, FaClipboardList, FaUpload, FaSave } from 'react-icons/fa';
import ResumeUploader from '../../components/ResumeUploader';
import ResumeAnalysis from '../../components/ResumeAnalysis';
import './CandidateDashboard.css';

const CandidateDashboardPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState({
    pending: 0,
    upcoming: 0,
    past: 0
  });
  const [savedJobs, setSavedJobs] = useState(0);
  const [formData, setFormData] = useState({
    skills: '',
    experience: '',
    resume: null
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [resumeUploaded, setResumeUploaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
    // Get user data from auth service
    const userData = authService.getUser();
    setUser(userData);
    
    // Pre-populate form if skills and experience are available
    if (userData) {
      setFormData({
        skills: userData.skills || '',
        experience: userData.experience || '',
        resume: null
      });
        
        // Check if user has a resume already
        setResumeUploaded(userData.hasResume || false);
      }
      
      // Fetch interviews data for the dashboard overview
      try {
        const interviewsResponse = await interviewService.getCandidateInterviews();
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
        
        // For now, we just set saved jobs to 0 since that feature is not implemented yet
        // In a real implementation, you would fetch this from a saved jobs API
        setSavedJobs(0);
      } catch (error) {
        console.error('Error fetching interview data:', error);
    }
    
    setLoading(false);
    };
    
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'resume' && files && files[0]) {
      // Validate file is PDF
      const file = files[0];
      if (file.type !== 'application/pdf') {
        setFormError('Only PDF files are allowed');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setFormError('File must be less than 5MB');
        return;
      }
      
      setFormData({
        ...formData,
        resume: file
      });
      setFormError('');
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear messages
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const submitData = new FormData();
      submitData.append('skills', formData.skills);
      submitData.append('experience', formData.experience);
      
      if (formData.resume) {
        submitData.append('resume', formData.resume);
      }
      
      // Send request to update profile using the service
      const response = await candidateService.updateProfile(submitData);
      
      if (response.success) {
        setSuccessMessage(response.message || 'Profile updated successfully!');
        
        // Update user in component state
        const updatedUser = authService.getUser();
        setUser(updatedUser);
        
        // If a resume was uploaded, set resumeUploaded to true
        if (formData.resume) {
          setResumeUploaded(true);
        }
      }
    } catch (error) {
      setFormError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function to handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle resume upload success
  const handleResumeUploadSuccess = () => {
    // Refresh user data
    const updatedUser = authService.getUser();
    setUser(updatedUser);
    setResumeUploaded(true);
  };

  if (loading) {
    return (
      <div className="candidate-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-dashboard-container">
      <div className="candidate-dashboard-header">
        <h1 className="candidate-dashboard-title">Candidate Dashboard</h1>
        <p className="candidate-welcome-text">Welcome, <span className="candidate-user-name">{user?.name || 'Candidate'}</span>!</p>
      </div>
      
      <div className="candidate-actions-wrapper">
        <h2 className="candidate-actions-title">Quick Actions</h2>
        <div className="candidate-actions">
          <Link to="/dashboard/candidate/jobs" className="candidate-action-button">
            <FaSearch className="action-icon" /> Browse Jobs
          </Link>
          <Link to="/dashboard/candidate/applications" className="candidate-action-button">
            <FaClipboardList className="action-icon" /> My Applications
          </Link>
          <Link to="/dashboard/candidate/interviews" className="candidate-action-button">
            <FaCalendarCheck className="action-icon" /> Interview Inbox
          </Link>
        </div>
      </div>
      
      <div className="candidate-dashboard-content">
        <div className="candidate-dashboard-card">
          <h2 className="candidate-section-title"><FaChartLine className="candidate-section-icon" /> Dashboard Overview</h2>
          <div className="candidate-stats-grid">
            <div className="candidate-stat-card">
              <div className="candidate-stat-icon"><FaCalendarCheck /></div>
              <h3>Pending Interviews</h3>
              <p className="candidate-stat-number">{interviews.pending}</p>
            </div>
            <div className="candidate-stat-card">
              <div className="candidate-stat-icon"><FaCalendarCheck /></div>
              <h3>Upcoming Interviews</h3>
              <p className="candidate-stat-number">{interviews.upcoming}</p>
            </div>
            <div className="candidate-stat-card">
              <div className="candidate-stat-icon"><FaCalendarCheck /></div>
              <h3>Past Interviews</h3>
              <p className="candidate-stat-number">{interviews.past}</p>
            </div>
            <div className="candidate-stat-card">
              <div className="candidate-stat-icon"><FaBookmark /></div>
              <h3>Saved Jobs</h3>
              <p className="candidate-stat-number">{savedJobs}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="candidate-profile-tabs">
          <button 
            className={`candidate-tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <FaUserTie className="candidate-tab-icon" /> Profile
          </button>
          <button 
            className={`candidate-tab-button ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => handleTabChange('resume')}
          >
            <FaFileAlt className="candidate-tab-icon" /> Resume Parser
          </button>
          <button 
            className={`candidate-tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => handleTabChange('jobs')}
          >
            <FaBriefcase className="candidate-tab-icon" /> Jobs
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
        <div className="candidate-dashboard-card candidate-profile-card">
          <h2 className="candidate-section-title">My Profile</h2>
          
          <div className="candidate-profile-info">
            <p><strong>Name:</strong> <span className="profile-value">{user?.name}</span></p>
            <p><strong>Email:</strong> <span className="profile-value">{user?.email}</span></p>
          </div>
          
          {formError && (
            <div className="candidate-alert candidate-alert-danger">
              {formError}
            </div>
          )}
          
          {successMessage && (
            <div className="candidate-alert candidate-alert-success">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="candidate-profile-form">
            <div className="candidate-form-group">
              <label htmlFor="skills">Skills (comma-separated)</label>
              <input
                type="text"
                id="skills"
                name="skills"
                className="candidate-form-control"
                placeholder="React, JavaScript, Node.js"
                value={formData.skills}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="candidate-form-group">
              <label htmlFor="experience">Years of Experience</label>
              <select
                id="experience"
                name="experience"
                className="candidate-form-control"
                value={formData.experience}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Select Experience</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
            
            <div className="candidate-form-group">
              <label htmlFor="resume">Resume (PDF only)</label>
              <input
                type="file"
                id="resume"
                name="resume"
                className="candidate-form-control"
                accept=".pdf"
                onChange={handleChange}
                disabled={isSubmitting}
              />
                {user?.hasResume && (
                  <small className="candidate-form-text">
                    You already have a resume uploaded. Uploading a new one will replace it.
                  </small>
                )}
            </div>
            
            <button
              type="submit"
              className="candidate-submit-button"
              disabled={isSubmitting}
            >
              <FaSave />
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
        )}

        {/* Resume Parser Tab */}
        {activeTab === 'resume' && (
          <div className="candidate-dashboard-card candidate-profile-card">
            <h2>Resume Parser</h2>
            
            {!resumeUploaded && (
              <>
                <p>Upload your resume to automatically extract skills and experience.</p>
                <ResumeUploader onUploadSuccess={handleResumeUploadSuccess} />
              </>
            )}
            
            {resumeUploaded && user?._id && (
              <>
                <div className="candidate-resume-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#333' }}>Resume Analysis</h3>
                    <button 
                      className="candidate-resume-upload-button"
                      onClick={() => setResumeUploaded(false)}
                    >
                      <FaUpload style={{ marginRight: '8px' }} /> Upload New Resume
                    </button>
                  </div>
                  <ResumeAnalysis candidateId={user._id} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="candidate-dashboard-card candidate-profile-card">
            <h2>Job Opportunities</h2>
            <div className="candidate-job-links-container">
              <div className="candidate-job-link-card">
                <FaSearch className="candidate-job-link-icon" />
                <h3>Find Jobs</h3>
                <p>Browse through available job postings and find opportunities that match your skills.</p>
                <Link to="/dashboard/candidate/jobs" className="candidate-job-link-button">
                  Browse Jobs
                </Link>
              </div>
              
              <div className="candidate-job-link-card">
                <FaClipboardList className="candidate-job-link-icon" />
                <h3>My Applications</h3>
                <p>View and track all your job applications and their current status.</p>
                <Link to="/dashboard/candidate/applications" className="candidate-job-link-button">
                  View Applications
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboardPage; 