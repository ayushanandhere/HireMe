import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge, ProgressBar, Tabs, Tab, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaRobot, FaVideo, FaFileAlt, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaChartLine, FaCheck, FaTimes, FaCode, FaUserTie, FaInfoCircle, FaQuestionCircle, FaClipboardCheck, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { applicationService, buildAssetUrl, interviewService } from '../../services/api';
import openaiService from '../../services/openaiService';
import './InterviewBriefingRoom.css';

// Helper function to determine progress bar variant based on score
const getProgressBarVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'danger';
};

// Helper function to categorize skills (improved version)
const categorizeSkill = (skill) => {
  skill = skill.toLowerCase();
  if (['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'swift', 'kotlin', 'typescript'].some(lang => skill.includes(lang))) {
    return 'programming';
  }
  if (['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'laravel', 'rails', 'node.js', 'spring boot'].some(fw => skill.includes(fw))) {
    return 'framework';
  }
  if (['sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'firebase', 'dynamodb', 'redis', 'nosql', 'database'].some(db => skill.includes(db))) {
    return 'database';
  }
  if (['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'serverless', 'devops'].some(cl => skill.includes(cl))) {
    return 'cloud';
  }
  if (['git', 'jenkins', 'jira', 'agile', 'scrum', 'ci/cd', 'testing', 'postman', 'swagger'].some(tool => skill.includes(tool))) {
    return 'tool';
  }
  if (['communication', 'leadership', 'teamwork', 'problem-solving', 'critical', 'creativity'].some(soft => skill.includes(soft))) {
    return 'soft';
  }
  if (['rest', 'api', 'graphql', 'soap', 'microservices'].some(api => skill.includes(api))) {
    return 'api';
  }
  if (['mvc', 'architecture', 'design pattern', 'oop', 'functional'].some(arch => skill.includes(arch))) {
    return 'architecture';
  }
  return 'default';
};

const getScoreTone = (score) => {
  const value = Number(score) || 0;
  if (value >= 80) return 'positive';
  if (value >= 60) return 'active';
  if (value >= 40) return 'attention';
  return 'negative';
};

const markdownComponents = {
  h1: ({ children, ...props }) => <h1 className="markdown-h1" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="markdown-h2" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="markdown-h3" {...props}>{children}</h3>,
  h4: ({ children, ...props }) => <h4 className="markdown-h4" {...props}>{children}</h4>,
  h5: ({ children, ...props }) => <h5 className="markdown-h5" {...props}>{children}</h5>,
  h6: ({ children, ...props }) => <h6 className="markdown-h6" {...props}>{children}</h6>,
  p: ({ children, ...props }) => <p className="markdown-p" {...props}>{children}</p>,
  ul: ({ children, ...props }) => <ul className="markdown-ul" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="markdown-ol" {...props}>{children}</ol>,
  li: ({ children, ...props }) => {
    if (React.Children.count(children) === 1 && React.isValidElement(children) && children.type === 'p') {
      return <li className="markdown-li" {...props}>{children.props.children}</li>;
    }
    return <li className="markdown-li" {...props}>{children}</li>;
  },
  strong: ({ children, ...props }) => <strong className="markdown-strong" {...props}>{children}</strong>,
  em: ({ children, ...props }) => <em className="markdown-em" {...props}>{children}</em>,
  a: ({ children, ...props }) => <a className="markdown-a" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code className="markdown-code" {...props}>{children}</code>
    ) : (
      <pre className="markdown-pre">
        <code className="markdown-code-block" {...props}>{children}</code>
      </pre>
    ),
  blockquote: ({ children, ...props }) => <blockquote className="markdown-blockquote" {...props}>{children}</blockquote>,
  table: ({ children, ...props }) => <table className="markdown-table" {...props}>{children}</table>,
  thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  th: ({ children, ...props }) => <th className="markdown-th" {...props}>{children}</th>,
  td: ({ children, ...props }) => <td className="markdown-td" {...props}>{children}</td>,
};

const InterviewBriefingRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [responseMode, setResponseMode] = useState('normal');
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What are this candidate's key strengths based on their resume?",
    "Suggest specific technical questions for this candidate based on their claimed skills",
    "How should I address the skill gaps identified in the analysis?",
    "What behavioral questions would reveal if this candidate is a good cultural fit?",
    "Based on their experience, what challenging scenarios should I ask about?",
    "What are potential red flags I should watch for in this interview?",
    "How does this candidate's experience align with our job requirements?",
    "What questions should I ask to verify their proficiency in the required skills?",
    "Can you suggest a structured interview plan for this candidate?"
  ]);
  
  // State for resume analysis data
  const [resumeAnalysisData, setResumeAnalysisData] = useState(null);

  // Fetch interview data and initialize AI assistant
  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true);
        
        // Fetch interview details
        const response = await interviewService.getInterviewById(interviewId);
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to load interview details');
        }
        
        setInterview(response.data);
        
        // If there's an application ID, fetch the resume analysis data
        if (response.data.applicationId && response.data.applicationId._id) {
          try {
            const applicationId = response.data.applicationId._id;
            console.log(`Fetching resume analysis data for application ${applicationId}`);
            
            const analysisData = await applicationService.getResumeAnalysis(applicationId);
            console.log('Resume analysis data:', analysisData);
            
            if (analysisData.success && analysisData.data) {
              setResumeAnalysisData(analysisData.data);
              console.log('Resume analysis data set successfully');
            } else {
              console.error('Failed to fetch resume analysis data:', analysisData.message);
            }
          } catch (analysisErr) {
            console.error('Error fetching resume analysis:', analysisErr);
            // Don't throw here, just log the error and continue
          }
        } else {
          console.log('No application ID found, cannot fetch resume analysis data');
        }
        
        // Initialize AI assistant with context
        const contextResponse = await openaiService.getInitialContext(interviewId);
        
        if (contextResponse.success) {
          // Add the AI's initial message
          setMessages([
            {
              role: 'assistant',
              content: contextResponse.data.initialMessage || 'Hello! I\'m your AI interview assistant. I can help you prepare for your upcoming interview with this candidate. What would you like to know?'
            }
          ]);
        } else {
          // Add a fallback message if context fetching fails
          setMessages([
            {
              role: 'assistant',
              content: 'Hello! I\'m your AI interview assistant. I can help you prepare for your upcoming interview. What would you like to know about the candidate or the position?'
            }
          ]);
        }
        
        setInitializing(false);
      } catch (err) {
        console.error('Error fetching interview data:', err);
        setError(err.message || 'Failed to load interview details. Please try again later.');
        setInitializing(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewData();
  }, [interviewId]);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Format date nicely
  const formatDateTime = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle sending a message to the AI assistant
  const submitMessage = async (rawMessage) => {
    if (!rawMessage.trim() || sendingMessage || initializing || !interview) return;

    const userMessage = rawMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: userMessage }
    ]);
    
    setSendingMessage(true);
    
    try {
      // Get candidate and job IDs from interview data
      const candidateId = interview.candidate?._id;
      const jobId = interview.applicationId?.job;
      
      // Send message to AI assistant
      const response = await openaiService.sendMessage(
        userMessage, 
        interviewId,
        candidateId,
        jobId,
        responseMode
      );
      
      if (response.success) {
        // Add AI response to chat with the response mode
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            role: 'assistant', 
            content: response.data.message,
            mode: response.data.mode || responseMode 
          }
        ]);
      } else {
        // Add error message to chat
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            role: 'assistant', 
            content: 'I apologize, but I encountered an error processing your request. Please try again.' 
          }
        ]);
        setError(response.message || 'Failed to get response from AI assistant');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error processing your request. Please try again.' 
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await submitMessage(inputMessage);
  };

  const handleSuggestedQuestion = async (question) => {
    await submitMessage(question);
  };
  
  // Handle proceeding to the video call
  const handleProceedToCall = () => {
    navigate(`/interview/${interviewId}/meeting`);
  };
  
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <h3>Preparing your interview briefing...</h3>
        <p className="text-muted">Loading candidate information and interview context</p>
      </Container>
    );
  }
  
  if (error && !interview) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Interview</Alert.Heading>
          <p>{error}</p>
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate('/dashboard/recruiter/interviews')}
        >
          <FaArrowLeft className="me-2" /> Back to Interviews
        </Button>
      </Container>
    );
  }
  
  return (
    <div className="interview-briefing-room">
      <div className="briefing-room-header">
        <Container>
          <div className="briefing-room-topbar">
            <div className="briefing-room-title-group">
              <FaRobot className="header-icon me-3" />
              <div>
                <span className="eyebrow eyebrow-dark">Interviewer command deck</span>
                <h1 className="header-title">AI Interview Briefing Room</h1>
                <p className="header-subtitle">Prepare for your interview with AI assistance</p>
              </div>
            </div>
            <div className="briefing-room-actions">
              <Link 
                to="/dashboard/recruiter/interviews" 
                className="back-button"
              >
                <FaArrowLeft className="me-2" /> Back to Interviews
              </Link>
              <Button 
                className="proceed-button"
                onClick={handleProceedToCall}
              >
                <FaVideo className="me-2" /> Proceed to Video Call
              </Button>
            </div>
          </div>
        </Container>
      </div>
      
      <Container className="briefing-room-container">
        <Row>
          <Col md={4} lg={3}>
            <Tabs 
              activeKey={activeTab} 
              onSelect={(k) => setActiveTab(k)} 
              id="candidate-info-tabs" 
              className="mb-3 nav-tabs-custom"
            >
              <Tab eventKey="profile" title={<><FaUser className="me-1" /> Profile</>}>
                <Card className="candidate-info-card">
                  <Card.Body>
                    <div className="candidate-header">
                      <div className="candidate-avatar">
                        {interview?.candidate?.profilePicture ? (
                          <img 
                            src={buildAssetUrl(interview.candidate.profilePicture)} 
                            alt={interview.candidate.name} 
                            className="candidate-avatar-image"
                          />
                        ) : (
                          <FaUser className="candidate-icon" />
                        )}
                      </div>
                      <h3 className="candidate-name">{interview?.candidate?.name || 'Candidate'}</h3>
                      <p className="candidate-email">{interview?.candidate?.email || 'No email available'}</p>
                      {interview?.candidate?.currentPosition && (
                        <p className="candidate-position">
                          <FaUserTie className="candidate-position-icon" />
                          {interview.candidate.currentPosition}
                        </p>
                      )}
                    </div>
                    
                    <div className="info-section">
                      <h5 className="section-title"><FaCalendarAlt className="me-2" />Interview Details</h5>
                      <p className="info-item">
                        <strong>Position:</strong> {interview?.position?.title || 'N/A'}
                      </p>
                      <p className="info-item">
                        <strong>Scheduled:</strong> {interview?.scheduledDateTime ? formatDateTime(interview.scheduledDateTime) : 'N/A'}
                      </p>
                      <p className="info-item">
                        <strong>Duration:</strong> {interview?.duration || 60} minutes
                      </p>
                      <p className="info-item">
                        <strong>Status:</strong> <Badge bg="success">{interview?.status || 'Scheduled'}</Badge>
                      </p>
                    </div>
                    
                    {interview?.candidate?.skills && (
                      <div className="info-section">
                        <h5 className="section-title"><FaCode className="me-2" />Skills</h5>
                        <div className="skills-container">
                          {interview.candidate.skills.split(',').map((skill, index) => {
                            const category = categorizeSkill(skill.trim());
                            return (
                              <OverlayTrigger
                                key={index}
                                placement="top"
                                overlay={<Tooltip>Category: {category.charAt(0).toUpperCase() + category.slice(1)}</Tooltip>}
                              >
                                <Badge 
                                  className={`skill-badge skill-badge-${category}`}
                                >
                                  {skill.trim()}
                                </Badge>
                              </OverlayTrigger>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {interview?.candidate?.experience && (
                      <div className="info-section">
                        <h5 className="section-title"><FaUserTie className="me-2" />Experience</h5>
                        <p className="info-item">{interview.candidate.experience}</p>
                      </div>
                    )}
                    
                    <div className="action-buttons">
                      {interview?.candidate?.resumePath && (
                        <a 
                          href={buildAssetUrl(interview.candidate.resumePath)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="briefing-utility-button briefing-utility-button-secondary btn w-100 mb-2"
                        >
                          <FaFileAlt className="me-2" /> View Resume
                        </a>
                      )}
                      <Button 
                        className="briefing-utility-button briefing-utility-button-primary w-100"
                        onClick={handleProceedToCall}
                      >
                        <FaVideo className="me-2" /> Start Interview
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>
              
              <Tab eventKey="analysis" title={<><FaChartLine className="me-1" /> Analysis</>}>
                <Card className="candidate-info-card">
                  <Card.Body>
                    {interview?.applicationId ? (
                      <>
                        {/* Overall Candidate Fit Score with Badge */}
                        <div className="candidate-fit-summary">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="mb-0">Candidate Fit</h4>
                            <Badge 
                              pill 
                              bg={getProgressBarVariant(interview?.applicationId?.candidateRoleFit || 0)}
                              className={`analysis-score-badge tone-${getScoreTone(interview?.applicationId?.candidateRoleFit || 0)}`}
                            >
                              {interview?.applicationId?.candidateRoleFit || 0}%
                            </Badge>
                          </div>
                          <ProgressBar 
                            now={interview?.applicationId?.candidateRoleFit || 0}
                            variant={getProgressBarVariant(interview?.applicationId?.candidateRoleFit || 0)}
                            className="analysis-progress analysis-progress-lg"
                          />
                          {/* Debug information */}
                          <div className="analysis-debug">
                            <details>
                              <summary className="analysis-debug-summary">Debug Information</summary>
                              <div className="analysis-debug-content">
                                <p><strong>Application ID:</strong> {interview?.applicationId?._id}</p>
                                <p><strong>Candidate Role Fit:</strong> {interview?.applicationId?.candidateRoleFit}</p>
                                <p><strong>Skills Match:</strong> {interview?.applicationId?.skillsMatch}</p>
                                <p><strong>Experience Relevance:</strong> {interview?.applicationId?.experienceRelevance}</p>
                                <p><strong>ATS Score:</strong> {interview?.applicationId?.atsScore}</p>
                                <p><strong>Resume Analysis Data:</strong> {resumeAnalysisData ? 'Available' : 'Not Available'}</p>
                              </div>
                            </details>
                          </div>
                        </div>
                        
                        {/* Resume Parsing Results */}
                        <div className="info-section resume-parsing-results">
                          <h5 className="section-title"><FaFileAlt className="me-2" />Resume Analysis</h5>
                          
                          {/* Skills Match */}
                          <div className="analysis-stat-card mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="analysis-stat-title">Skills Match</h6>
                              <Badge 
                                pill 
                                bg={getProgressBarVariant(interview?.applicationId?.skillsMatch || 0)}
                                className={`analysis-score-badge tone-${getScoreTone(interview?.applicationId?.skillsMatch || 0)}`}
                              >
                                {interview?.applicationId?.skillsMatch || 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={interview?.applicationId?.skillsMatch || 0}
                              variant={getProgressBarVariant(interview?.applicationId?.skillsMatch || 0)}
                              className="analysis-progress"
                            />
                          </div>
                          
                          {/* Experience Relevance */}
                          <div className="analysis-stat-card mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="analysis-stat-title">Experience Relevance</h6>
                              <Badge 
                                pill 
                                bg={getProgressBarVariant(interview?.applicationId?.experienceRelevance || 0)}
                                className={`analysis-score-badge tone-${getScoreTone(interview?.applicationId?.experienceRelevance || 0)}`}
                              >
                                {interview?.applicationId?.experienceRelevance || 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={interview?.applicationId?.experienceRelevance || 0}
                              variant={getProgressBarVariant(interview?.applicationId?.experienceRelevance || 0)}
                              className="analysis-progress"
                            />
                          </div>
                          
                          {/* ATS Score */}
                          <div className="analysis-stat-card mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="analysis-stat-title">ATS Score</h6>
                              <Badge 
                                pill 
                                bg={getProgressBarVariant(interview?.applicationId?.atsScore || 0)}
                                className={`analysis-score-badge tone-${getScoreTone(interview?.applicationId?.atsScore || 0)}`}
                              >
                                {interview?.applicationId?.atsScore || 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={interview?.applicationId?.atsScore || 0}
                              variant={getProgressBarVariant(interview?.applicationId?.atsScore || 0)}
                              className="analysis-progress"
                            />
                          </div>
                          
                          {/* Matched Skills */}
                          {interview?.applicationId?.matchedSkills && interview.applicationId.matchedSkills.length > 0 && (
                            <div className="analysis-skill-card analysis-skill-card-matched mb-3">
                              <h6 className="analysis-skill-card-title analysis-skill-card-title-matched">
                                <FaCheckCircle className="me-2" />
                                Matched Skills
                              </h6>
                              <div className="analysis-skill-cloud">
                                {interview.applicationId.matchedSkills.map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    className="analysis-tag analysis-tag-matched"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Missing Skills */}
                          {interview?.applicationId?.missingSkills && interview.applicationId.missingSkills.length > 0 && (
                            <div className="analysis-skill-card analysis-skill-card-missing">
                              <h6 className="analysis-skill-card-title analysis-skill-card-title-missing">
                                <FaExclamationTriangle className="me-2" />
                                Missing Skills
                              </h6>
                              <div className="analysis-skill-cloud">
                                {interview.applicationId.missingSkills.map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    className="analysis-tag analysis-tag-missing"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Skills Assessment */}
                        <div className="info-section">
                          <h5 className="section-title"><FaChartLine className="me-2" />Skills Assessment</h5>
                          
                          <div className="analysis-columns">
                            <div className="analysis-column">
                              <h6 className="text-success d-flex align-items-center">
                                <FaCheck className="me-2" /> Matched Skills
                              </h6>
                              <div className="skills-container">
                                {interview.applicationId.matchedSkills && interview.applicationId.matchedSkills.length > 0 ? (
                                  interview.applicationId.matchedSkills.map((skill, index) => {
                                    const category = categorizeSkill(skill);
                                    return (
                                      <OverlayTrigger
                                        key={index}
                                        placement="top"
                                        overlay={<Tooltip>Matched: {skill}</Tooltip>}
                                      >
                                        <Badge 
                                          className={`skill-badge skill-badge-${category}`}
                                        >
                                          {skill}
                                        </Badge>
                                      </OverlayTrigger>
                                    );
                                  })
                                ) : (
                                  <p className="text-muted small">No matched skills found</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="analysis-column">
                              <h6 className="text-danger d-flex align-items-center">
                                <FaTimes className="me-2" /> Missing Skills
                              </h6>
                              <div className="skills-container">
                                {interview.applicationId.missingSkills && interview.applicationId.missingSkills.length > 0 ? (
                                  interview.applicationId.missingSkills.map((skill, index) => (
                                    <OverlayTrigger
                                      key={index}
                                      placement="top"
                                      overlay={<Tooltip>Missing: {skill}</Tooltip>}
                                    >
                                      <Badge 
                                        className="skill-badge skill-badge-missing"
                                      >
                                        {skill}
                                      </Badge>
                                    </OverlayTrigger>
                                  ))
                                ) : (
                                  <p className="text-muted small">No missing skills identified</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Detailed Scores */}
                        <div className="info-section">
                          <h5 className="section-title"><FaChartLine className="me-2" />Detailed Scores</h5>
                          
                          <div className="score-grid">
                            {interview.applicationId.skillsMatch !== undefined && (
                              <div className="score-item score-item-card">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="score-label">Skills Match</span>
                                  <span className={`score-value tone-${getScoreTone(interview.applicationId.skillsMatch)}`}>
                                    {interview.applicationId.skillsMatch}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={interview.applicationId.skillsMatch} 
                                  variant={getProgressBarVariant(interview.applicationId.skillsMatch)}
                                  className="analysis-progress"
                                />
                              </div>
                            )}
                            
                            {interview.applicationId.experienceRelevance !== undefined && (
                              <div className="score-item score-item-card">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="score-label">Experience</span>
                                  <span className={`score-value tone-${getScoreTone(interview.applicationId.experienceRelevance)}`}>
                                    {interview.applicationId.experienceRelevance}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={interview.applicationId.experienceRelevance} 
                                  variant={getProgressBarVariant(interview.applicationId.experienceRelevance)}
                                  className="analysis-progress"
                                />
                              </div>
                            )}
                            
                            {interview.applicationId.atsScore !== undefined && (
                              <div className="score-item score-item-card">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="score-label">ATS Score</span>
                                  <span className={`score-value tone-${getScoreTone(interview.applicationId.atsScore)}`}>
                                    {interview.applicationId.atsScore}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={interview.applicationId.atsScore} 
                                  variant={getProgressBarVariant(interview.applicationId.atsScore)}
                                  className="analysis-progress"
                                />
                              </div>
                            )}
                            
                            <div className="score-item score-item-card">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="score-label">Overall Fit</span>
                                <span className={`score-value tone-${getScoreTone(interview.applicationId.candidateRoleFit || 0)}`}>
                                  {interview.applicationId.candidateRoleFit || 0}%
                                </span>
                              </div>
                              <ProgressBar 
                                now={interview.applicationId.candidateRoleFit || 0} 
                                variant={getProgressBarVariant(interview.applicationId.candidateRoleFit || 0)}
                                className="analysis-progress"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <FaChartLine className="empty-state-icon mb-3" />
                        <p>No application analysis available for this candidate.</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
              
              <Tab eventKey="job" title={<><FaBriefcase className="me-1" /> Job</>}>
                <Card className="candidate-info-card">
                  <Card.Body>
                    {interview?.applicationId?.job ? (
                      <>
                        <div className="job-header">
                          <FaBriefcase className="job-icon" />
                          <h4 className="job-title">{interview.applicationId.job.title}</h4>
                          <div className="job-company">
                            <FaBuilding className="me-1" /> {interview.applicationId.job.company}
                          </div>
                          {interview.applicationId.job.location && (
                            <div className="job-location">
                              <FaMapMarkerAlt className="me-1" /> {interview.applicationId.job.location}
                            </div>
                          )}
                        </div>
                        
                        <div className="info-section">
                          <h5 className="section-title">Job Details</h5>
                          <p className="info-item">
                            <strong>Type:</strong> {interview.applicationId.job.type || 'Not specified'}
                          </p>
                          <p className="info-item">
                            <strong>Experience Level:</strong> {interview.applicationId.job.experienceLevel || 'Not specified'}
                          </p>
                          
                          {interview.applicationId.job.skills && interview.applicationId.job.skills.length > 0 && (
                            <div className="mt-3">
                              <h6>Required Skills</h6>
                              <div className="skills-container">
                                {Array.isArray(interview.applicationId.job.skills) ? 
                                  interview.applicationId.job.skills.map((skill, index) => (
                                    <Badge key={index} className="skill-badge skill-badge-job">{skill}</Badge>
                                  )) : 
                                  interview.applicationId.job.skills.split(',').map((skill, index) => (
                                    <Badge key={index} className="skill-badge skill-badge-job">{skill.trim()}</Badge>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {interview.applicationId.job.description && (
                          <div className="info-section">
                            <h5 className="section-title">Job Description</h5>
                            <div className="job-description">
                              {interview.applicationId.job.description}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <FaBriefcase className="empty-state-icon mb-3" />
                        <p>No detailed job information available.</p>
                        <p className="position-info">
                          <strong>Position:</strong> {interview?.position?.title || 'N/A'}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Col>
          
          <Col md={8} lg={9}>
            <Card className="chat-card">
              <Card.Header className="chat-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <h3 className="mb-0">
                      <FaRobot className="me-2" /> AI Interview Assistant
                    </h3>
                  </div>
                  <OverlayTrigger
                    placement="left"
                    overlay={
                      <Tooltip>
                        This AI assistant uses the candidate's resume, job description, and application analysis to help you prepare for the interview.
                      </Tooltip>
                    }
                  >
                    <Button variant="link" className="chat-header-icon-button p-0">
                      <FaInfoCircle />
                    </Button>
                  </OverlayTrigger>
                </div>
              </Card.Header>
              <Card.Body className="chat-body">
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}
                
                {initializing ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status" size="sm" className="me-2" />
                    <span>Initializing AI assistant...</span>
                  </div>
                ) : (
                  <div className="chat-messages">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                      >
                        <div className="message-icon">
                          {message.role === 'user' ? <FaUser /> : <FaRobot />}
                        </div>
                        <div className="message-content">
                          <div className="message-text">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {message.role === 'assistant' && message.mode && (
                              <span className={`mode-indicator ${message.mode === 'deep' ? 'deep' : ''}`}>
                                {message.mode === 'deep' ? 'Deep' : 'Normal'} response
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="chat-footer">
                <div className="chat-footer-top">
                  <div className="response-mode-toggle">
                    <div 
                      className={`toggle-container ${responseMode === 'deep' ? 'active' : ''}`}
                      onClick={() => setResponseMode(responseMode === 'normal' ? 'deep' : 'normal')}
                    >
                      <div className="toggle-button" />
                      <div className="toggle-label normal-text">Normal</div>
                      <div className="toggle-label deep-text">Deep</div>
                    </div>
                  </div>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        Toggle between Normal mode (concise answers) and Deep mode (detailed explanations)
                      </Tooltip>
                    }
                  >
                    <Button variant="link" className="toggle-help-button p-0">
                      <FaQuestionCircle />
                    </Button>
                  </OverlayTrigger>
                </div>
                <Form onSubmit={handleSendMessage}>
                  <div className="input-group chat-input-wrap">
                    <Form.Control
                      type="text"
                      placeholder="Ask about the candidate, job requirements, interview strategies..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={sendingMessage || initializing}
                      className="chat-input"
                    />
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={sendingMessage || initializing || !inputMessage.trim()}
                      className="chat-submit-button"
                    >
                      {sendingMessage ? (
                        <Spinner animation="border" size="sm" className="chat-submit-spinner" />
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                            <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                          </svg>
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
                <div className="suggested-actions">
                  {suggestedQuestions.slice(0, 2).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={sendingMessage || initializing}
                      className="suggested-chip"
                    >
                      {question.length > 30 ? question.substring(0, 30) + '...' : question}
                    </Button>
                  ))}
                  <div className="suggested-actions-more">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="suggested-more-button"
                      onClick={() => {
                        // Rotate the suggested questions
                        const rotated = [...suggestedQuestions];
                        rotated.push(rotated.shift());
                        setSuggestedQuestions(rotated);
                      }}
                      disabled={sendingMessage || initializing}
                    >
                      <FaClipboardCheck className="me-1" /> More suggestions
                    </Button>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InterviewBriefingRoom;
