import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidatesService } from '../../services/api'; // Assuming this service exists
import { FaArrowLeft, FaUser, FaEnvelope, FaCode, FaBriefcase, FaFilePdf, FaDownload, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import ResumeAnalysis from '../../components/ResumeAnalysis'; // Assuming this component exists
import styles from './CandidateDetailPage.module.css'; // Import CSS Module

// A simple placeholder for the API service if not provided
const mockCandidatesService = {
  getCandidateById: async (id) => {
    console.log(`Fetching mock candidate with id: ${id}`);
    await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
    if (id === 'not-found') {
        return { success: false, message: 'Candidate not found' };
    }
    return {
      success: true,
      data: {
        _id: id,
        name: 'Johnathan Doe',
        email: 'john.doe@example.com',
        skills: 'React, Node.js, TypeScript, GraphQL',
        experience: '5+ Years',
        hasResume: true,
      },
    };
  },
};

const CandidateDetailPage = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the provided service or the mock service
  const apiService = candidatesService || mockCandidatesService;

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getCandidateById(candidateId);
        
        if (response.success) {
          setCandidate(response.data);
        } else {
          setError(response.message || 'Failed to load candidate details.');
        }
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId, apiService]);

  const getResumeActionUrl = (action) => {
    if (!candidateId) return '#';
    const token = localStorage.getItem('token'); // Note: This is client-side, ensure security
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    return `${backendUrl}/api/candidates/resume/${action}/${candidateId}?token=${token}`;
  };

  if (loading) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Candidate Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statusContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <Link to="/dashboard/recruiter" className={styles.backButton}>
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className={styles.statusContainer}>
         <FaExclamationTriangle className={styles.errorIcon} />
        <h2>Candidate Not Found</h2>
        <p>We couldn't find the candidate you're looking for.</p>
        <Link to="/dashboard/recruiter" className={styles.backButton}>
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
            <Link to="/dashboard/recruiter" className={styles.backButton}>
                <FaArrowLeft /> Back to Dashboard
            </Link>
            
            <div className={styles.profileCard}>
                <div className={styles.avatar}>
                    {candidate.name.charAt(0)}
                </div>
                <h1 className={styles.candidateName}>{candidate.name}</h1>
                <p className={styles.candidateEmail}>
                    <FaEnvelope /> {candidate.email}
                </p>

                <div className={styles.infoGrid}>
                    <div className={styles.infoBlock}>
                        <FaBriefcase className={styles.infoIcon} />
                        <div>
                            <span>Experience</span>
                            <strong>{candidate.experience || 'N/A'}</strong>
                        </div>
                    </div>
                    <div className={styles.infoBlock}>
                        <FaCode className={styles.infoIcon} />
                        <div>
                            <span>Top Skills</span>
                            <strong>{candidate.skills ? candidate.skills.split(',')[0] : 'N/A'}</strong>
                        </div>
                    </div>
                </div>
                
                <div className={styles.skills}>
                    {candidate.skills ? candidate.skills.split(',').map(skill => (
                        <span key={skill} className={styles.skillTag}>{skill.trim()}</span>
                    )) : <p>No skills listed.</p>}
                </div>
            </div>

            {candidate.hasResume && (
              <div className={styles.actionsCard}>
                  <h3 className={styles.actionsTitle}>Resume Actions</h3>
                  <a 
                      href={getResumeActionUrl('view')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionButton} ${styles.viewButton}`}
                  >
                      <FaEye /> View Resume
                  </a>
                  <a 
                      href={getResumeActionUrl('download')}
                      className={`${styles.actionButton} ${styles.downloadButton}`}
                      download
                  >
                      <FaDownload /> Download Resume
                  </a>
              </div>
            )}
        </div>
      </div>

      <main className={styles.mainContent}>
        <div className={styles.analysisContainer}>
          <h2 className={styles.analysisTitle}>ATS Resume Analysis</h2>
          {candidate.hasResume ? (
            <ResumeAnalysis candidateId={candidateId} />
          ) : (
            <div className={styles.noResumeCard}>
              <FaFilePdf />
              <h3>No Resume Available</h3>
              <p>This candidate has not uploaded a resume. Analysis cannot be performed.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CandidateDetailPage;
