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
        if (!background) setLoading(true);
        setLoadError(null);
        const response = await candidatesService.getCandidateById(candidateId);
        if (!active) return;
        if (response.success) {
          setCandidate(response.data);
        } else {
          setLoadError(response.message || 'Failed to load candidate details.');
        }
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setLoadError('An unexpected error occurred. Please try again later.');
      } finally {
        if (!background && active) setLoading(false);
      }
    };

    if (candidateId) fetchCandidate();

    const handleFocus = () => fetchCandidate({ background: true });
    const intervalId = window.setInterval(() => fetchCandidate({ background: true }), 30000);
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
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.statusContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>Error loading profile</h2>
        <p>{loadError}</p>
        <Link to="/dashboard/recruiter/candidates" className="action-link ghost">
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
        <Link to="/dashboard/recruiter/candidates" className="action-link ghost">
          <FaArrowLeft /> Back to candidates
        </Link>
      </div>
    );
  }

  const skillList = candidate.skills
    ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const avatarSrc = candidate.profilePictureUrl ? buildAssetUrl(candidate.profilePictureUrl) : '';

  return (
    <div className={`${styles.page} page-shell`}>
      {actionError && <div className={styles.error}>{actionError}</div>}

      {/* Back */}
      <header className={styles.header}>
        <Link to="/dashboard/recruiter/candidates" className="action-link ghost">
          <FaArrowLeft /> Candidates
        </Link>
      </header>

      {/* Profile strip */}
      <section className={`${styles.profile} surface-card`}>
        <div className={styles.profileMain}>
          {avatarSrc ? (
            <div className={styles.avatar}>
              <img src={avatarSrc} alt={candidate.name} />
            </div>
          ) : (
            <div className={styles.avatar}>{candidate.name.charAt(0)}</div>
          )}
          <div className={styles.profileInfo}>
            <h1>{candidate.name}</h1>
            {candidate.headline && <p className={styles.headline}>{candidate.headline}</p>}
            <div className={styles.meta}>
              <span><FaEnvelope /> {candidate.email}</span>
              {candidate.location && <span><FaMapMarkerAlt /> {candidate.location}</span>}
              {candidate.phone && <span><FaPhone /> {candidate.phone}</span>}
              {candidate.linkedin && (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedin /> LinkedIn
                </a>
              )}
              {candidate.experience && <span>Exp: {candidate.experience}</span>}
            </div>
          </div>
        </div>

        {candidate.hasResume && (
          <div className={styles.resumeActions}>
            <button type="button" onClick={handleViewResume} className="action-link primary">
              <FaEye /> View resume
            </button>
            <button type="button" onClick={handleDownloadResume} className="action-link ghost">
              <FaDownload /> Download
            </button>
          </div>
        )}
      </section>

      {/* Content */}
      <div className={styles.grid}>
        <main className={styles.main}>
          {candidate.hasResume ? (
            <ResumeAnalysis candidateId={candidateId} />
          ) : (
            <div className={`${styles.noResume} surface-card`}>
              <FaFilePdf />
              <p>No resume uploaded</p>
            </div>
          )}
        </main>

        <aside className={styles.sidebar}>
          {skillList.length > 0 && (
            <article className={`${styles.card} surface-card`}>
              <h2>Skills</h2>
              <div className={styles.skills}>
                {skillList.map((skill) => (
                  <span key={skill} className={styles.pill}>{skill}</span>
                ))}
              </div>
            </article>
          )}

          {candidate.bio && (
            <article className={`${styles.card} surface-card`}>
              <h2>About</h2>
              <p className={styles.bio}>{candidate.bio}</p>
            </article>
          )}

          {!candidate.hasResume && (
            <article className={`${styles.card} surface-card`}>
              <div className={styles.noResumeSmall}>
                <FaFilePdf />
                <span>No resume on file</span>
              </div>
            </article>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CandidateDetailPage;
