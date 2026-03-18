import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Modal, Form, Spinner } from 'react-bootstrap';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCalendarPlus,
  FaCheckCircle,
  FaFileAlt,
  FaMagic,
  FaSearch,
  FaTimesCircle,
  FaUserCircle
} from 'react-icons/fa';
import { applicationService, jobService } from '../../services/api';
import EnhancedResumeAnalysis from '../../components/EnhancedResumeAnalysis';
import './JobApplicationsPage.css';

const tabDefinitions = [
  {
    key: 'new',
    label: 'New',
    stages: ['new_application']
  },
  {
    key: 'screened',
    label: 'Screened',
    stages: ['resume_screened', 'job_matched']
  },
  {
    key: 'interview',
    label: 'Interview',
    stages: ['interview_requested', 'interview_scheduled', 'interview_completed']
  },
  {
    key: 'rejected',
    label: 'Closed',
    stages: ['rejected', 'withdrawn']
  }
];

const stageLabels = {
  new_application: 'New',
  resume_screened: 'Resume screened',
  job_matched: 'Job matched',
  interview_requested: 'Interview requested',
  interview_scheduled: 'Interview scheduled',
  interview_completed: 'Interview completed',
  offer_extended: 'Offer extended',
  offer_accepted: 'Offer accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

const getStageTone = (stage) => {
  if (['job_matched', 'offer_extended', 'offer_accepted', 'interview_completed'].includes(stage)) {
    return 'positive';
  }
  if (['resume_screened', 'interview_scheduled'].includes(stage)) {
    return 'active';
  }
  if (['new_application', 'interview_requested'].includes(stage)) {
    return 'review';
  }
  return 'alert';
};

const JobApplicationsPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentApplication, setCurrentApplication] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingResume, setProcessingResume] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState(null);
  const [applicationTab, setApplicationTab] = useState('new');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobAndApplications();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);

      const jobData = await jobService.getJobById(jobId);
      if (!jobData.success) {
        throw new Error(jobData.message || 'Failed to fetch job details');
      }
      setJob(jobData.data);

      const applicationsData = await applicationService.getJobApplications(jobId);
      if (!applicationsData.success) {
        throw new Error(applicationsData.message || 'Failed to fetch applications');
      }
      setApplications(applicationsData.data);
    } catch (err) {
      setError(err.message || 'Error loading data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseResume = async (applicationId) => {
    try {
      setProcessingResume(true);
      setError('');

      const application = applications.find((app) => app._id === applicationId);
      const hasJobSpecificResume = application && application.resumeSource === 'job-specific';
      const resumeType = hasJobSpecificResume ? 'job-specific' : 'profile';

      setMessage(`Parsing ${resumeType} resume for ${application?.candidate?.name}...`);

      const data = await applicationService.parseResume(applicationId);

      if (!data.success) {
        throw new Error(data.message || 'Failed to parse resume');
      }

      setParsedResumeData(data.data.parsedResume);
      setMessage(`Successfully parsed ${resumeType} resume for ${application?.candidate?.name}.`);
      setApplications((prevApplications) =>
        prevApplications.map((app) => (app._id === applicationId ? data.data.application : app))
      );

      if (data.data.application.stage === 'resume_screened') {
        setApplicationTab('screened');
      }

      return data.data;
    } catch (err) {
      console.error('Error parsing resume:', err);
      throw err;
    } finally {
      setProcessingResume(false);
    }
  };

  const acceptForInterview = async (applicationId) => {
    try {
      setProcessingAction(true);

      const data = await applicationService.acceptForInterview(applicationId);
      if (!data.success) {
        throw new Error(data.message || 'Failed to accept candidate for interview');
      }

      setApplications((prevApplications) =>
        prevApplications.map((app) => (app._id === applicationId ? data.data : app))
      );

      return data.data;
    } catch (err) {
      console.error('Error accepting for interview:', err);
      throw err;
    } finally {
      setProcessingAction(false);
    }
  };

  const rejectApplication = async (applicationId, reason) => {
    try {
      setProcessingAction(true);

      const data = await applicationService.reject(applicationId, reason);
      if (!data.success) {
        throw new Error(data.message || 'Failed to reject application');
      }

      setApplications((prevApplications) =>
        prevApplications.map((app) => (app._id === applicationId ? data.data : app))
      );

      return data.data;
    } catch (err) {
      console.error('Error rejecting application:', err);
      throw err;
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewResume = (application) => {
    setCurrentApplication(application);
    setParsedResumeData(null);
    setShowResumeModal(true);
  };

  const handleParseResume = async () => {
    try {
      const result = await parseResume(currentApplication._id);
      if (result && result.application) {
        setCurrentApplication(result.application);
      }
    } catch (err) {
      setError(err.message || 'Failed to parse resume. Please try again.');
    }
  };

  const handleAcceptForInterview = async (applicationId) => {
    try {
      const updated = await acceptForInterview(applicationId);
      if (updated) {
        setCurrentApplication(updated);
      }
      setShowResumeModal(false);
    } catch (err) {
      setError(err.message || 'Failed to accept for interview. Please try again.');
    }
  };

  const handleRejectClick = (application) => {
    setCurrentApplication(application);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    try {
      await rejectApplication(currentApplication._id, rejectReason);
      setShowRejectModal(false);
    } catch (err) {
      setError(err.message || 'Failed to reject application. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredApplications = applications.filter((application) => {
    const selectedTab = tabDefinitions.find((tab) => tab.key === applicationTab);
    return selectedTab ? selectedTab.stages.includes(application.stage) : true;
  });

  if (loading) {
    return (
      <div className="review-hub-loading">
        <Spinner animation="border" role="status" />
        <p>Loading applications...</p>
      </div>
    );
  }

  if (!job) {
    return <div className="review-hub-error">Job not found or has been removed.</div>;
  }

  return (
    <div className="review-hub page-shell">
      <section className="review-hero">
        <article className="review-hero-copy instrument-card">
          <span className="eyebrow eyebrow-dark">Application review</span>
          <h1>{job.title}</h1>
          <p>
            Triage the queue, parse resumes only where signal is missing, and move strong
            candidates before the funnel slows down.
          </p>
          <div className="review-hero-actions">
            <Link to="/dashboard/recruiter/jobs" className="action-link signal">
              <FaArrowLeft /> Back to roles
            </Link>
          </div>
          <div className="review-hero-tags">
            <span className="signal-chip active">{job.type || 'Role'}</span>
            <span className="signal-chip ai">{job.experienceLevel || 'Open level'}</span>
            <span className="signal-chip review">{job.location || 'Remote'}</span>
          </div>
        </article>

        <article className="review-hero-panel surface-card">
          <div className="review-summary-head">
            <span className="eyebrow">Queue snapshot</span>
            <span className="signal-chip active">{applications.length} applicants</span>
          </div>
          <div className="review-summary-grid">
            <div>
              <span className="review-summary-label">New</span>
              <strong>{applications.filter((a) => a.stage === 'new_application').length}</strong>
            </div>
            <div>
              <span className="review-summary-label">Screened</span>
              <strong>{applications.filter((a) => ['resume_screened', 'job_matched'].includes(a.stage)).length}</strong>
            </div>
            <div>
              <span className="review-summary-label">Interview</span>
              <strong>
                {
                  applications.filter((a) =>
                    ['interview_requested', 'interview_scheduled', 'interview_completed'].includes(a.stage)
                  ).length
                }
              </strong>
            </div>
            <div>
              <span className="review-summary-label">Closed</span>
              <strong>{applications.filter((a) => ['rejected', 'withdrawn'].includes(a.stage)).length}</strong>
            </div>
          </div>
          {message && <div className="review-message">{message}</div>}
        </article>
      </section>

      {error && <div className="review-hub-error">{error}</div>}

      <section className="review-tabs surface-card">
        <div className="review-tabs-row">
          {tabDefinitions.map((tab) => {
            const count = applications.filter((application) => tab.stages.includes(application.stage)).length;
            return (
              <button
                key={tab.key}
                type="button"
                className={`review-tab${applicationTab === tab.key ? ' is-active' : ''}`}
                onClick={() => setApplicationTab(tab.key)}
              >
                {tab.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {filteredApplications.length === 0 ? (
        <section className="review-empty surface-card">
          <FaSearch />
          <h2>No applications in this queue.</h2>
          <p>Switch stages or wait for the funnel to move.</p>
        </section>
      ) : (
        <section className="review-grid">
          {filteredApplications.map((application) => {
            const tone = getStageTone(application.stage);
            const fitScore = application.candidateRoleFit || application.matchScore || 0;

            return (
              <article key={application._id} className="review-card surface-card">
                <div className="review-card-head">
                  <div className="review-candidate">
                    <FaUserCircle />
                    <div>
                      <h3>{application.candidate?.name}</h3>
                      <span>{application.candidate?.email}</span>
                    </div>
                  </div>
                  <span className={`signal-chip ${tone}`}>
                    {stageLabels[application.stage] || application.stage}
                  </span>
                </div>

                <div className="review-card-meta">
                  <span>
                    <FaCalendarAlt /> Applied {formatDate(application.createdAt)}
                  </span>
                  <Link to={`/dashboard/recruiter/applications/${application._id}`}>
                    Review application
                  </Link>
                </div>

                <div className="review-fit-block">
                  <div className="review-fit-head">
                    <span>Candidate-role fit</span>
                    <strong>{fitScore}%</strong>
                  </div>
                  <div className="review-fit-track">
                    <div
                      className={`review-fit-bar tone-${tone}`}
                      style={{ width: `${Math.max(fitScore, 6)}%` }}
                    />
                  </div>
                </div>

                {(application.matchedSkills?.length > 0 || application.missingSkills?.length > 0) && (
                  <div className="review-skill-grid">
                    {application.matchedSkills?.length > 0 && (
                      <div>
                        <span className="review-skill-label">Matched skills</span>
                        <div className="review-chip-list">
                          {application.matchedSkills.slice(0, 4).map((skill) => (
                            <span key={skill} className="signal-chip positive">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {application.missingSkills?.length > 0 && (
                      <div>
                        <span className="review-skill-label">Missing skills</span>
                        <div className="review-chip-list">
                          {application.missingSkills.slice(0, 4).map((skill) => (
                            <span key={skill} className="signal-chip alert">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="review-card-actions">
                  {['new_application', 'resume_screened', 'job_matched'].includes(application.stage) && (
                    <Link
                      className="action-link ghost"
                      to={`/dashboard/recruiter/applications/${application._id}`}
                    >
                      <FaFileAlt /> Review packet
                    </Link>
                  )}

                  <Link
                    to={`/dashboard/recruiter/candidates/${application.candidate?._id}`}
                    className="action-link ghost"
                  >
                    Candidate profile
                  </Link>

                  {(application.stage === 'resume_screened' || application.stage === 'job_matched') && (
                    <>
                      <button
                        type="button"
                        className="action-link primary"
                        onClick={() => {
                          setCurrentApplication(application);
                          handleAcceptForInterview(application._id);
                        }}
                        disabled={processingAction}
                      >
                        <FaCheckCircle /> Accept for interview
                      </button>
                      <button
                        type="button"
                        className="action-link ghost"
                        onClick={() => handleRejectClick(application)}
                        disabled={processingAction}
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </>
                  )}

                  {application.stage === 'interview_requested' && (
                    <Link
                      to={`/dashboard/recruiter/schedule-interview/${application.candidate?._id}?jobId=${job._id}&applicationId=${application._id}`}
                      className="action-link secondary"
                    >
                      <FaCalendarPlus /> Schedule interview
                    </Link>
                  )}

                  {application.stage === 'interview_scheduled' && (
                    <div className="review-inline-note active">Interview already scheduled.</div>
                  )}

                  {application.stage === 'rejected' && (
                    <div className="review-inline-note alert">
                      {application.notes || 'Application was closed without additional notes.'}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <Modal
        show={showResumeModal}
        onHide={() => {
          setShowResumeModal(false);
          setParsedResumeData(null);
        }}
        dialogClassName="review-modal review-modal-large"
        centered
      >
        <Modal.Header closeButton className="review-modal-header">
          <Modal.Title>{currentApplication?.candidate?.name}'s resume signal</Modal.Title>
        </Modal.Header>
        <Modal.Body className="review-modal-body">
          {(!parsedResumeData && !currentApplication?.parsedResume) ? (
            <div className="review-parse-state">
              <FaMagic />
              <h3>Enhance this resume with AI signal.</h3>
              <p>
                Parse the resume to extract role fit, matched strengths, missing skills, and
                interview evidence for this role.
              </p>
              <button
                type="button"
                className="action-link primary"
                onClick={handleParseResume}
                disabled={processingResume}
              >
                {processingResume ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" /> Parsing...
                  </>
                ) : (
                  <>
                    <FaMagic /> Analyze with AI
                  </>
                )}
              </button>
            </div>
          ) : (
            <EnhancedResumeAnalysis
              enhancedAnalysis={
                parsedResumeData?.enhancedAnalysis || currentApplication?.parsedResume?.enhancedAnalysis
              }
              resumeSource={currentApplication?.resumeSource === 'job-specific' ? 'job-specific' : 'generic'}
            />
          )}
        </Modal.Body>
        <Modal.Footer className="review-modal-footer">
          <button
            type="button"
            className="action-link ghost"
            onClick={() => {
              setShowResumeModal(false);
              setParsedResumeData(null);
            }}
          >
            Close
          </button>
          {(parsedResumeData || currentApplication?.parsedResume) &&
            (currentApplication?.stage === 'resume_screened' || currentApplication?.stage === 'job_matched') && (
              <div className="review-modal-actions">
                <button
                  type="button"
                  className="action-link primary"
                  onClick={() => handleAcceptForInterview(currentApplication._id)}
                  disabled={processingAction}
                >
                  <FaCheckCircle /> Accept for interview
                </button>
                <button
                  type="button"
                  className="action-link ghost"
                  onClick={() => {
                    setShowResumeModal(false);
                    setParsedResumeData(null);
                    handleRejectClick(currentApplication);
                  }}
                  disabled={processingAction}
                >
                  <FaTimesCircle /> Reject
                </button>
              </div>
            )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        dialogClassName="review-modal"
        centered
      >
        <Modal.Header closeButton className="review-modal-header">
          <Modal.Title>Reject {currentApplication?.candidate?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="review-modal-body">
          <Form.Group>
            <Form.Label>Reason for rejection</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Add optional notes for why this candidate is not moving forward..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="review-modal-footer">
          <button type="button" className="action-link ghost" onClick={() => setShowRejectModal(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="action-link primary"
            onClick={handleRejectSubmit}
            disabled={processingAction}
          >
            {processingAction ? 'Processing...' : 'Confirm rejection'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default JobApplicationsPage;
