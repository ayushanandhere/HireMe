import React, { useState, useEffect } from 'react';
import { ProgressBar, Alert, Button, Spinner } from 'react-bootstrap';
import { candidatesService } from '../services/api';
import { FaGraduationCap, FaBriefcase, FaCode, FaChartBar, FaSync, FaExclamationTriangle, FaUser, FaBuilding, FaCalendarAlt, FaUniversity } from 'react-icons/fa';

const ResumeAnalysis = ({ candidateId, onParseClick }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (candidateId) {
      fetchAnalysis();
    }
  }, [candidateId]);

  const fetchAnalysis = async () => {
    if (!candidateId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await candidatesService.getResumeAnalysis(candidateId);
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError(response.message || 'Could not load resume analysis');
      }
    } catch (err) {
      console.error('Resume analysis error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      
      if (errorMessage.includes('not been parsed') || errorMessage.includes('not parsed yet')) {
        setError('Resume has not been parsed yet. Please parse the resume first.');
      } else if (errorMessage.includes('authorized') || errorMessage.includes('permission')) {
        setError('You do not have permission to view this resume analysis.');
      } else {
        setError('Failed to load resume analysis: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParseResume = async () => {
    if (!candidateId) return;
    
    try {
      setParsing(true);
      setError(null);
      const response = await candidatesService.parseResume(candidateId);
      if (response.success) {
        // If successful, fetch the updated analysis
        await fetchAnalysis();
      } else {
        setError(response.message || 'Could not parse resume');
      }
    } catch (err) {
      console.error('Resume parsing error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      
      if (errorMessage.includes('authorized') || errorMessage.includes('permission')) {
        setError('You do not have permission to parse this resume.');
      } else {
        setError('Failed to parse resume: ' + errorMessage);
      }
    } finally {
      setParsing(false);
    }
  };

  // Modern styling with a light, attractive design
  const styles = {
    card: {
      backgroundColor: 'white',
      color: '#495057',
      borderRadius: '16px',
      marginBottom: '24px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      position: 'relative',
    },
    cardHeader: {
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      padding: '22px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(67, 97, 238, 0.03)',
      position: 'relative',
    },
    cardTitle: {
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      color: '#4361ee',
    },
    cardBody: {
      padding: '28px',
      position: 'relative',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px 20px',
    },
    refreshButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      color: '#4361ee',
      border: '1px solid rgba(67, 97, 238, 0.2)',
      borderRadius: '12px',
      padding: '10px 18px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    },
    parseButton: {
      backgroundColor: '#4361ee',
      color: 'white',
      border: 'none',
      padding: '14px 24px',
      borderRadius: '12px',
      fontWeight: '600',
      boxShadow: '0 8px 15px rgba(67, 97, 238, 0.2)',
      transition: 'all 0.2s ease',
    },
    scoreContainer: {
      marginBottom: '30px',
      backgroundColor: 'rgba(67, 97, 238, 0.03)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(67, 97, 238, 0.1)',
    },
    progressContainer: {
      marginBottom: '20px',
    },
    scoreLabel: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '12px',
      fontSize: '1rem',
      fontWeight: '500',
      color: '#495057',
    },
    progressValue: {
      fontWeight: '700',
      fontSize: '1.2rem',
      color: '#4361ee',
    },
    progressBar: {
      height: '12px',
      borderRadius: '6px',
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    alert: {
      backgroundColor: 'rgba(255, 159, 28, 0.08)',
      border: '1px solid rgba(255, 159, 28, 0.2)',
      color: '#495057',
      padding: '18px 22px',
      borderRadius: '12px',
      marginBottom: '24px',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
    },
    alertIcon: {
      fontSize: '1.25rem',
      marginRight: '14px',
      color: '#ff9f1c',
    },
    emptyState: {
      textAlign: 'center',
      padding: '30px 20px',
      color: '#6c757d',
    },
    skillBadge: {
      display: 'inline-block',
      backgroundColor: 'rgba(67, 97, 238, 0.08)',
      color: '#4361ee',
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '0.9rem',
      margin: '0 8px 8px 0',
      border: '1px solid rgba(67, 97, 238, 0.15)',
      transition: 'all 0.2s ease',
      fontWeight: '500',
    },
    experienceItem: {
      padding: '16px 20px',
      backgroundColor: 'rgba(76, 201, 240, 0.03)',
      borderRadius: '12px',
      marginBottom: '16px',
      border: '1px solid rgba(76, 201, 240, 0.15)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
    },
    experienceTitle: {
      fontSize: '1.05rem',
      fontWeight: '700',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      color: '#495057',
    },
    experienceSubtitle: {
      fontSize: '0.95rem',
      color: '#6c757d',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      fontWeight: '500',
    },
    experienceDate: {
      fontSize: '0.85rem',
      color: '#adb5bd',
      display: 'flex',
      alignItems: 'center',
      fontStyle: 'italic',
    },
    icon: {
      marginRight: '10px',
      fontSize: '1rem',
      color: '#4361ee',
    },
    lastUpdated: {
      fontSize: '0.85rem',
      color: '#adb5bd',
      textAlign: 'right',
      marginTop: '15px',
      fontStyle: 'italic',
    },
  };

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.loadingContainer}>
          <Spinner animation="border" role="status" variant="light">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p style={{ marginTop: '16px', opacity: '0.8' }}>Loading resume analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.card}>
        <div style={styles.cardBody}>
          <div style={styles.alert}>
            <FaExclamationTriangle style={styles.alertIcon} />
            <span>{error}</span>
          </div>
          <Button 
            style={styles.parseButton}
            onClick={onParseClick || handleParseResume} 
            disabled={parsing}
          >
            {parsing ? 'Parsing...' : 'Parse Resume'}
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={styles.card}>
        <div style={styles.cardBody}>
          <div style={styles.alert}>
            <FaExclamationTriangle style={styles.alertIcon} />
            <span>Resume has not been parsed yet. Please parse the resume first.</span>
          </div>
          <Button 
            style={styles.parseButton}
            onClick={onParseClick || handleParseResume} 
            disabled={parsing}
          >
            {parsing ? 'Parsing...' : 'Parse Resume'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-analysis">
      {/* ATS Score Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            <FaChartBar style={{ marginRight: '10px' }} /> ATS Score
          </h5>
          <button 
            style={styles.refreshButton}
            onClick={onParseClick || handleParseResume}
            disabled={parsing}
          >
            {parsing ? 'Refreshing...' : (
              <>
                <FaSync style={{ marginRight: '8px' }} /> Refresh Analysis
              </>
            )}
          </button>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.scoreContainer}>
            <div style={styles.scoreLabel}>
              <span>Score</span>
              <span style={styles.progressValue}>{analysis.atsScore || 0}%</span>
            </div>
            <div style={{ position: 'relative' }}>
              <ProgressBar 
                now={analysis.atsScore || 0} 
                variant={
                  analysis.atsScore >= 80 ? 'success' :
                  analysis.atsScore >= 60 ? 'info' :
                  analysis.atsScore >= 40 ? 'warning' : 'danger'
                }
                style={{
                  ...styles.progressBar,
                  background: 'linear-gradient(to right, #4361ee, #4cc9f0)',
                  height: '12px',
                  borderRadius: '6px',
                }}
                className="mb-3"
              />
            </div>
            <p style={{ 
              color: '#495057', 
              fontSize: '1rem', 
              margin: '15px 0',
              padding: '12px 16px',
              backgroundColor: 'rgba(67, 97, 238, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(67, 97, 238, 0.08)',
              fontWeight: '500'
            }}>
              {analysis.atsScore >= 80 ? 
                'Excellent! This resume is well-optimized for ATS systems.' :
                analysis.atsScore >= 60 ? 
                'Good. This resume should pass most ATS systems.' :
                analysis.atsScore >= 40 ? 
                'Fair. Consider improving the resume format for better ATS compatibility.' : 
                'Needs improvement. Your resume may be rejected by ATS systems.'}
            </p>
            {analysis.parsedDate && (
              <p style={styles.lastUpdated}>
                Last updated: {new Date(analysis.parsedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Skills Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            <FaCode style={{ marginRight: '10px' }} /> Skills
          </h5>
        </div>
        <div style={styles.cardBody}>
          {analysis.skills && analysis.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {analysis.skills.map((skill, index) => (
                <span key={index} style={styles.skillBadge}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <FaCode size={40} style={{ opacity: '0.4', marginBottom: '16px' }} />
              <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>No skills detected</h6>
              <p style={{ opacity: '0.7', maxWidth: '500px', margin: '0 auto' }}>
                Your resume may not contain easily identifiable skills. Consider adding more technical and soft skills relevant to your field.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Experience Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            <FaBriefcase style={{ marginRight: '10px' }} /> Experience
          </h5>
        </div>
        <div style={styles.cardBody}>
          {analysis.experience && analysis.experience.length > 0 ? (
            <div>
              {analysis.experience.map((exp, index) => (
                <div key={index} style={styles.experienceItem}>
                  <div style={styles.experienceTitle}>
                    <FaUser style={styles.icon} /> {exp.role || 'Position'}
                  </div>
                  <div style={styles.experienceSubtitle}>
                    <FaBuilding style={styles.icon} /> {exp.company || 'Company'}
                  </div>
                  <div style={styles.experienceDate}>
                    <FaCalendarAlt style={styles.icon} /> 
                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : 'Start Date'} - 
                    {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : exp.current ? 'Present' : 'End Date'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <FaBriefcase size={40} style={{ opacity: '0.4', marginBottom: '16px' }} />
              <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>No experience entries detected</h6>
              <p style={{ opacity: '0.7', maxWidth: '500px', margin: '0 auto' }}>
                We couldn't identify clear experience entries in the resume. Make sure experience sections are clearly formatted with company names, job titles, and dates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Education Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            <FaGraduationCap style={{ marginRight: '10px' }} /> Education
          </h5>
        </div>
        <div style={styles.cardBody}>
          {analysis.education && analysis.education.length > 0 ? (
            <div>
              {analysis.education.map((edu, index) => (
                <div key={index} style={styles.experienceItem}>
                  <div style={styles.experienceTitle}>
                    <FaGraduationCap style={styles.icon} /> {edu.degree || 'Degree'}
                  </div>
                  <div style={styles.experienceSubtitle}>
                    <FaUniversity style={styles.icon} /> {edu.institution || 'Institution'}
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <div style={styles.experienceDate}>
                      <FaCalendarAlt style={styles.icon} /> 
                      {edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ''} 
                      {(edu.startDate && edu.endDate) ? ' - ' : ''}
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : edu.current ? 'Present' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <FaGraduationCap size={40} style={{ opacity: '0.4', marginBottom: '16px' }} />
              <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>No education entries detected</h6>
              <p style={{ opacity: '0.7', maxWidth: '500px', margin: '0 auto' }}>
                We couldn't identify clear education entries in the resume. Make sure education sections clearly list degrees, institutions, and graduation dates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis; 