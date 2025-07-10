import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Table, Spinner, Alert } from 'react-bootstrap';
import { FaBriefcase, FaPlus, FaEdit, FaTrash, FaEye, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { jobService } from '../../services/api';
import './Dashboard.css';
import './ManageJobsPage.css';

const ManageJobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobService.getRecruiterJobs();
      if (response.success) {
        setJobs(response.data);
      } else {
        setError(response.message || 'Failed to load jobs');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (jobId) => {
    setDeleteJobId(jobId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteJobId) return;
    
    setDeleteLoading(true);
    try {
      const response = await jobService.deleteJob(deleteJobId);
      if (response.success) {
        // Remove the deleted job from the state
        setJobs(jobs.filter(job => job._id !== deleteJobId));
        setShowDeleteConfirm(false);
        setDeleteJobId(null);
      } else {
        setError(response.message || 'Failed to delete job');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the job');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteJobId(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge bg="success">Published</Badge>;
      case 'draft':
        return <Badge bg="secondary">Draft</Badge>;
      case 'closed':
        return <Badge bg="danger">Closed</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container className="mjp-container dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <FaBriefcase className="me-2" /> Manage Jobs
        </h1>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={() => navigate('/dashboard/recruiter')}
            className="me-2 d-flex align-items-center mjp-back-button"
          >
            <FaArrowLeft className="me-2" /> Back to Dashboard
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/dashboard/recruiter/jobs/create')}
            className="d-flex align-items-center mjp-create-job-button"
          >
            <FaPlus className="me-2" /> Create New Job
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {showDeleteConfirm && (
        <Alert variant="danger" className="mjp-delete-alert">
          <Alert.Heading>Confirm Delete</Alert.Heading>
          {/* Applying mjp-delete-alert to the parent Alert */}
          <p>Are you sure you want to delete this job? This action cannot be undone.</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-secondary" 
              onClick={handleDeleteCancel}
              className="me-2"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Spinner size="sm" animation="border" /> : 'Delete'}
            </Button>
          </div>
        </Alert>
      )}

      <Card className="dashboard-card">
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center p-5 mjp-empty-state-card">
              <p className="mb-4">You haven't created any jobs yet.</p>
              {/* Applying mjp-empty-state-card to the parent div of this text */}
              <Button 
                variant="primary" 
                onClick={() => navigate('/dashboard/recruiter/jobs/create')}
              >
                <FaPlus className="me-2" /> Create Your First Job
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mjp-jobs-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th>Applications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job._id}>
                    <td>{job.title}</td>
                    <td>{job.company}</td>
                    <td>{getStatusBadge(job.status)}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/applications`)}
                        className="mjp-action-button"
                      >
                        <FaUsers className="me-1" /> View Applications
                      </Button>
                    </td>
                    <td>
                      <div className="d-flex">
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="me-1 mjp-action-button"
                          onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}`)}
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="me-1 mjp-action-button"
                          onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/edit`)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="mjp-action-button"
                          onClick={() => handleDeleteClick(job._id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ManageJobsPage;
