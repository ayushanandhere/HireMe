import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner, Container, Row, Col, Badge } from 'react-bootstrap';
import { FaBuilding, FaMapMarkerAlt, FaBriefcase, FaFileUpload, FaArrowLeft, FaCalendarAlt, FaGraduationCap, FaCode } from 'react-icons/fa';
import { authService } from '../../services/api';

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Fetch job details and candidate profile

  // Fetch job details and candidate profile
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch candidate profile
        const candidateResponse = await fetch('http://localhost:5000/api/auth/candidate/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const candidateData = await candidateResponse.json();
        
        if (!candidateData.success) {
          throw new Error(candidateData.message || 'Failed to fetch candidate profile');
        }
        
        setCandidate(candidateData.data);
        
        // Check if candidate has already applied for this job
        const applicationsResponse = await fetch(`http://localhost:5000/api/applications/candidate/${candidateData.data._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const applicationsData = await applicationsResponse.json();
        
        if (applicationsData.success) {
          const hasApplied = applicationsData.data.some(application => 
            application.job._id === jobId
          );
          setAlreadyApplied(hasApplied);
          
          if (hasApplied) {
            setSuccess('You have already applied for this job.');
          }
        }
      } catch (err) {
        setError(err.message || 'Error loading data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [jobId]);

  const handleResumeChange = (e) => {
    if (e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
      setUseExistingResume(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // Check if candidate has a resume
      if (useExistingResume && !candidate.hasResume) {
        setError('You need to upload a resume to apply for this job');
        setSubmitting(false);
        return;
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('candidateId', candidate._id);
      formData.append('jobId', jobId);
      formData.append('notes', notes);
      
      // If using a new resume, append it
      if (!useExistingResume && resumeFile) {
        formData.append('resume', resumeFile);
      }
      
      // Submit application
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Your application has been submitted successfully!');
        // Redirect to applications page after a delay
        setTimeout(() => {
          navigate('/dashboard/candidate/applications');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to submit application');
      }
    } catch (err) {
      setError(err.message || 'Error submitting application. Please try again.');
      console.error('Error submitting application:', err);
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading job details...</p>
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
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4169e1 0%, #3f51b5 100%)',
        color: 'white',
        padding: '2.5rem 0',
        marginBottom: '2.5rem',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background design elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '10%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          zIndex: 0
        }}></div>
        
        <Container style={{ position: 'relative', zIndex: 1 }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
                <FaBriefcase size={32} />
              </div>
              <div>
                <h1 style={{ 
                  fontWeight: '800', 
                  margin: 0, 
                  color: 'white',
                  fontSize: '2.5rem',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  marginBottom: '0.5rem'
                }}>Apply for Job</h1>
                <p style={{ 
                  margin: 0, 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  fontWeight: '400',
                  letterSpacing: '0.3px',
                  maxWidth: '600px'
                }}>Submit your application for <span style={{ fontWeight: '600' }}>{job.title}</span></p>
              </div>
            </div>
            <Link 
              to="/dashboard/candidate/jobs" 
              style={{
                backgroundColor: 'white',
                color: '#4169e1',
                padding: '0.7rem 1.2rem',
                borderRadius: '50px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                border: '2px solid transparent'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#4169e1';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <FaArrowLeft className="me-2" /> Back to Job Listings
            </Link>
          </div>
        </Container>
      </div>
      
      <Container className="pb-5">
        {error && (
          <Alert variant="danger" className="mb-4">{error}</Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-4">{success}</Alert>
        )}
        
        <Row>
          <Col lg={8}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              marginBottom: '1.5rem',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '2rem' }}>
                {/* Company Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4169e1',
                    color: 'white',
                    marginRight: '1.25rem',
                    boxShadow: '0 4px 8px rgba(65, 105, 225, 0.3)'
                  }}>
                    <FaBuilding size={24} />
                  </div>
                  <div>
                    <h6 style={{ 
                      margin: 0, 
                      fontWeight: 'bold', 
                      fontSize: '1.25rem',
                      color: '#212529' // Darker company name
                    }}>{job.company}</h6>
                    {job.location && (
                      <div style={{ color: '#495057', marginTop: '0.25rem' }}> {/* Darker location text */}
                        <FaMapMarkerAlt style={{ marginRight: '0.25rem' }} size={14} />
                        {job.location}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Job Title */}
                <h2 style={{
                  color: '#4169e1',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  fontSize: '1.75rem'
                }}>{job.title}</h2>
                
                {/* Job Badges */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{
                    backgroundColor: '#4cc9f0',
                    color: 'white',
                    fontWeight: 'normal',
                    marginRight: '0.75rem',
                    borderRadius: '50px',
                    fontSize: '0.85rem',
                    padding: '0.35rem 0.85rem',
                    display: 'inline-block'
                  }}>{job.type}</span>
                  <span style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    fontWeight: 'normal',
                    marginRight: '0.75rem',
                    borderRadius: '50px',
                    fontSize: '0.85rem',
                    padding: '0.35rem 0.85rem',
                    display: 'inline-block'
                  }}>{job.experienceLevel}</span>
                  <div style={{ marginTop: '0.75rem', color: '#495057', display: 'flex', alignItems: 'center' }}> {/* Darker posted date text */}
                    <FaCalendarAlt style={{ marginRight: '0.5rem' }} size={14} />
                    <span>Posted: {formatDate(job.createdAt)}</span>
                  </div>
                </div>
                
                {/* Job Description */}
                <h4 style={{
                  color: '#4169e1',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  marginTop: '1.75rem',
                  marginBottom: '1rem',
                  borderBottom: '2px solid #f0f7ff',
                  paddingBottom: '0.75rem'
                }}>Job Description</h4>
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderLeft: '4px solid #4169e1',
                  borderRadius: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#000000', 
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    letterSpacing: '0.01rem',
                    lineHeight: '1.8'
                  }}>{job.description}</p>
                </div>
                
                {/* Required Skills */}
                <h4 style={{
                  color: '#4169e1',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  marginTop: '1.75rem',
                  marginBottom: '1rem',
                  borderBottom: '2px solid #f0f7ff',
                  paddingBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FaCode style={{ marginRight: '0.5rem' }} />
                  Required Skills
                </h4>
                <div style={{ marginBottom: '1.5rem' }}>
                  {job.skills.map((skill, index) => (
                    <span key={index} style={{
                      backgroundColor: '#f0f7ff',
                      color: '#4169e1',
                      border: '1px solid #e6f0ff',
                      borderRadius: '50px',
                      padding: '0.35rem 0.85rem',
                      marginRight: '0.75rem',
                      marginBottom: '0.75rem',
                      display: 'inline-block',
                      fontWeight: '500'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
                
                {/* Education Requirements */}
                {job.educationRequirements && (
                  <>
                    <h4 style={{
                      color: '#4169e1',
                      fontWeight: 'bold',
                      fontSize: '1.25rem',
                      marginTop: '1.75rem',
                      marginBottom: '1rem',
                      borderBottom: '2px solid #f0f7ff',
                      paddingBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <FaGraduationCap style={{ marginRight: '0.5rem' }} />
                      Education Requirements
                    </h4>
                    <div style={{
                      backgroundColor: 'white',
                      padding: '15px',
                      borderLeft: '4px solid #4169e1',
                      borderRadius: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      marginBottom: '1.5rem'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        color: '#000000', 
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        letterSpacing: '0.01rem',
                        lineHeight: '1.8'
                      }}>{job.educationRequirements}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Col>
          
          {/* Application Form */}
          <Col lg={4}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              position: 'sticky',
              top: '2rem'
            }}>
              <div style={{ padding: '2rem' }}>
                <h4 style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '1.5rem',
                  color: '#212529' // Darker form title
                }}>Submit Your Application</h4>
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ 
                      fontWeight: 'bold',
                      color: '#212529', // Darker form label
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>Resume</Form.Label>
                    
                    {candidate && candidate.hasResume && (
                      <div style={{ marginBottom: '1rem' }}>
                        <Form.Check
                          type="radio"
                          id="useExistingResume"
                          label="Use my existing resume"
                          checked={useExistingResume}
                          onChange={() => setUseExistingResume(true)}
                          style={{ marginBottom: '0.5rem', color: '#212529' }} // Darker radio label
                        />
                        <Form.Check
                          type="radio"
                          id="uploadNewResume"
                          label="Upload a new resume for this job"
                          checked={!useExistingResume}
                          onChange={() => setUseExistingResume(false)}
                          style={{ color: '#212529' }} // Darker radio label
                        />
                      </div>
                    )}
                    
                    {(!candidate?.hasResume || !useExistingResume) && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <Form.Control
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeChange}
                          required={!candidate?.hasResume}
                          style={{ 
                            backgroundColor: 'white', 
                            color: '#212529',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #ced4da'
                          }}
                        />
                      </div>
                    )}
                    <Form.Text style={{ color: '#495057', fontSize: '0.875rem' }}> {/* Darker form help text */}
                      Upload your resume in PDF, DOC, or DOCX format.
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label style={{ 
                      fontWeight: 'bold',
                      color: '#212529', // Darker form label
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>Additional Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Add any additional information you'd like to share with the recruiter"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ 
                        backgroundColor: 'white', 
                        color: '#212529',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #ced4da',
                        width: '100%'
                      }}
                    />
                  </Form.Group>
                  
                  <div style={{ marginTop: '1.5rem' }}>
                    {alreadyApplied ? (
                      <Button 
                        disabled
                        style={{
                          background: '#6c757d',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.85rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)',
                          color: 'white',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaCheckCircle style={{ marginRight: '0.5rem' }} />
                        Already Applied
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={submitting}
                        style={{
                          background: 'linear-gradient(135deg, #4169e1 0%, #3f51b5 100%)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.85rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(65, 105, 225, 0.3)',
                          color: 'white',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {submitting ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              style={{ marginRight: '0.5rem' }}
                            />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FaFileUpload style={{ marginRight: '0.5rem' }} />
                            Submit Application
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default JobApplicationPage;
