import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaBuilding,
  FaMapMarkerAlt,
  FaSearch,
  FaSpinner
} from 'react-icons/fa';
import { applicationService, buildAssetUrl, candidateService, jobService } from '../../services/api';
import './JobListingsPage.css';

const getJobTone = (job) => {
  if (job.type === 'remote') return 'active';
  if (job.experienceLevel === 'entry' || job.type === 'internship') return 'review';
  return 'positive';
};

const formatExperienceYears = (experienceYears) => {
  if (!experienceYears) return '';

  if (typeof experienceYears === 'string' || typeof experienceYears === 'number') {
    return String(experienceYears);
  }

  if (typeof experienceYears === 'object') {
    const { min, max } = experienceYears;

    if (min != null && max != null) {
      return `${min}-${max} years`;
    }

    if (min != null) {
      return `${min}+ years`;
    }

    if (max != null) {
      return `Up to ${max} years`;
    }
  }

  return '';
};

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

  const checkAppliedJobs = async () => {
    try {
      const candidateData = await candidateService.getProfile();

      if (candidateData.success) {
        const applicationsResponse = await applicationService.getCandidateApplications(candidateData.data._id);

        if (applicationsResponse.success) {
          const appliedJobsMap = {};
          applicationsResponse.data.forEach((application) => {
            if (application.job?._id) {
              appliedJobsMap[application.job._id] = true;
            }
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

      const queryParams = {};
      if (searchTerm) queryParams.search = searchTerm;
      if (filters.type) queryParams.type = filters.type;
      if (filters.experienceLevel) queryParams.experienceLevel = filters.experienceLevel;

      const response = await jobService.getJobs(queryParams);

      if (response.success) {
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

  const handleSearch = (event) => {
    event.preventDefault();
    fetchJobs();
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ type: '', experienceLevel: '' });
    setTimeout(fetchJobs, 0);
  };

  const appliedCount = Object.keys(appliedJobs).length;
  const remoteCount = jobs.filter((job) => (job.type || '').toLowerCase() === 'remote').length;

  if (loading) {
    return (
      <div className="job-board-loading">
        <FaSpinner className="job-board-spinner" />
        <p>Loading available jobs...</p>
      </div>
    );
  }

  return (
    <div className="job-board page-shell">
      <section className="job-board-hero">
        <article className="job-board-hero-copy surface-card">
          <span className="eyebrow">Opportunity radar</span>
          <h1>Scan live roles, then act on the best fit.</h1>
          <p>
            Browse current openings, narrow by role shape, and move directly into the application
            flow once the signal looks credible.
          </p>
          <div className="job-board-hero-actions">
            <Link to="/dashboard/candidate" className="action-link ghost">
              <FaArrowLeft /> Back to dashboard
            </Link>
            <Link to="/dashboard/candidate/applications" className="action-link secondary">
              Open applications
            </Link>
          </div>
        </article>

        <article className="job-board-hero-panel instrument-card">
          <div className="job-board-hero-head">
            <span className="eyebrow eyebrow-dark">Market snapshot</span>
            <span className="signal-chip ai">Live roles</span>
          </div>
          <div className="job-board-hero-stats">
            <div>
              <span className="job-board-stat-label">Results</span>
              <strong>{jobs.length}</strong>
            </div>
            <div>
              <span className="job-board-stat-label">Already applied</span>
              <strong>{appliedCount}</strong>
            </div>
            <div>
              <span className="job-board-stat-label">Remote</span>
              <strong>{remoteCount}</strong>
            </div>
          </div>
          <p>
            Treat this page like a shortlist builder. Apply only where the role, level, and
            location line up with your current trajectory.
          </p>
        </article>
      </section>

      {error && <div className="job-board-error">{error}</div>}

      <section className="job-board-filters surface-card">
        <div className="job-board-section-head">
          <div>
            <span className="eyebrow">Filter roles</span>
            <h2>Reduce noise before you commit.</h2>
          </div>
          <button type="button" className="job-board-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        <form className="job-board-filter-grid" onSubmit={handleSearch}>
          <label>
            Search keywords
            <div className="job-board-input-wrap">
              <FaSearch />
              <input
                type="text"
                placeholder="Job title, company, skill..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </label>
          <label>
            Job type
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All job types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
          </label>
          <label>
            Experience level
            <select
              name="experienceLevel"
              value={filters.experienceLevel}
              onChange={handleFilterChange}
            >
              <option value="">All levels</option>
              <option value="entry">Entry level</option>
              <option value="intermediate">Intermediate</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </label>
          <button type="submit" className="action-link primary">
            Find roles <FaArrowRight />
          </button>
        </form>
      </section>

      <section className="job-board-results">
        <div className="job-board-results-head">
          <div>
            <span className="eyebrow">Available positions</span>
            <h2>{jobs.length} roles currently in view.</h2>
          </div>
          <span className="signal-chip active">{appliedCount} already tracked</span>
        </div>

        {jobs.length === 0 ? (
          <div className="job-board-empty surface-card">
            <FaSearch />
            <h3>No jobs match the current filter.</h3>
            <p>Widen the search or reset your filters to reopen the market.</p>
            <button type="button" className="action-link primary" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="job-board-grid">
            {jobs.map((job) => {
              const isApplied = appliedJobs[job._id];
              const tone = getJobTone(job);
              const description = job.description?.trim() || 'No role description provided.';
              const experienceLabel = formatExperienceYears(job.experienceYears);
              const recruiterProfile = job.recruiterProfile;

              return (
                <article key={job._id} className="job-board-card surface-card">
                  <div className="job-board-card-top">
                    <div className="job-board-company-mark">
                      <FaBuilding />
                    </div>
                    <span className={`signal-chip ${isApplied ? 'active' : tone}`}>
                      {isApplied ? 'Applied' : job.type || 'Role'}
                    </span>
                  </div>

                  <div className="job-board-card-head">
                    <div>
                      <h3>{job.title}</h3>
                      <span>{job.company}</span>
                    </div>
                    <div className="job-board-fit-pill">
                      <span className="mono">Level</span>
                      <strong>{job.experienceLevel || 'Open'}</strong>
                    </div>
                  </div>

                  <div className="job-board-meta">
                    <span>
                      <FaMapMarkerAlt /> {job.location || 'Remote-friendly'}
                    </span>
                    {experienceLabel && <span>{experienceLabel}</span>}
                  </div>

                  <p>{description.length > 165 ? `${description.slice(0, 165)}...` : description}</p>

                  {recruiterProfile && (
                    <div className="job-board-recruiter">
                      <div className="job-board-recruiter-avatar">
                        {recruiterProfile.profilePictureUrl ? (
                          <img
                            src={buildAssetUrl(recruiterProfile.profilePictureUrl)}
                            alt={recruiterProfile.name || recruiterProfile.company || 'Recruiter'}
                          />
                        ) : (
                          <span>
                            {(recruiterProfile.name || recruiterProfile.company || 'R').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="job-board-recruiter-copy">
                        <strong>{recruiterProfile.name || recruiterProfile.company || 'Hiring team'}</strong>
                        <span>
                          {recruiterProfile.title
                            ? `${recruiterProfile.title}${recruiterProfile.company ? `, ${recruiterProfile.company}` : ''}`
                            : recruiterProfile.company || 'Recruiter profile available'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="job-board-card-actions">
                    <Link
                      to={
                        isApplied
                          ? '/dashboard/candidate/applications'
                          : `/dashboard/candidate/jobs/${job._id}/apply`
                      }
                      className={`action-link ${isApplied ? 'secondary' : 'primary'}`}
                    >
                      {isApplied ? 'See application' : 'Apply now'} <FaArrowRight />
                    </Link>
                    <span className="job-board-card-tag">
                      <FaBriefcase /> {job.type || 'Flexible'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default JobListingsPage;
