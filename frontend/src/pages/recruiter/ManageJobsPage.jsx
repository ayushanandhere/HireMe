import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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

  if (loading) {
    return <div className="mj-loading"><div className="mj-spinner" /><p>Loading...</p></div>;
  }

  return (
    <div className="mj-page page-shell">
      <section className="mj-header">
        <div className="mj-header-left">
          <h1>Roles</h1>
          <div className="mj-header-meta">
            <span className="signal-chip active">{publishedJobs} open</span>
            <span className="signal-chip positive">{totalApplications} applications</span>
            <span className="signal-chip ai">{jobs.length} total</span>
          </div>
        </div>
        <div className="mj-header-actions">
          <button type="button" className="action-link ghost" onClick={() => navigate('/dashboard/recruiter')}>
            Dashboard
          </button>
          <button type="button" className="action-link primary" onClick={() => navigate('/dashboard/recruiter/jobs/create')}>
            <FaPlus /> Create role
          </button>
        </div>
      </section>

      {error && <div className="mj-alert">{error}</div>}

      {deleteJobId && (
        <section className="mj-confirm surface-card">
          <p>Delete this role permanently? This cannot be undone.</p>
          <div className="mj-confirm-actions">
            <button type="button" className="action-link ghost" onClick={() => setDeleteJobId(null)} disabled={deleteLoading}>
              Cancel
            </button>
            <button type="button" className="action-link secondary" onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </section>
      )}

      {jobs.length === 0 ? (
        <section className="mj-empty surface-card">
          <FaBriefcase />
          <h3>No roles created</h3>
          <p>Create your first role to start collecting applications.</p>
          <button type="button" className="action-link primary" onClick={() => navigate('/dashboard/recruiter/jobs/create')}>
            <FaPlus /> Create role
          </button>
        </section>
      ) : (
        <section className="mj-grid">
          {jobs.map((job) => (
            <article key={job._id} className="mj-card surface-card">
              <div className="mj-card-top">
                <div className="mj-card-mark">
                  <FaBriefcase />
                </div>
                <span className={`signal-chip ${getStatusTone(job.status)}`}>{job.status || 'unknown'}</span>
              </div>

              <div className="mj-card-head">
                <div>
                  <h3>{job.title}</h3>
                  <span>{job.company}</span>
                </div>
                <div className="mj-card-count">
                  <span className="mono">Apps</span>
                  <strong>{job.applicantCount || 0}</strong>
                </div>
              </div>

              <div className="mj-card-meta">
                {job.type && (
                  <span>
                    <FaBriefcase /> {job.type}
                  </span>
                )}
                <span>{job.location || 'Location not set'}</span>
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>

              {job.status === 'draft' && (
                <div className="mj-card-note review">Draft role. Hidden from candidates.</div>
              )}
              {job.status === 'closed' && (
                <div className="mj-card-note alert">Closed role. No longer collecting applications.</div>
              )}
              {job.status === 'published' && (
                <div className="mj-card-note active">Live role. Ready for candidate traffic.</div>
              )}

              <div className="mj-card-actions">
                <button
                  type="button"
                  className="action-link secondary"
                  onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/applications`)}
                >
                  <FaUsers /> Applications
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
        </section>
      )}
    </div>
  );
};

export default ManageJobsPage;
