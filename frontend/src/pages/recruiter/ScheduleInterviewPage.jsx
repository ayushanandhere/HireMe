import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { authService, candidatesService, interviewService, applicationService } from '../../services/api';
import { FaCalendarCheck, FaArrowLeft, FaClock, FaUserTie, FaBriefcase, FaMapMarkerAlt, FaEnvelope, FaCode, FaCheckCircle } from 'react-icons/fa';
import './ScheduleInterview.css';

const ScheduleInterviewPage = () => {
  const { candidateId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const jobId = queryParams.get('jobId');
  const applicationId = queryParams.get('applicationId');
  
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  
  // Simplified interview form state
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    round: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user data
        const userData = authService.getUser();
        setUser(userData);
        
        // Validate required parameters
        if (!candidateId || !jobId || !applicationId) {
          setError('Missing required information. Please go back and try again.');
          setLoading(false);
          return;
        }
        
        // Fetch candidate details
        const candidateResponse = await candidatesService.getCandidateById(candidateId);
        if (candidateResponse.success) {
          setCandidate(candidateResponse.data);
        } else {
          throw new Error('Failed to load candidate information');
        }
        
        // Fetch job details
        const jobResponse = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const jobData = await jobResponse.json();
        if (jobData.success) {
          setJob(jobData.data);
        } else {
          throw new Error('Failed to load job information');
        }
      } catch (err) {
        setError(err.message || 'Failed to load data. Please refresh and try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [candidateId, jobId, applicationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccessMessage('');
    setFormSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.date || !formData.time || !formData.round) {
        setError('Please fill in all required fields');
        setFormSubmitting(false);
        return;
      }
      
      // Format the date and time for the API
      const scheduledDateTime = `${formData.date}T${formData.time}`;
      
      // Prepare data for API
      const interviewData = {
        candidateId: candidateId,
        position: {
          title: job?.title || 'Interview',
          description: job?.description || ''
        },
        scheduledDateTime: new Date(scheduledDateTime).toISOString(),
        duration: 60,
        notes: '',
        applicationId: applicationId
      };
      
      // Submit to API
      const response = await interviewService.createInterview(interviewData);
      
      if (response.success) {
        // Update application status
        await applicationService.updateApplicationStage(applicationId, { 
          stage: 'interview_scheduled',
          notes: `Interview scheduled for ${new Date(scheduledDateTime).toLocaleString()}`
        });
        
        setSuccessMessage('Interview scheduled successfully!');
        
        // Redirect after delay
        setTimeout(() => {
          navigate(`/dashboard/recruiter/jobs/${jobId}/applications`);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule interview. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="schedule-interview-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">Loading candidate information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-interview-container">
      <div className="schedule-interview-header">
        <h1 className="schedule-interview-title">
          <FaCalendarCheck className="icon" /> Schedule Interview
        </h1>
        <Link to={`/dashboard/recruiter/jobs/${jobId}/applications`} className="back-link">
          <FaArrowLeft className="icon" /> Back to Applications
        </Link>
      </div>
      
      {error ? (
        <div className="error-message">
          {error}
        </div>
      ) : (
        <div className="schedule-interview-card">
          <div className="candidate-info-section">
            <h4 className="candidate-info-title">Candidate & Position Details</h4>
            <div className="candidate-info-card">
              <div className="candidate-info-grid">
                <div>
                  <div className="info-group">
                    <div className="info-label"><FaUserTie /> Candidate</div>
                    <div className="info-value">{candidate?.name}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label"><FaEnvelope /> Email</div>
                    <div className="info-value">{candidate?.email}</div>
                  </div>
                  {candidate?.skills && (
                    <div className="info-group">
                      <div className="info-label"><FaCode /> Skills</div>
                      <div className="info-value">{candidate?.skills}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="info-group">
                    <div className="info-label"><FaBriefcase /> Position</div>
                    <div className="info-value">{job?.title}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label"><FaBriefcase /> Company</div>
                    <div className="info-value">{job?.company}</div>
                  </div>
                  {job?.location && (
                    <div className="info-group">
                      <div className="info-label"><FaMapMarkerAlt /> Location</div>
                      <div className="info-value">{job?.location}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {successMessage && (
            <div className="success-message">
              <FaCheckCircle style={{ marginRight: '8px' }} />
              {successMessage}
            </div>
          )}
          
          <div className="interview-form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="date">
                    <FaCalendarCheck style={{ marginRight: '8px' }} />
                    Interview Date*
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    disabled={formSubmitting}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="time">
                    <FaClock style={{ marginRight: '8px' }} />
                    Interview Time*
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    className="form-control"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={formSubmitting}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="round">
                  <FaUserTie style={{ marginRight: '8px' }} />
                  Interview Round*
                </label>
                <select
                  id="round"
                  name="round"
                  className="form-control"
                  value={formData.round}
                  onChange={handleChange}
                  disabled={formSubmitting}
                  required
                >
                  <option value="">Select interview round</option>
                  <option value="HR">HR</option>
                  <option value="Technical">Technical</option>
                  <option value="Managerial">Managerial</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={formSubmitting}
                >
                  <FaCalendarCheck className="icon" />
                  {formSubmitting ? 'Scheduling...' : 'Schedule Interview'}
                </button>
                
                <Link to={`/dashboard/recruiter/jobs/${jobId}/applications`} className="cancel-button">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleInterviewPage; 