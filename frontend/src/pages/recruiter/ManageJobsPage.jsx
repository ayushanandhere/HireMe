import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBriefcase,
  FaPlus,
  FaTrash,
  FaUsers
} from 'react-icons/fa';
import { jobService } from '../../services/api';
import './ManageJobsPage.css';

const getStatusTone = (status = '') => {
  if (status === 'published') return 'positive';
  if (status === 'draft') return 'review';
  if (status === 'closed') return 'alert';
  return 'active';
};

const ManageJobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteJobId, setDeleteJobId] = useState(null);
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
        setError(response.message || 'Failed to load jobs.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteJobId) return;
    setDeleteLoading(true);
    try {
      const response = await jobService.deleteJob(deleteJobId);
      if (response.success) {
        setJobs((current) => current.filter((job) => job._id !== deleteJobId));
        setDeleteJobId(null);
      } else {
        setError(response.message || 'Failed to delete job.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the job.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const publishedJobs = jobs.filter((job) => job.status === 'published').length;
  const totalApplications = jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0);

  return (
    <div className="jobs-admin-page page-shell">
      <section className="jobs-admin-hero">
        <article className="jobs-admin-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Recruiter operations</span>
          <h1>Manage every live role from one control surface.</h1>
          <p>
            Track published jobs, pressure on the pipeline, and when to drill into applications or
            retire a role.
          </p>
          <div className="jobs-admin-hero-actions">
            <button type="button" className="action-link signal" onClick={() => navigate('/dashboard/recruiter')}>
              <FaArrowLeft /> Back to dashboard
            </button>
            <button type="button" className="action-link primary" onClick={() => navigate('/dashboard/recruiter/jobs/create')}>
              <FaPlus /> Create role
            </button>
          </div>
        </article>

        <article className="jobs-admin-hero-metrics surface-card">
          <div className="jobs-admin-metric">
            <span>Open roles</span>
            <strong>{publishedJobs}</strong>
          </div>
          <div className="jobs-admin-metric">
            <span>Total roles</span>
            <strong>{jobs.length}</strong>
          </div>
          <div className="jobs-admin-metric">
            <span>Applications</span>
            <strong>{totalApplications}</strong>
          </div>
        </article>
      </section>

      {error && <div className="jobs-admin-message error">{error}</div>}

      {deleteJobId && (
        <section className="jobs-admin-delete surface-card">
          <div>
            <span className="eyebrow">Confirm delete</span>
            <h3>Remove this role permanently?</h3>
            <p>This action cannot be undone. Associated pipeline context will stop being accessible from this list.</p>
          </div>
          <div className="jobs-admin-delete-actions">
            <button type="button" className="action-link ghost" onClick={() => setDeleteJobId(null)} disabled={deleteLoading}>
              Cancel
            </button>
            <button type="button" className="action-link secondary" onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete Role'}
            </button>
          </div>
        </section>
      )}

      <section className="jobs-admin-list surface-card">
        <div className="jobs-admin-list-head">
          <div>
            <span className="eyebrow">Role inventory</span>
            <h2>Published, draft, and closed jobs</h2>
          </div>
          <span className="signal-chip ai">{jobs.length} tracked</span>
        </div>

        {loading ? (
          <div className="jobs-admin-loading">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="jobs-admin-empty">
            <FaBriefcase />
            <h3>No jobs created yet</h3>
            <p>Create your first role to start collecting applications and candidate signal.</p>
            <button type="button" className="action-link primary" onClick={() => navigate('/dashboard/recruiter/jobs/create')}>
              <FaPlus /> Create First Job
            </button>
          </div>
        ) : (
          <div className="jobs-admin-grid">
            {jobs.map((job) => (
              <article key={job._id} className="job-admin-card">
                <div className="job-admin-card-head">
                  <div>
                    <h3>{job.title}</h3>
                    <span>{job.company}</span>
                  </div>
                  <span className={`signal-chip ${getStatusTone(job.status)}`}>{job.status || 'unknown'}</span>
                </div>

                <div className="job-admin-meta">
                  <span>Posted {formatDate(job.createdAt)}</span>
                  <span>{job.location || 'Location not specified'}</span>
                </div>

                <div className="job-admin-stats">
                  <div className="job-admin-stat">
                    <span>Type</span>
                    <strong>{job.type || 'N/A'}</strong>
                  </div>
                  <div className="job-admin-stat">
                    <span>Applications</span>
                    <strong>{job.applicantCount || 0}</strong>
                  </div>
                </div>

                <div className="job-admin-actions">
                  <button
                    type="button"
                    className="action-link secondary"
                    onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/applications`)}
                  >
                    <FaUsers /> View Applications
                  </button>
                  <button
                    type="button"
                    className="action-link ghost"
                    onClick={() => setDeleteJobId(job._id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ManageJobsPage;
