import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaSearch, FaSpinner } from 'react-icons/fa';
import { applicationService, candidateService, jobService } from '../../services/api';
import './JobListingsPage.css';

const compactStageLabels = {
  new_application: 'New', resume_screened: 'Screened', job_matched: 'Matched',
  interview_requested: 'Interview', interview_scheduled: 'Scheduled',
  interview_completed: 'Completed', interview_cancelled: 'Cancelled',
  offer_extended: 'Offer', offer_accepted: 'Accepted',
  rejected: 'Rejected', withdrawn: 'Withdrawn',
};

const getRowTint = (stage) => {
  if (!stage) return 'blue';
  if (['rejected', 'withdrawn', 'interview_cancelled'].includes(stage)) return 'red';
  return 'green';
};

const getChipTone = (stage) => {
  if (['rejected', 'withdrawn', 'interview_cancelled'].includes(stage)) return 'stage-red';
  if (['interview_scheduled', 'resume_screened'].includes(stage)) return 'stage-blue';
  return 'stage-green';
};

const fmtExp = (v) => {
  if (!v) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const { min, max } = v;
    if (min != null && max != null) return `${min}–${max}y`;
    if (min != null) return `${min}+y`;
    if (max != null) return `≤${max}y`;
  }
  return '';
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const JobListingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: '', experienceLevel: '' });
  const [appliedJobs, setAppliedJobs] = useState({});

  useEffect(() => { fetchJobs(); checkApplied(); }, []);

  const checkApplied = async () => {
    try {
      const profile = await candidateService.getProfile();
      if (!profile.success) return;
      const apps = await applicationService.getCandidateApplications(profile.data._id);
      if (!apps.success) return;
      const map = {};
      apps.data.forEach((a) => { if (a.job?._id) map[a.job._id] = a; });
      setAppliedJobs(map);
    } catch { /* noop */ }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true); setError('');
      const q = {};
      if (searchTerm) q.search = searchTerm;
      if (filters.type) q.type = filters.type;
      if (filters.experienceLevel) q.experienceLevel = filters.experienceLevel;
      const res = await jobService.getJobs(q);
      if (res.success) setJobs(res.data);
      else setError(res.message || 'Failed to fetch jobs');
    } catch (err) {
      setError(err.message || 'Error fetching jobs.');
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(); };
  const handleFilter = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  const clearFilters = () => { setSearchTerm(''); setFilters({ type: '', experienceLevel: '' }); setTimeout(fetchJobs, 0); };

  const appliedCount = Object.keys(appliedJobs).length;

  if (loading) return <div className="jb-loading"><FaSpinner className="jb-spinner" /></div>;

  return (
    <div className="jb page-shell">
      {/* Header */}
      <header className="jb-header">
        <div className="jb-header-left">
          <h1>Jobs</h1>
          <span className="jb-count blue">{jobs.length} available</span>
          {appliedCount > 0 && <span className="jb-count green">{appliedCount} applied</span>}
        </div>
        <div className="jb-header-actions">
          <Link to="/dashboard/candidate" className="action-link ghost">Dashboard</Link>
          <Link to="/dashboard/candidate/applications" className="action-link ghost">Applications</Link>
        </div>
      </header>

      {error && <div className="jb-error">{error}</div>}

      {/* Filters */}
      <form className="jb-filters" onSubmit={handleSearch}>
        <div className="jb-search-wrap">
          <FaSearch />
          <input type="text" placeholder="Search jobs…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select name="type" value={filters.type} onChange={handleFilter}>
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
          <option value="remote">Remote</option>
        </select>
        <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilter}>
          <option value="">All levels</option>
          <option value="entry">Entry</option>
          <option value="intermediate">Intermediate</option>
          <option value="senior">Senior</option>
          <option value="executive">Executive</option>
        </select>
        <button type="submit" className="jb-filter-btn">Search</button>
        <button type="button" className="jb-clear" onClick={clearFilters}>Clear</button>
      </form>

      {/* List */}
      {jobs.length === 0 ? (
        <div className="jb-empty">
          <FaSearch />
          <h3>No jobs match your filters</h3>
          <button type="button" className="jb-filter-btn" onClick={clearFilters}>Reset</button>
        </div>
      ) : (
        <div className="jb-list">
          {jobs.map((job) => {
            const app = appliedJobs[job._id];
            const isApplied = Boolean(app);
            const tint = isApplied ? getRowTint(app.stage) : 'blue';
            const exp = fmtExp(job.experienceYears);
            const dest = isApplied
              ? `/dashboard/candidate/applications/${app._id}`
              : `/dashboard/candidate/jobs/${job._id}/apply`;

            return (
              <Link key={job._id} to={dest} className={`jb-row tint-${tint}`}>
                <div className="jb-row-body">
                  <div className="jb-row-top">
                    <h3>{job.title}</h3>
                    <div className="jb-row-chips">
                      {isApplied ? (
                        <>
                          <span className="jb-chip applied">Applied</span>
                          <span className={`jb-chip ${getChipTone(app.stage)}`}>
                            {compactStageLabels[app.stage] || app.stage}
                          </span>
                        </>
                      ) : (
                        <span className="jb-chip open">Open</span>
                      )}
                    </div>
                  </div>
                  <div className="jb-row-meta">
                    <span><FaBuilding /> {job.company}</span>
                    <span className="jb-sep" />
                    <span><FaMapMarkerAlt /> {job.location || 'Remote'}</span>
                    {job.type && <><span className="jb-sep" /><span><FaBriefcase /> {job.type}</span></>}
                    {exp && <><span className="jb-sep" /><span>{exp}</span></>}
                    {job.experienceLevel && <><span className="jb-sep" /><span style={{ textTransform: 'capitalize' }}>{job.experienceLevel}</span></>}
                    {isApplied && app.createdAt && <><span className="jb-sep" /><span>Applied {fmtDate(app.createdAt)}</span></>}
                  </div>
                </div>
                <span className="jb-row-arrow"><FaArrowRight /></span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobListingsPage;
