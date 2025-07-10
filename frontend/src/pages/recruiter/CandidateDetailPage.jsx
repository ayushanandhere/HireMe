import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidatesService } from '../../services/api';
import { FaArrowLeft, FaUser, FaEnvelope, FaCode, FaBriefcase, FaGraduationCap, FaCalendarPlus, FaFilePdf, FaDownload, FaEye } from 'react-icons/fa';
import ResumeAnalysis from '../../components/ResumeAnalysis';
import './Dashboard.css';

const CandidateDetailPage = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await candidatesService.getCandidateById(candidateId);
        
        if (response.success) {
          setCandidate(response.data);
        } else {
          setError('Failed to load candidate details');
        }
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setError('Failed to load candidate. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId]);

  // Function to format resume download URL
  const getResumeDownloadUrl = (candidateId) => {
    if (!candidateId) return null;
    const token = localStorage.getItem('token');
    return `http://localhost:5000/api/candidates/resume/download/${candidateId}?token=${token}`;
  };

  // Function to format resume view URL
  const getResumeViewUrl = (candidateId) => {
    if (!candidateId) return null;
    const token = localStorage.getItem('token');
    return `http://localhost:5000/api/candidates/resume/view/${candidateId}?token=${token}`;
  };

  // Enhanced styling
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    pageHeader: {
      marginBottom: '3.5rem',
      position: 'relative',
    },
    headerBackground: {
      position: 'absolute',
      top: '-30px',
      left: '-40px',
      width: '250px',
      height: '160px',
      background: 'radial-gradient(circle, rgba(247, 183, 49, 0.1) 0%, rgba(247, 183, 49, 0) 70%)',
      borderRadius: '50%',
      zIndex: '0',
    },
    headerContent: {
      position: 'relative',
      zIndex: '1',
    },
    titleWrapper: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.75rem',
    },
    titleContainer: {
      position: 'relative',
    },
    title: {
      fontSize: '3rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #0d3b2e 0%, #218a78 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textFillColor: 'transparent',
      margin: '0',
      letterSpacing: '0.5px',
      textTransform: 'capitalize',
      position: 'relative',
      display: 'inline-block',
    },
    titleHighlight: {
      position: 'absolute',
      bottom: '8px',
      left: '0',
      width: '100%',
      height: '12px',
      background: 'rgba(247, 183, 49, 0.3)',
      zIndex: '-1',
      borderRadius: '6px',
    },
    candidateName: {
      fontSize: '1.2rem',
      color: '#0d3b2e',
      fontWeight: '600',
      marginTop: '0.75rem',
      letterSpacing: '0.5px',
      display: 'inline-flex',
      alignItems: 'center',
    },
    nameIcon: {
      marginRight: '8px',
      backgroundColor: 'rgba(13, 59, 46, 0.1)',
      padding: '6px',
      borderRadius: '50%',
      color: '#0d3b2e',
    },
    subtitle: {
      fontSize: '1rem',
      color: '#666',
      marginTop: '0.5rem',
      fontWeight: '500',
      maxWidth: '600px',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '12px 24px',
      borderRadius: '50px',
      backgroundColor: 'rgba(13, 59, 46, 0.05)',
      color: '#0d3b2e',
      fontWeight: '600',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      border: 'none',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
    },
    card: {
      backgroundColor: '#0d3b2e',
      color: 'white',
      borderRadius: '12px',
      marginBottom: '24px',
      overflow: 'hidden',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    cardHeader: {
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '18px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    cardTitle: {
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
    },
    cardBody: {
      padding: '24px',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '20px',
      padding: '12px',
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      transition: 'background-color 0.2s ease',
    },
    infoIcon: {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '50%',
      marginRight: '16px',
      fontSize: '1.2rem',
    },
    infoContent: {
      flex: 1,
    },
    infoValue: {
      fontSize: '1.1rem',
      fontWeight: '500',
      marginBottom: '4px',
    },
    infoLabel: {
      fontSize: '0.85rem',
      opacity: '0.7',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    actionButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 20px',
      borderRadius: '8px',
      fontWeight: '600',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      width: '100%',
      fontSize: '1rem',
      marginBottom: '10px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    viewButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
    },
    downloadButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      color: 'white',
    },
    scheduleButton: {
      backgroundColor: '#f7b731',
      color: '#0d3b2e',
      border: 'none',
      padding: '14px 24px',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '1.1rem',
      boxShadow: '0 6px 15px rgba(247, 183, 49, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
    },
    buttonIcon: {
      marginRight: '10px',
    },
    noResumeCard: {
      textAlign: 'center',
      padding: '50px 20px',
    },
    spinner: {
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderTopColor: 'white',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', color: '#0d3b2e' }}>Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div className="alert alert-danger mt-4" role="alert" style={{ borderRadius: '10px', padding: '20px' }}>
          <h4 className="alert-heading">Error Loading Profile</h4>
          <p>{error}</p>
        </div>
        <Link to="/dashboard/recruiter" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={styles.container}>
        <div className="alert alert-warning mt-4" role="alert" style={{ borderRadius: '10px', padding: '20px' }}>
          <h4 className="alert-heading">Candidate Not Found</h4>
          <p>We couldn't find the candidate you're looking for.</p>
        </div>
        <Link to="/dashboard/recruiter" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div style={styles.headerBackground}></div>
        <div style={styles.headerContent}>
          <div style={styles.titleWrapper}>
            <div style={styles.titleContainer}>
              <h1 style={styles.title}>
                Candidate Profile
                <span style={styles.titleHighlight}></span>
              </h1>
              <div style={styles.candidateName}>
                <FaUser style={styles.nameIcon} />
                {candidate.name}
              </div>
              <p style={styles.subtitle}>
                View complete profile information, resume details, and ATS analysis
              </p>
            </div>
            <Link to="/dashboard/recruiter" style={styles.backButton}>
              <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          {/* Candidate Info Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaUser style={{ marginRight: '8px' }} /> Personal Information
              </h5>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>
                  <FaUser />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoValue}>{candidate.name}</div>
                  <div style={styles.infoLabel}>Full Name</div>
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>
                  <FaEnvelope />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoValue}>{candidate.email}</div>
                  <div style={styles.infoLabel}>Email Address</div>
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>
                  <FaCode />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoValue}>{candidate.skills || 'Not specified'}</div>
                  <div style={styles.infoLabel}>Skills</div>
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>
                  <FaBriefcase />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoValue}>{candidate.experience || 'Not specified'}</div>
                  <div style={styles.infoLabel}>Experience</div>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Actions */}
          {candidate.hasResume && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h5 style={styles.cardTitle}>
                  <FaFilePdf style={{ marginRight: '8px' }} /> Resume
                </h5>
              </div>
              <div style={styles.cardBody}>
                <a 
                  href={getResumeViewUrl(candidate._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...styles.actionButton, ...styles.viewButton}}
                >
                  <FaEye style={styles.buttonIcon} /> View Resume
                </a>
                <a 
                  href={getResumeDownloadUrl(candidate._id)}
                  style={{...styles.actionButton, ...styles.downloadButton}}
                  download
                >
                  <FaDownload style={styles.buttonIcon} /> Download Resume
                </a>
              </div>
            </div>
          )}

          {/* Interview Button */}
          <Link 
            to={`/dashboard/recruiter/schedule-interview/${candidateId}`} 
            style={styles.scheduleButton}
          >
            <FaCalendarPlus style={styles.buttonIcon} /> Schedule Interview
          </Link>
        </div>

        <div className="col-lg-8">
          {/* Resume Analysis */}
          {candidate.hasResume && (
            <div className="mb-4">
              <h2 style={{ 
                fontSize: '1.8rem', 
                color: '#0d3b2e', 
                marginBottom: '1.5rem', 
                fontWeight: '600',
                borderBottom: '3px solid #f7b731',
                paddingBottom: '8px',
                display: 'inline-block'
              }}>
                Resume Analysis
              </h2>
              <ResumeAnalysis candidateId={candidateId} />
            </div>
          )}
          
          {!candidate.hasResume && (
            <div style={{...styles.card, ...styles.noResumeCard}}>
              <div style={styles.cardBody}>
                <FaFilePdf size={60} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '20px' }} />
                <h3 style={{ marginBottom: '16px' }}>No Resume Available</h3>
                <p style={{ opacity: '0.7', maxWidth: '400px', margin: '0 auto' }}>
                  This candidate has not uploaded a resume yet. You can still schedule an interview based on their profile information.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailPage; 