import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Badge, Button, Tabs, Tab, Spinner, Modal, Form, Nav } from 'react-bootstrap';
import { FaUserCircle, FaFileAlt, FaSearch, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt, FaMagic, FaBullseye, FaChartLine, FaArrowLeft, FaCalendarPlus } from 'react-icons/fa';
import { authService } from '../../services/api';
import EnhancedResumeAnalysis from '../../components/EnhancedResumeAnalysis';
import './Dashboard.css';
import './JobApplicationsPage.css';

const JobApplicationsPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [currentApplication, setCurrentApplication] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingResume, setProcessingResume] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState(null);
  const [applicationTab, setApplicationTab] = useState('new');
  const [activeResumeTab, setActiveResumeTab] = useState('enhanced');
  const [resumeSource, setResumeSource] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobAndApplications();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const jobData = await jobResponse.json();
      
      if (!jobData.success) {
        throw new Error(jobData.message || 'Failed to fetch job details');
      }
      
      setJob(jobData.data);
      
      // Fetch applications for this job
      const applicationsResponse = await fetch(`http://localhost:5000/api/applications/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const applicationsData = await applicationsResponse.json();
      
      if (!applicationsData.success) {
        throw new Error(applicationsData.message || 'Failed to fetch applications');
      }
      
      setApplications(applicationsData.data);
    } catch (err) {
      setError(err.message || 'Error loading data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseResume = async (applicationId) => {
    try {
      setProcessingResume(true);
      setError('');
      
      // Get the application to check which resume is being used
      const application = applications.find(app => app._id === applicationId);
      const hasJobSpecificResume = application && application.resumePath;
      const resumeType = hasJobSpecificResume ? 'job-specific' : 'generic';
      
      // Display a message about which resume is being used
      setMessage(`Parsing ${resumeType} resume for ${application?.candidate?.name}...`);
      
      const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/parse-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setParsedResumeData(data.data.parsedResume);
        
        // Update message to indicate which resume was used
        setMessage(`Successfully parsed ${resumeType} resume for ${application?.candidate?.name}.`);
        
        // Update the application in the local state
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app._id === applicationId ? data.data.application : app
          )
        );
        
        // Check if the application stage has changed to resume_screened
        if (data.data.application.stage === 'resume_screened') {
          // Automatically switch to the Screened tab
          setApplicationTab('screened');
        }
        
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to parse resume');
      }
    } catch (err) {
      console.error('Error parsing resume:', err);
      throw err;
    } finally {
      setProcessingResume(false);
    }
  };

  const acceptForInterview = async (applicationId) => {
    try {
      setProcessingAction(true);
      
      const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/accept-for-interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the application in the local state
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app._id === applicationId ? data.data : app
          )
        );
        
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to accept candidate for interview');
      }
    } catch (err) {
      console.error('Error accepting for interview:', err);
      throw err;
    } finally {
      setProcessingAction(false);
    }
  };

  const rejectApplication = async (applicationId, reason) => {
    try {
      setProcessingAction(true);
      
      const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the application in the local state
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app._id === applicationId ? data.data : app
          )
        );
        
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to reject application');
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      throw err;
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewResume = (application) => {
    setCurrentApplication(application);
    setShowResumeModal(true);
    setActiveResumeTab('enhanced');
    
    // Set resume source information for display
    const resumeSource = application.resumePath ? 'job-specific' : 'generic';
    setResumeSource(resumeSource);
  };

  const handleParseResume = async () => {
    try {
      const result = await parseResume(currentApplication._id);
      
      // Update the currentApplication with the parsed data
      if (result && result.application) {
        setCurrentApplication(result.application);
      }
    } catch (err) {
      setError(err.message || 'Failed to parse resume. Please try again.');
    }
  };

  const handleAcceptForInterview = async (applicationId) => {
    try {
      await acceptForInterview(applicationId);
      setShowResumeModal(false);
    } catch (err) {
      setError(err.message || 'Failed to accept for interview. Please try again.');
    }
  };

  const handleRejectClick = (application) => {
    setCurrentApplication(application);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    try {
      await rejectApplication(currentApplication._id, rejectReason);
      setShowRejectModal(false);
    } catch (err) {
      setError(err.message || 'Failed to reject application. Please try again.');
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
    switch (status) {
      case 'new_application':
        return <Badge bg="info">New Application</Badge>;
      case 'resume_screened':
        return <Badge bg="primary">Resume Screened</Badge>;
      case 'job_matched':
        return <Badge bg="success">Job Matched</Badge>;
      case 'interview_requested':
        return <Badge bg="warning">Interview Requested</Badge>;
      case 'interview_scheduled':
        return <Badge bg="warning">Interview Scheduled</Badge>;
      case 'interview_completed':
        return <Badge bg="secondary">Interview Completed</Badge>;
      case 'offer_extended':
        return <Badge bg="success">Offer Extended</Badge>;
      case 'offer_accepted':
        return <Badge bg="success">Offer Accepted</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'withdrawn':
        return <Badge bg="dark">Withdrawn</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Filter applications based on active tab
  const filteredApplications = applications.filter(application => {
    switch (applicationTab) {
      case 'new':
        return ['new_application'].includes(application.stage);
      case 'screened':
        return ['resume_screened', 'job_matched'].includes(application.stage);
      case 'interview':
        return ['interview_requested', 'interview_scheduled', 'interview_completed'].includes(application.stage);
      case 'rejected':
        return ['rejected', 'withdrawn'].includes(application.stage);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading applications...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="alert alert-danger" role="alert">
        Job not found or has been removed.
      </div>
    );
  }

  return (
    <div className="jap-container">
      <header className="jap-header">
        <div className="jap-header-content">
          <div className="jap-header-left">
            <h1 className="jap-header-title">Applications for: {job.title}</h1>
            <div className="jap-header-stats">
              <div className="jap-stat-badge">
                <span className="jap-stat-number">{applications.length}</span>
                <span className="jap-stat-label">Total Applicants</span>
              </div>
              <div className="jap-stat-badge">
                <span className="jap-stat-number">{applications.filter(a => a.stage === 'resume_screened').length}</span>
                <span className="jap-stat-label">Screened</span>
              </div>
              <div className="jap-stat-badge">
                <span className="jap-stat-number">{applications.filter(a => ['interview_requested', 'interview_scheduled', 'interview_completed'].includes(a.stage)).length}</span>
                <span className="jap-stat-label">In Interview</span>
              </div>
            </div>
          </div>
          <div className="jap-header-right">
            <Link to="/dashboard/recruiter/jobs" className="jap-back-button btn btn-outline-light">
              <FaArrowLeft className="me-2" /> Back to All Jobs
            </Link>
          </div>
        </div>
        {message && (
          <div className="jap-message-alert">
            <FaFileAlt className="me-2" />
            {message}
          </div>
        )}
      </header>

      {error && (
        <div className="jap-error-alert alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <Card className="jap-job-summary-card mb-4">
        <Card.Body>
          <div className="jap-job-summary-content">
            <div className="jap-job-summary-main">
              <h5 className="jap-job-title mb-1">{job.title}</h5>
              <p className="jap-job-meta mb-1">
                {job.company} • {job.location || 'Remote'}
              </p>
              <div className="jap-job-tags mb-2">
                <Badge bg="info" className="me-1">{job.type}</Badge>
                <Badge bg="secondary">{job.experienceLevel}</Badge>
              </div>
            </div>
            <div className="jap-job-summary-stats text-end">
              <h5 className="jap-applications-count">{applications.length} Applications</h5>
              <p className="jap-posted-date text-muted">Posted: {formatDate(job.createdAt)}</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="jap-content-area">
        <Tabs
          activeKey={applicationTab}
          onSelect={(k) => setApplicationTab(k)}
          className="jap-tabs-nav mb-4"
          id="job-application-tabs"
        >
          <Tab eventKey="new" title={<>New <Badge pill bg="light" text="dark">{applications.filter(a => a.stage === 'new_application').length}</Badge></>} />
          <Tab eventKey="screened" title={<>Screened <Badge pill bg="light" text="dark">{applications.filter(a => ['resume_screened', 'job_matched'].includes(a.stage)).length}</Badge></>} />
          <Tab eventKey="interview" title={<>Interview <Badge pill bg="light" text="dark">{applications.filter(a => ['interview_requested', 'interview_scheduled', 'interview_completed'].includes(a.stage)).length}</Badge></>} />
          <Tab eventKey="rejected" title={<>Rejected <Badge pill bg="light" text="dark">{applications.filter(a => ['rejected', 'withdrawn'].includes(a.stage)).length}</Badge></>} />
        </Tabs>

        {filteredApplications.length === 0 ? (
          <div className="jap-empty-state text-center py-5">
            <FaSearch size={48} className="text-muted mb-3" />
            <h4>No Applications</h4>
            <p className="text-muted">There are no applications in this category yet.</p>
          </div>
        ) : (
          <div className="jap-applications-grid row">
            {filteredApplications.map(application => (
              <div className="col-md-6 col-lg-4 mb-4" key={application._id}>
                <Card className="jap-application-card h-100">
                  <Card.Header className="jap-card-header">
                    <div className="jap-candidate-id">
                      <FaUserCircle className="me-2 jap-candidate-avatar" size={32} />
                      <div>
                        <h6 className="jap-candidate-name mb-0">{application.candidate.name}</h6>
                        <small className="jap-candidate-email text-muted">{application.candidate.email}</small>
                      </div>
                    </div>
                    <div className="jap-status-badge-wrapper">
                      {getStatusBadge(application.stage)}
                    </div>
                  </Card.Header>
                  <Card.Body className="jap-card-body">
                    <div className="jap-application-meta mb-2">
                      <FaCalendarAlt />
                      <small>Applied: {formatDate(application.createdAt)}</small>
                    </div>

                    {application.candidateRoleFit > 0 && (
                      <div className="jap-match-score mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="jap-score-label">Candidate-Role Fit:</span>
                          <strong className="jap-score-value">{application.candidateRoleFit}%</strong>
                        </div>
                        <div className="progress jap-progress-bar" style={{ height: '10px' }}>
                          <div
                            className={`progress-bar ${application.candidateRoleFit >= 80 ? 'bg-success' : application.candidateRoleFit >= 60 ? 'bg-primary' : application.candidateRoleFit >= 40 ? 'bg-warning' : 'bg-danger'}`}
                            role="progressbar"
                            style={{ width: `${application.candidateRoleFit}%` }}
                            aria-valuenow={application.candidateRoleFit}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        {application.candidateRoleFit >= 80 && (
                          <small className="text-success d-block mt-1">Excellent Match</small>
                        )}
                        {application.candidateRoleFit >= 60 && application.candidateRoleFit < 80 && (
                          <small className="text-primary d-block mt-1">Good Match</small>
                        )}
                        {application.candidateRoleFit >= 40 && application.candidateRoleFit < 60 && (
                          <small className="text-warning d-block mt-1">Fair Match</small>
                        )}
                        {application.candidateRoleFit < 40 && (
                          <small className="text-danger d-block mt-1">Poor Match</small>
                        )}
                      </div>
                    )}
                    
                    {/* We've removed the additional statistics section and are only showing the Candidate-Role Fit score above */}

                    {(application.stage === 'resume_screened' || application.stage === 'job_matched') && (
                      <>
                        {application.matchedSkills && application.matchedSkills.length > 0 && (
                          <div className="jap-skills-section jap-matched-skills mb-2">
                            <small className="d-block mb-1 jap-skills-label">Matched Skills:</small>
                            <div className="jap-skills-tags">
                              {application.matchedSkills.slice(0, 3).map((skill, index) => (
                                <Badge bg="success" className="me-1 mb-1" key={`matched-${index}`}>{skill}</Badge>
                              ))}
                              {application.matchedSkills.length > 3 && (
                                <Badge bg="light" text="dark" className="me-1 mb-1">+{application.matchedSkills.length - 3} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {application.missingSkills && application.missingSkills.length > 0 && (
                          <div className="jap-skills-section jap-missing-skills mb-3">
                            <small className="d-block mb-1 jap-skills-label">Missing Skills:</small>
                            <div className="jap-skills-tags">
                              {application.missingSkills.slice(0, 3).map((skill, index) => (
                                <Badge bg="danger" className="me-1 mb-1" key={`missing-${index}`}>{skill}</Badge>
                              ))}
                              {application.missingSkills.length > 3 && (
                                <Badge bg="light" text="dark" className="me-1 mb-1">+{application.missingSkills.length - 3} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                  <Card.Footer className="jap-card-footer">
                    <div className="jap-application-actions">
                      {['new_application', 'resume_screened', 'job_matched'].includes(application.stage) && (
                        <div className="d-grid gap-2">
                          <Button
                            variant="outline-primary" size="sm"
                            onClick={() => handleViewResume(application)}
                          >
                            <FaFileAlt className="me-1" /> View & Parse Resume
                          </Button>

                          {(application.stage === 'resume_screened' || application.stage === 'job_matched') && (
                            <>
                              <Button
                                variant="success" size="sm"
                                onClick={() => handleAcceptForInterview(application._id)}
                                disabled={processingAction && currentApplication?._id === application._id}
                              >
                                <FaCheckCircle className="me-1" /> {processingAction && currentApplication?._id === application._id && currentApplication?.stage !== 'rejected' ? 'Processing...' : 'Accept for Interview'}
                              </Button>
                              <Button
                                variant="outline-danger" size="sm"
                                onClick={() => handleRejectClick(application)}
                                disabled={processingAction && currentApplication?._id === application._id}
                              >
                                <FaTimesCircle className="me-1" /> {processingAction && currentApplication?._id === application._id && currentApplication?.stage === 'rejected' ? 'Processing...' : 'Reject'}
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {application.stage === 'interview_requested' && (
                        <div className="d-grid">
                          <Link
                            to={`/dashboard/recruiter/schedule-interview/${application.candidate._id}?jobId=${job._id}&applicationId=${application._id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <FaCalendarPlus className="me-1" /> Schedule Interview
                          </Link>
                        </div>
                      )}

                      {application.stage === 'interview_scheduled' && (
                        <div className="jap-stage-info alert alert-info mb-0 py-2">
                          <small><FaCalendarPlus className="me-1" /> Interview scheduled.</small>
                        </div>
                      )}
                      
                      {application.stage === 'rejected' && (
                        <div className="jap-stage-info alert alert-secondary mb-0 py-2">
                          <small>Reason: {application.notes || 'N/A'}</small>
                        </div>
                      )}
                    </div>
                  </Card.Footer>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Parsing Modal */}
      <Modal
        show={showResumeModal}
        onHide={() => { setShowResumeModal(false); setParsedResumeData(null); }}
        dialogClassName="jap-modal-large"
        size="xl"
        centered
      >
        <Modal.Header closeButton className="jap-modal-header">
          <Modal.Title className="jap-modal-title">
            {currentApplication?.candidate?.name}'s Resume Analysis
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="jap-modal-body p-0">
          {/* Conditional rendering for before and after parsing */} 
          {(!parsedResumeData && !currentApplication?.parsedResume) && (
            <div className="text-center py-5">
              <div className="parse-resume-prompt">
                <div className="parse-icon-container">
                  <FaFileAlt className="parse-icon" />
                  <div className="parse-icon-glow"></div>
                </div>
                <h4>Enhance This Resume with AI</h4>
                <p>Our AI will evaluate the candidate's fit for this job position, analyze skills, and provide detailed insights to help you make better hiring decisions.</p>
                <div className="parse-benefits">
                  <div className="parse-benefit-item">
                    <FaBullseye className="benefit-icon" />
                    <span>Candidate-Role Fit Score</span>
                  </div>
                  <div className="parse-benefit-item">
                    <FaCheckCircle className="benefit-icon" />
                    <span>Skills Assessment</span>
                  </div>
                  <div className="parse-benefit-item">
                    <FaChartLine className="benefit-icon" />
                    <span>Experience Analysis</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleParseResume}
                  disabled={processingResume}
                  className="jap-modal-button px-4 py-2 mt-4"
                  size="lg"
                >
                  {processingResume ? (
                    <>
                      <div className="parsing-animation">
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        <span className="parsing-text">Analyzing Resume</span>
                        <span className="parsing-dots"></span>
                      </div>
                    </>
                  ) : <><FaMagic className="me-2" /> Analyze with AI</>}
                </Button>
              </div>
            </div>
          )}

          {(parsedResumeData || currentApplication?.parsedResume) && (
            <div className="parsed-resume-container">
              {/* Removed tabs since we only need Enhanced Analysis */}
              
              <div className="resume-analysis-content p-4">
                <EnhancedResumeAnalysis 
                  enhancedAnalysis={(parsedResumeData?.enhancedAnalysis || currentApplication?.parsedResume?.enhancedAnalysis)}
                  resumeSource={currentApplication?.resumePath ? 'job-specific' : 'generic'}
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="jap-modal-footer">
          <div className="d-flex justify-content-between w-100">
            <button onClick={() => { setShowResumeModal(false); setParsedResumeData(null); }} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f0f0f0', 
                border: '1px solid #ccc', 
                borderRadius: '4px', 
                color: '#333', 
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
              Close
            </button>
            {(parsedResumeData || currentApplication?.parsedResume) && (currentApplication?.stage === 'resume_screened' || currentApplication?.stage === 'job_matched') && (
              <div className="d-flex gap-2">
                <button onClick={() => handleAcceptForInterview(currentApplication._id)} 
                  disabled={processingAction && currentApplication?.stage !== 'rejected'} 
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#4CAF50', 
                    border: '1px solid #4CAF50', 
                    borderRadius: '4px', 
                    color: 'white', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                  <FaCheckCircle />
                  {processingAction && currentApplication?.stage !== 'rejected' ? 'Processing...' : 'Accept for Interview'}
                </button>
                <button onClick={() => { setShowResumeModal(false); setParsedResumeData(null); handleRejectClick(currentApplication); }} 
                  disabled={processingAction && currentApplication?.stage === 'rejected'} 
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#F44336', 
                    border: '1px solid #F44336', 
                    borderRadius: '4px', 
                    color: 'white', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                  <FaTimesCircle />
                  {processingAction && currentApplication?.stage === 'rejected' ? 'Processing...' : 'Reject Application'}
                </button>
              </div>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* Reject Application Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} dialogClassName="jap-modal" centered>
        <Modal.Header closeButton className="jap-modal-header">
          <Modal.Title className="jap-modal-title">Reject Application for {currentApplication?.candidate?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="jap-modal-body">
          <Form.Group className="mb-3">
            <Form.Label>Reason for Rejection (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="jap-modal-footer">
          <Button variant="secondary" onClick={() => setShowRejectModal(false)} className="jap-modal-button">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectSubmit} disabled={processingAction} className="jap-modal-button">
            {processingAction ? 'Processing...' : 'Confirm Rejection'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default JobApplicationsPage;
