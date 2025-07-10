import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Form, InputGroup, Badge, Container, Spinner } from 'react-bootstrap';
import { FaSearch, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaFilter, FaArrowLeft } from 'react-icons/fa';
import { authService, jobService, applicationService } from '../../services/api';
import './Dashboard.css';
import './JobListingsPage.css';

// CSS is now imported from JobListingsPage.css

const JobListingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    experienceLevel: ''
  });
  const [appliedJobs, setAppliedJobs] = useState({});

  useEffect(() => {
    fetchJobs();
    checkAppliedJobs();
  }, []);
  
  // Check which jobs the candidate has already applied for
  const checkAppliedJobs = async () => {
    try {
      const candidateData = await fetch('http://localhost:5000/api/auth/candidate/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
      
      if (candidateData.success) {
        const applicationsResponse = await fetch(`http://localhost:5000/api/applications/candidate/${candidateData.data._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json());
        
        if (applicationsResponse.success) {
          const appliedJobsMap = {};
          applicationsResponse.data.forEach(application => {
            appliedJobsMap[application.job._id] = true;
          });
          setAppliedJobs(appliedJobsMap);
        }
      }
    } catch (err) {
      console.error('Error checking applied jobs:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const queryParams = {};
      if (searchTerm) queryParams.search = searchTerm;
      if (filters.type) queryParams.type = filters.type;
      if (filters.experienceLevel) queryParams.experienceLevel = filters.experienceLevel;
      
      // Use the jobService instead of direct fetch
      const response = await jobService.getJobs(queryParams);
      
      if (response.success) {
        console.log('Jobs fetched successfully:', response.data);
        setJobs(response.data);
      } else {
        setError(response.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.message || 'Error fetching jobs. Please try again.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
      <Container className="loading-container">
        <Spinner animation="border" role="status" className="loading-spinner">
          <span className="visually-hidden">Loading available jobs...</span>
        </Spinner>
        <p className="loading-text">Loading available jobs...</p>
      </Container>
    );
  }

  return (
    <div className="job-listings-container">
      <div className="job-listings-header">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaBriefcase className="icon" />
              <div>
                <h1>Explore Job Opportunities</h1>
                <p style={{
                  color: '#ffd6d6',
                  fontSize: '1.1rem',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}>Find your next career move from our curated job listings</p>
              </div>
            </div>
            <Link 
              to="/dashboard/candidate" 
              className="back-button"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 204, 204, 0.25), rgba(255, 120, 2, 0.3))',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'rgb(255, 235, 235)',
                borderRadius: '50px',
                padding: '0.7rem 1.4rem',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.9rem',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 120, 2, 0.4), rgba(255, 204, 204, 0.35))';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 204, 204, 0.25), rgba(255, 120, 2, 0.3))';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.color = 'rgb(255, 235, 235)';
              }}
            >
              <FaArrowLeft /> Back to Dashboard
            </Link>
          </div>
        </Container>
      </div>
      
      <Container>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <div className="search-section">
          <Form onSubmit={handleSearch}>
            <Row className="align-items-end">
              <Col md={4}>
                <Form.Label className="search-label">Search Keywords</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="search-input-group-text"><FaSearch /></InputGroup.Text>
                  <Form.Control
                    className="search-input"
                    placeholder="Job title, skills, or company name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Label className="search-label">Job Type</Form.Label>
                <Form.Select 
                  className="search-select"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Job Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="search-label">Experience Level</Form.Label>
                <Form.Select 
                  className="search-select"
                  name="experienceLevel"
                  value={filters.experienceLevel}
                  onChange={handleFilterChange}
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button 
                  type="submit" 
                  className="find-button w-100"
                >
                  Find
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
        
        <div className="mb-4">
          <div className="jobs-header">
            <div className="d-flex align-items-center">
              <FaBriefcase className="icon" />
              <h5>Available Positions</h5>
            </div>
            <div className="jobs-count">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
            </div>
          </div>
          
          {jobs.length === 0 ? (
            <Card className="no-jobs-card">
              <Card.Body>
                <FaSearch className="no-jobs-icon" />
                <h3 className="no-jobs-title">No jobs found</h3>
                <p className="no-jobs-text">Try adjusting your search criteria or check back later for new opportunities</p>
                <Button 
                  className="clear-filters-button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ type: '', experienceLevel: '' });
                    fetchJobs();
                  }}
                >
                  Clear all filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <div>
              {jobs.map(job => (
                <Card key={job._id} className="job-card">
                  <Card.Body className="job-card-body">
                    <Row>
                      <Col md={3} className="mb-3 mb-md-0">
                        <div className="d-flex align-items-center">
                          <div className="company-logo">
                            <FaBuilding size={20} />
                          </div>
                          <div>
                            <h6 className="company-name">{job.company}</h6>
                            {job.location && (
                              <div className="company-location">
                                <FaMapMarkerAlt className="icon" size={12} />
                                {job.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <h5 className="job-title">{job.title}</h5>
                        <div className="mb-2">
                          <span className="job-badge">{job.type}</span>
                          <span className="job-badge-secondary">{job.experienceLevel}</span>
                          {job.experienceYears && typeof job.experienceYears === 'string' && (
                            <span className="job-badge-secondary">{job.experienceYears}</span>
                          )}
                        </div>
                        <p className="job-description mb-0">
                          {job.description.length > 120 
                            ? `${job.description.substring(0, 120)}...` 
                            : job.description}
                        </p>
                      </Col>
                      <Col md={3} className="d-flex align-items-center justify-content-md-end mt-3 mt-md-0">
                        <Link 
                          to={appliedJobs[job._id] ? `/dashboard/candidate/applications` : `/dashboard/candidate/jobs/${job._id}/apply`} 
                          className={appliedJobs[job._id] ? "applied-button" : "apply-button"}
                          style={appliedJobs[job._id] ? {
                            background: 'linear-gradient(135deg, #5a3d98, #291651)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50px',
                            padding: '0.7rem 1.7rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(41, 22, 81, 0.3)',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            zIndex: '1',
                            textDecoration: 'none',
                            display: 'inline-block'
                          } : {
                            background: 'linear-gradient(135deg, #7cbced, #4cc9f0)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50px',
                            padding: '0.7rem 1.7rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(76, 201, 240, 0.3)',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-block'
                          }}
                          onMouseOver={(e) => {
                            if (appliedJobs[job._id]) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #291651, #5a3d98)';
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(41, 22, 81, 0.4)';
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #4cc9f0, #7cbced)';
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 201, 240, 0.4)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (appliedJobs[job._id]) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #5a3d98, #291651)';
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(41, 22, 81, 0.3)';
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #7cbced, #4cc9f0)';
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 201, 240, 0.3)';
                            }
                          }}
                        >
                          {appliedJobs[job._id] ? 'See Details' : 'Apply Now'}
                        </Link>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default JobListingsPage;
