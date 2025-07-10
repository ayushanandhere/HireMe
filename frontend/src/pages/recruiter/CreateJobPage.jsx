import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { FaBriefcase, FaArrowLeft, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaGraduationCap, FaCode } from 'react-icons/fa';
import { jobService } from '../../services/api';
import { authService } from '../../services/api';
import './Dashboard.css';
import './CreateJobPage.css';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'full-time',
    skills: '',
    experienceLevel: 'entry',
    experienceYears: '',
    applicationDeadline: '',
    educationRequirements: ''
  });
  
  // Get user data for company name
  const user = authService.getUser();
  const company = user?.company || user?.name || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.title || !formData.description) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Add company name from user profile
      const jobDataToSubmit = {
        ...formData,
        company
      };

      const response = await jobService.createJob(jobDataToSubmit);
      
      if (response.success) {
        setSuccess('Job created successfully!');
        setTimeout(() => {
          navigate('/dashboard/recruiter/jobs');
        }, 2000);
      } else {
        setError(response.message || 'Failed to create job');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="cjp-container dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <FaBriefcase className="me-2" /> Create New Job
        </h1>
        <Button 
          variant="outline-primary" 
          onClick={() => navigate('/dashboard/recruiter')}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to Dashboard
        </Button>
      </div>
      
      <div className="mb-4">
        <Card className="cjp-company-card text-center bg-light p-3">
          <Card.Body>
            <FaBuilding className="mb-3" style={{ fontSize: '2rem', color: '#4a6cf7' }} />
            <h4>Creating job for: {company}</h4>
            <p className="text-muted">All jobs you create will be associated with this company</p>
          </Card.Body>
        </Card>
      </div>

      <Card className="cjp-form-card dashboard-card">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>
                <FaBriefcase className="me-2 text-primary" />
                <strong>Job Title *</strong>
              </Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Software Engineer"
                required
                className="form-control-lg"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>
                <FaCode className="me-2 text-primary" />
                <strong>Job Description *</strong>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the job role, responsibilities, and requirements"
                required
                className="form-control-lg"
              />
              <Form.Text className="text-muted">
                Include key responsibilities, technical requirements, and day-to-day tasks
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    <strong>Location</strong>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. San Francisco, CA or Remote"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <strong>Job Type</strong>
                  </Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="form-select-lg"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>
                <strong>Skills (comma-separated)</strong>
              </Form.Label>
              <Form.Control
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. JavaScript, React, Node.js, MongoDB"
                className="form-control-lg"
              />
              <Form.Text className="text-muted">
                List the key skills required for this position - these will be used to match candidates
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <strong>Experience Level</strong>
                  </Form.Label>
                  <Form.Select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    className="form-select-lg"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive Level</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <strong>Years of Experience</strong>
                  </Form.Label>
                  <Form.Select
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="form-select-lg"
                  >
                    <option value="">Select Years</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaCalendarAlt className="me-2 text-primary" />
                    <strong>Application Deadline</strong>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>
                <FaGraduationCap className="me-2 text-primary" />
                <strong>Education Requirements</strong>
              </Form.Label>
              <Form.Control
                type="text"
                name="educationRequirements"
                value={formData.educationRequirements}
                onChange={handleChange}
                placeholder="e.g. Bachelor's degree in Computer Science or related field"
                className="form-control-lg"
              />
            </Form.Group>

            <div className="d-flex justify-content-end mt-5 cjp-form-actions">
              <Button 
                variant="secondary" 
                className="me-3 px-4 py-2 cjp-cancel-button"
                size="lg"
                onClick={() => navigate('/dashboard/recruiter')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
                className="btn-lg cjp-submit-button"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateJobPage;
