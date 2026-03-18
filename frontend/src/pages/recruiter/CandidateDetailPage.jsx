import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { buildAssetUrl, candidatesService } from '../../services/api';
import {
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaFilePdf,
  FaGlobe,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
} from 'react-icons/fa';
import ResumeAnalysis from '../../components/ResumeAnalysis';
import styles from './CandidateDetailPage.module.css';

const CandidateDetailPage = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchCandidate = async ({ background = false } = {}) => {
      try {
        if (!background) {
          setLoading(true);
        }

        setLoadError(null);
        const response = await candidatesService.getCandidateById(candidateId);

        if (!active) {
          return;
        }

        if (response.success) {
          setCandidate(response.data);
        } else {
          setLoadError(response.message || 'Failed to load candidate details.');
        }
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setLoadError('An unexpected error occurred. Please try again later.');
      } finally {
        if (!background && active) {
          setLoading(false);
        }
      }
    };

    if (candidateId) {
      fetchCandidate();
    }

    const handleFocus = () => {
      fetchCandidate({ background: true });
    };

    const intervalId = window.setInterval(() => {
      fetchCandidate({ background: true });
    }, 30000);

    window.addEventListener('focus', handleFocus);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(intervalId);
    };
  }, [candidateId]);

  const handleViewResume = async () => {
    try {
      setActionError('');
      await candidatesService.viewResume(candidateId);
    } catch (err) {
      setActionError(err.message || 'Unable to open the resume right now.');
    }
  };

  const handleDownloadResume = async () => {
    try {
      setActionError('');
      const safeName = (candidate?.name || 'candidate').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await candidatesService.downloadResume(candidateId, `${safeName || 'candidate'}-resume.pdf`);
    } catch (err) {
      setActionError(err.message || 'Unable to download the resume right now.');
    }
  };

  if (loading) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.spinner} />
        <p>Loading candidate signal...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.statusContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>Error loading profile</h2>
        <p>{loadError}</p>
        <Link to="/dashboard/recruiter/candidates" className={styles.backButton}>
          <FaArrowLeft /> Back to candidates
        </Link>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className={styles.statusContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>Candidate not found</h2>
        <p>We could not find the candidate you selected.</p>
        <Link to="/dashboard/recruiter/candidates" className={styles.backButton}>
          <FaArrowLeft /> Back to candidates
        </Link>
      </div>
    );
  }

  const skillList = candidate.skills
    ? candidate.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];
  const avatarSrc = candidate.profilePictureUrl ? buildAssetUrl(candidate.profilePictureUrl) : '';

  return (
    <div className={styles.pageWrapper}>
      {actionError && <div className={styles.inlineError}>{actionError}</div>}
      <section className={styles.heroPanel}>
        <div>
          <span className={`${styles.eyebrow} eyebrow-dark`}>Candidate detail</span>
          <h1>{candidate.name}</h1>
          <p>
            Review profile context, inspect resume signal, and decide whether this candidate is
            worth moving deeper into the funnel.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link to="/dashboard/recruiter/candidates" className={styles.backButton}>
            <FaArrowLeft /> Back to candidates
          </Link>
          {candidate.hasResume && (
            <button type="button" onClick={handleViewResume} className={styles.primaryAction}>
              <FaEye /> Open resume
            </button>
          )}
        </div>
      </section>

      <div className={styles.contentGrid}>
        <aside className={styles.sidebar}>
          <article className={styles.profileCard}>
            {avatarSrc ? (
              <div className={styles.avatar}>
                <img src={avatarSrc} alt={candidate.name} className={styles.avatarImage} />
              </div>
            ) : (
              <div className={styles.avatar}>{candidate.name.charAt(0)}</div>
            )}
            <h2 className={styles.candidateName}>{candidate.name}</h2>
            {candidate.headline && <p className={styles.candidateHeadline}>{candidate.headline}</p>}
            <p className={styles.candidateEmail}>
              <FaEnvelope /> {candidate.email}
            </p>

            <div className={styles.infoGrid}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Experience</span>
                <strong>{candidate.experience || 'N/A'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Primary skill</span>
                <strong>{skillList[0] || 'N/A'}</strong>
              </div>
            </div>

            <div className={styles.profileFacts}>
              {candidate.location && (
                <span>
                  <FaMapMarkerAlt /> {candidate.location}
                </span>
              )}
              {candidate.phone && (
                <span>
                  <FaPhone /> {candidate.phone}
                </span>
              )}
              {candidate.linkedin && (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
            </div>

            <div className={styles.skills}>
              {skillList.length > 0 ? (
                skillList.map((skill) => (
                  <span key={skill} className={styles.skillTag}>
                    {skill}
                  </span>
                ))
              ) : (
                <p className={styles.mutedText}>No skills listed.</p>
              )}
            </div>

            {candidate.bio && (
              <p className={styles.bioCopy}>{candidate.bio}</p>
            )}
          </article>

          <article className={styles.actionsCard}>
            <h3 className={styles.actionsTitle}>Resume actions</h3>
            {candidate.hasResume ? (
              <>
                <button type="button" onClick={handleViewResume} className={styles.primaryAction}>
                  <FaEye /> View resume
                </button>
                <button type="button" onClick={handleDownloadResume} className={styles.secondaryAction}>
                  <FaDownload /> Download resume
                </button>
              </>
            ) : (
              <div className={styles.noResumeCompact}>
                <FaFilePdf />
                <span>No resume uploaded</span>
              </div>
            )}
          </article>

          <article className={styles.actionsCard}>
            <h3 className={styles.actionsTitle}>Profile links</h3>
            <div className={styles.linkStack}>
              {candidate.linkedin ? (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer" className={styles.secondaryAction}>
                  <FaLinkedin /> Open LinkedIn
                </a>
              ) : (
                <div className={styles.noResumeCompact}>
                  <FaGlobe />
                  <span>No external profile shared</span>
                </div>
              )}
            </div>
          </article>
        </aside>

        <main className={styles.mainContent}>
          <section className={styles.analysisContainer}>
            <div className={styles.analysisHeader}>
              <div>
                <span className={styles.eyebrow}>ATS analysis</span>
                <h2 className={styles.analysisTitle}>Resume signal and screening context</h2>
              </div>
              <span className={candidate.hasResume ? styles.statusPositive : styles.statusReview}>
                {candidate.hasResume ? 'Resume on file' : 'Missing resume'}
              </span>
            </div>

            {candidate.hasResume ? (
              <ResumeAnalysis candidateId={candidateId} />
            ) : (
              <div className={styles.noResumeCard}>
                <FaFilePdf />
                <h3>No resume available</h3>
                <p>This candidate has not uploaded a resume, so ATS analysis is unavailable.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default CandidateDetailPage;
