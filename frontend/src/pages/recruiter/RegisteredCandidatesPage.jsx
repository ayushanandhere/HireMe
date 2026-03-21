import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buildAssetUrl, candidatesService } from '../../services/api';
import {
  FaChartBar,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaSearch,
  FaUserTie
} from 'react-icons/fa';
import './RegisteredCandidates.css';

const RegisteredCandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  const fetchCandidates = async ({ background = false } = {}) => {
    try {
      if (!background) setLoading(true);
      const response = await candidatesService.getAllCandidates();
      if (response.success) {
        setCandidates(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch candidates');
      }
    } catch (err) {
      setError(err.message || 'Error loading candidates. Please try again.');
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();

    const handleFocus = () => fetchCandidates({ background: true });
    const intervalId = window.setInterval(() => fetchCandidates({ background: true }), 30000);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }

    const normalized = searchTerm.toLowerCase();
    setFilteredCandidates(
      candidates.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(normalized) ||
          candidate.email.toLowerCase().includes(normalized) ||
          (candidate.skills && candidate.skills.toLowerCase().includes(normalized))
      )
    );
  }, [searchTerm, candidates]);

  const handleViewResume = async (candidate) => {
    try {
      setError('');
      await candidatesService.viewResume(candidate._id);
    } catch (err) {
      setError(err.message || 'Unable to open resume. Please try again.');
    }
  };

  const handleDownloadResume = async (candidate) => {
    try {
      setError('');
      const safeName = (candidate.name || 'candidate').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await candidatesService.downloadResume(candidate._id, `${safeName || 'candidate'}-resume.pdf`);
    } catch (err) {
      setError(err.message || 'Unable to download resume. Please try again.');
    }
  };

  if (loading) {
    return <div className="tp-loading"><div className="tp-spinner" /><p>Loading...</p></div>;
  }

  const withResume = candidates.filter((candidate) => candidate.hasResume).length;

  return (
    <div className="tp-page page-shell">
      <section className="tp-header">
        <div className="tp-header-left">
          <h1>Candidates</h1>
          <div className="tp-header-meta">
            <span className="signal-chip active">{candidates.length} total</span>
            <span className="signal-chip positive">{withResume} with resume</span>
          </div>
        </div>
        <div className="tp-header-actions">
          <Link to="/dashboard/recruiter" className="action-link ghost">
            Dashboard
          </Link>
        </div>
      </section>

      <div className="tp-search surface-card">
        <div className="tp-search-field">
          <FaSearch className="tp-search-icon" />
          <input
            type="text"
            className="tp-search-input"
            placeholder="Search by name, email, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="button" className="tp-search-clear" onClick={() => setSearchTerm('')}>
          Clear
        </button>
      </div>

      {error && <div className="tp-alert">{error}</div>}

      {filteredCandidates.length === 0 ? (
        <section className="tp-empty surface-card">
          <FaUserTie />
          <h3>No candidates found</h3>
          <p>{searchTerm ? 'No profiles match your search.' : 'No candidates available yet.'}</p>
        </section>
      ) : (
        <section className="tp-grid">
          {filteredCandidates.map((candidate) => (
            <article key={candidate._id} className="tp-card surface-card">
              <div className="tp-card-top">
                {candidate.profilePictureUrl ? (
                  <div className="tp-avatar tp-avatar-img">
                    <img src={buildAssetUrl(candidate.profilePictureUrl)} alt={candidate.name} />
                  </div>
                ) : (
                  <div className="tp-avatar">{candidate.name.charAt(0).toUpperCase()}</div>
                )}
                {candidate.hasResume ? (
                  <span className="signal-chip positive">Resume</span>
                ) : (
                  <span className="signal-chip review">No resume</span>
                )}
              </div>

              <div className="tp-card-head">
                <div>
                  <h3>{candidate.name}</h3>
                  <span>{candidate.headline || 'Candidate profile'}</span>
                </div>
              </div>

              <div className="tp-card-meta">
                <span><FaEnvelope /> {candidate.email}</span>
                {candidate.location && <span>{candidate.location}</span>}
              </div>

              {candidate.skills && (
                <div className="tp-skills">
                  {candidate.skills.split(',').slice(0, 5).map((skill) => (
                    <span key={skill.trim()} className="tp-pill">{skill.trim()}</span>
                  ))}
                </div>
              )}

              <div className="tp-card-actions">
                <Link to={`/dashboard/recruiter/candidates/${candidate._id}`} className="action-link secondary">
                  <FaChartBar /> Profile
                </Link>
                {candidate.hasResume && (
                  <>
                    <button type="button" className="action-link ghost" onClick={() => handleViewResume(candidate)}>
                      <FaEye /> View
                    </button>
                    <button type="button" className="action-link ghost" onClick={() => handleDownloadResume(candidate)}>
                      <FaDownload /> Download
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default RegisteredCandidatesPage;
