import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidatesService } from '../../services/api';
import { 
  FaUserTie, FaSearch, FaDownload, FaEye, FaChartBar, FaArrowLeft, 
  FaEnvelope, FaGraduationCap, FaBriefcase, FaCode, FaFilter, FaSortAmountDown
} from 'react-icons/fa';
import './RegisteredCandidates.css';

const RegisteredCandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await candidatesService.getAllCandidates();
        if (response.success) {
          setCandidates(response.data);
          setFilteredCandidates(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch candidates');
        }
      } catch (err) {
        setError(err.message || 'Error loading candidates. Please try again.');
        console.error('Error fetching candidates:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(candidate => 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.skills && candidate.skills.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCandidates(filtered);
    }
  }, [searchTerm, candidates]);

  // Function to format resume download URL
  const getResumeDownloadUrl = (candidateId) => {
    if (!candidateId) return null;
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    return `${backendUrl}/api/candidates/resume/download/${candidateId}?token=${token}`;
  };

  // Function to format resume view URL
  const getResumeViewUrl = (candidateId) => {
    if (!candidateId) return null;
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    return `${backendUrl}/api/candidates/resume/view/${candidateId}?token=${token}`;
  };

  if (loading) {
    return (
      <div className="candidates-loading">
        <div className="spinner"></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="candidates-container">
      <div className="candidates-header">
        <div className="header-badge">Talent Pool</div>
        <h1 className="candidates-title">Registered Candidates</h1>
        <p className="candidates-subtitle">
          Browse through your talent pool, find the perfect match for your open positions, 
          and analyze candidate profiles with our AI-powered tools.
        </p>
        <div className="candidates-stats">
          <div className="stat-item">
            <div className="stat-value">{candidates.length}</div>
            <div className="stat-label">Total Candidates</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{candidates.filter(c => c.hasResume).length}</div>
            <div className="stat-label">With Resume</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{candidates.filter(c => c.skills).length}</div>
            <div className="stat-label">With Skills</div>
          </div>
        </div>
      </div>

      <div className="candidates-actions">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="filter-button">
            <FaFilter /> Filter
          </button>
          <button className="sort-button">
            <FaSortAmountDown /> Sort
          </button>
        </div>
        <Link to="/dashboard/recruiter" className="back-button">
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <div className="candidates-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {filteredCandidates.length === 0 ? (
          <div className="empty-state">
            <FaUserTie className="empty-icon" />
            <h3>No Candidates Found</h3>
            <p>{searchTerm ? 'No candidates match your search criteria.' : 'No candidates available at the moment.'}</p>
          </div>
        ) : (
          <div className="candidates-table-container">
            <div className="candidates-table">
              {Array.from({ length: Math.ceil(filteredCandidates.length / 4) }, (_, rowIndex) => (
                <div key={rowIndex} className="candidates-row">
                  {filteredCandidates.slice(rowIndex * 4, (rowIndex + 1) * 4).map((candidate, colIndex) => (
                    <div key={candidate._id} className="candidate-card-compact" style={{'--animation-order': (rowIndex * 4 + colIndex) % 8}}>
                      <div className="candidate-header-compact">
                        <div className="candidate-avatar-compact">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="candidate-basic-info">
                          <h4 className="candidate-name-compact">{candidate.name}</h4>
                          <p className="candidate-email-compact">
                            <FaEnvelope className="email-icon-compact" />
                            {candidate.email}
                          </p>
                          <div className="candidate-experience-compact">
                            <FaBriefcase className="experience-icon" />
                            <span>{candidate.experience ? `${candidate.experience} years` : 'Experience not specified'}</span>
                          </div>
                          {candidate.hasResume && <span className="has-resume-badge-compact">Resume Available</span>}
                        </div>
                      </div>
                      
                      <div className="candidate-actions-compact">
                        <Link 
                          to={`/dashboard/recruiter/candidates/${candidate._id}`}
                          className="action-button-compact analysis-btn-compact"
                          title="View Analysis"
                        >
                          <FaChartBar />
                        </Link>
                        
                        {candidate.hasResume ? (
                          <>
                            <a 
                              href={getResumeViewUrl(candidate._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="action-button-compact view-btn-compact"
                              title="View Resume"
                            >
                              <FaEye />
                            </a>
                            <a 
                              href={getResumeDownloadUrl(candidate._id)}
                              className="action-button-compact download-btn-compact"
                              title="Download Resume"
                              download
                            >
                              <FaDownload />
                            </a>
                          </>
                        ) : (
                          <span className="no-resume-compact"><FaUserTie /> No Resume</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Fill empty cells if last row has less than 4 candidates */}
                  {rowIndex === Math.ceil(filteredCandidates.length / 4) - 1 && 
                   filteredCandidates.length % 4 !== 0 && 
                   Array.from({ length: 4 - (filteredCandidates.length % 4) }, (_, emptyIndex) => (
                     <div key={`empty-${emptyIndex}`} className="candidate-card-empty"></div>
                   ))
                  }
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisteredCandidatesPage;
