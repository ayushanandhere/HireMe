import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buildAssetUrl, candidatesService } from '../../services/api';
import {
  FaArrowLeft,
  FaChartBar,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
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
      if (!background) {
        setLoading(true);
      }

      const response = await candidatesService.getAllCandidates();
      if (response.success) {
        setCandidates(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch candidates');
      }
    } catch (err) {
      setError(err.message || 'Error loading candidates. Please try again.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCandidates();

    const handleFocus = () => {
      fetchCandidates({ background: true });
    };

    const intervalId = window.setInterval(() => {
      fetchCandidates({ background: true });
    }, 30000);

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
    return (
      <div className="talent-pool-loading">
        <div className="spinner"></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="talent-pool-page page-shell">
      <section className="talent-pool-hero">
        <article className="talent-pool-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Talent pool</span>
          <h1>Scan the wider candidate surface before opening a req.</h1>
          <p>
            Search the pool by signal, inspect resumes quickly, and jump into deeper analysis when a
            profile deserves recruiter attention.
          </p>
          <div className="talent-pool-hero-actions">
            <Link to="/dashboard/recruiter" className="action-link signal">
              <FaArrowLeft /> Back to Dashboard
            </Link>
          </div>
        </article>

        <article className="talent-pool-metrics surface-card">
          <div className="talent-pool-metric">
            <span>Total Candidates</span>
            <strong>{candidates.length}</strong>
          </div>
          <div className="talent-pool-metric">
            <span>With Resume</span>
            <strong>{candidates.filter((candidate) => candidate.hasResume).length}</strong>
          </div>
          <div className="talent-pool-metric">
            <span>With Skills</span>
            <strong>{candidates.filter((candidate) => candidate.skills).length}</strong>
          </div>
        </article>
      </section>

      <section className="talent-pool-toolbar surface-card">
        <div className="talent-pool-search">
          <FaSearch className="talent-pool-search-icon" />
          <input
            type="text"
            className="talent-pool-search-input"
            placeholder="Search by name, email, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="talent-pool-toolbar-actions">
          <button type="button" className="talent-toolbar-button" disabled>
            <FaFilter /> Filter
          </button>
          <button type="button" className="talent-toolbar-button" disabled>
            <FaSortAmountDown /> Sort
          </button>
        </div>
      </section>

      {error && <div className="talent-pool-error">{error}</div>}

      {filteredCandidates.length === 0 ? (
        <section className="talent-pool-empty surface-card">
          <FaUserTie />
          <h3>No candidates found</h3>
          <p>{searchTerm ? 'No profiles match your current search.' : 'No candidates are available right now.'}</p>
        </section>
      ) : (
        <section className="talent-pool-grid">
          {filteredCandidates.map((candidate) => (
            <article key={candidate._id} className="talent-candidate-card surface-card">
              <div className="talent-candidate-head">
                {candidate.profilePictureUrl ? (
                  <div className="talent-candidate-avatar talent-candidate-avatar-image">
                    <img src={buildAssetUrl(candidate.profilePictureUrl)} alt={candidate.name} />
                  </div>
                ) : (
                  <div className="talent-candidate-avatar">{candidate.name.charAt(0).toUpperCase()}</div>
                )}
                <div className="talent-candidate-meta">
                  <h3>{candidate.name}</h3>
                  <p><FaEnvelope /> {candidate.email}</p>
                  <span>{candidate.headline || candidate.experience || 'Experience not specified'}</span>
                  {candidate.location && <span>{candidate.location}</span>}
                </div>
              </div>

              <div className="talent-candidate-signal">
                {candidate.hasResume ? (
                  <span className="signal-chip positive">Resume available</span>
                ) : (
                  <span className="signal-chip review">No resume</span>
                )}
              </div>

              <div className="talent-candidate-skills">
                {candidate.skills ? candidate.skills.split(',').slice(0, 4).map((skill) => (
                  <span key={skill.trim()} className="talent-skill-chip">
                    {skill.trim()}
                  </span>
                )) : (
                  <span className="talent-skill-empty">No skills provided</span>
                )}
              </div>

              <div className="talent-candidate-actions">
                <Link
                  to={`/dashboard/recruiter/candidates/${candidate._id}`}
                  className="action-link secondary"
                >
                  <FaChartBar /> Analysis
                </Link>

                {candidate.hasResume ? (
                  <>
                    <a
                      href="#"
                      className="action-link ghost"
                      onClick={(event) => {
                        event.preventDefault();
                        handleViewResume(candidate);
                      }}
                    >
                      <FaEye /> View Resume
                    </a>
                    <a
                      href="#"
                      className="action-link ghost"
                      onClick={(event) => {
                        event.preventDefault();
                        handleDownloadResume(candidate);
                      }}
                    >
                      <FaDownload /> Download
                    </a>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default RegisteredCandidatesPage;
