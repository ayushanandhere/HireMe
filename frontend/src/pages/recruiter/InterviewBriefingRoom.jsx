import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge, ProgressBar, Tabs, Tab, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaPaperPlane, FaRobot, FaVideo, FaFileAlt, FaBriefcase, FaGraduationCap, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaChartLine, FaCheck, FaTimes, FaLightbulb, FaCode, FaUserTie, FaInfoCircle, FaQuestionCircle, FaStar, FaClipboardCheck, FaComments, FaCheckCircle, FaExclamationTriangle, FaBrain } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { interviewService } from '../../services/api';
import openaiService from '../../services/openaiService';
import './InterviewBriefingRoom.css';

// Helper function to determine progress bar variant based on score
const getProgressBarVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'danger';
};

// Helper function to get a color for skill badges based on category
const getSkillBadgeColor = (category) => {
  const categories = {
    'programming': { bg: '#4361ee', text: 'white' },
    'framework': { bg: '#00b4d8', text: 'white' },
    'database': { bg: '#6c757d', text: 'white' },
    'cloud': { bg: '#343a40', text: 'white' },
    'tool': { bg: '#4cc9f0', text: 'white' },
    'soft': { bg: '#ff9e00', text: 'white' },
    'api': { bg: '#00afb9', text: 'white' },
    'architecture': { bg: '#7209b7', text: 'white' },
    'default': { bg: '#4895ef', text: 'white' }
  };
  return categories[category] || categories.default;
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
            
            const analysisResponse = await fetch(`http://localhost:5000/api/applications/${applicationId}/resume-analysis`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            const analysisData = await analysisResponse.json();
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
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sendingMessage) return;
    
    const userMessage = inputMessage.trim();
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
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaRobot className="header-icon me-3" />
              <div>
                <h1 className="header-title">AI Interview Briefing Room</h1>
                <p className="header-subtitle">Prepare for your interview with AI assistance</p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <Link 
                to="/dashboard/recruiter/interviews" 
                className="back-button"
                style={{
                  background: 'white',
                  color: '#6a11cb',
                  border: '1px solid #6a11cb',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(106, 17, 203, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                <FaArrowLeft className="me-2" /> Back to Interviews
              </Link>
              <Button 
                variant="success" 
                className="proceed-button"
                onClick={handleProceedToCall}
                style={{
                  background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(106, 17, 203, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
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
                            src={`http://localhost:5000${interview.candidate.profilePicture}`} 
                            alt={interview.candidate.name} 
                            className="rounded-circle" 
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                        ) : (
                          <FaUser className="candidate-icon" />
                        )}
                      </div>
                      <h3 className="candidate-name">{interview?.candidate?.name || 'Candidate'}</h3>
                      <p className="candidate-email">{interview?.candidate?.email || 'No email available'}</p>
                      {interview?.candidate?.currentPosition && (
                        <p className="candidate-position">
                          <FaUserTie className="me-1" style={{ fontSize: '0.8rem' }} />
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
                                  className="skill-badge"
                                  style={{
                                    backgroundColor: getSkillBadgeColor(category).bg,
                                    color: getSkillBadgeColor(category).text,
                                    border: 'none',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
                                  }}
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
                          href={`http://localhost:5000${interview.candidate.resumePath}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn w-100 mb-2"
                          style={{
                            background: 'white',
                            color: '#6a11cb',
                            border: '1px solid #6a11cb',
                            borderRadius: '50px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(106, 17, 203, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                          }}
                        >
                          <FaFileAlt className="me-2" /> View Resume
                        </a>
                      )}
                      <Button 
                        variant="success" 
                        className="w-100"
                        onClick={handleProceedToCall}
                        style={{
                          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                          border: 'none',
                          borderRadius: '50px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(106, 17, 203, 0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
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
                              style={{ 
                                fontSize: '1rem', 
                                padding: '8px 16px',
                                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                                fontWeight: '600'
                              }}
                            >
                              {interview?.applicationId?.candidateRoleFit || 0}%
                            </Badge>
                          </div>
                          <ProgressBar 
                            now={interview?.applicationId?.candidateRoleFit || 0}
                            variant={getProgressBarVariant(interview?.applicationId?.candidateRoleFit || 0)}
                            style={{ height: '10px', borderRadius: '5px', marginBottom: '20px' }}
                          />
                          {/* Debug information */}
                          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                            <details>
                              <summary style={{ cursor: 'pointer', fontWeight: '500' }}>Debug Information</summary>
                              <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
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
                          <div className="resume-stats-card mb-3" style={{ 
                            borderRadius: '12px',
                            padding: '15px',
                            border: '1px solid rgba(106, 17, 203, 0.1)',
                            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)',
                            background: 'white'
                          }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 style={{ margin: 0, fontWeight: '600' }}>Skills Match</h6>
                              <Badge 
                                pill 
                                bg={getProgressBarVariant(interview?.applicationId?.skillsMatch || 0)}
                                style={{ padding: '5px 10px' }}
                              >
                                {interview?.applicationId?.skillsMatch || 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={interview?.applicationId?.skillsMatch || 0}
                              variant={getProgressBarVariant(interview?.applicationId?.skillsMatch || 0)}
                              style={{ height: '8px', borderRadius: '4px', marginBottom: '10px' }}
                            />
                          </div>
                          
                          {/* Experience Relevance */}
                          <div className="resume-stats-card mb-3" style={{ 
                            borderRadius: '12px',
                            padding: '15px',
                            border: '1px solid rgba(106, 17, 203, 0.1)',
                            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)',
                            background: 'white'
                          }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 style={{ margin: 0, fontWeight: '600' }}>Experience Relevance</h6>
                              <Badge 
                                pill 
                                bg={getProgressBarVariant(interview?.applicationId?.experienceRelevance || 0)}
                                style={{ padding: '5px 10px' }}
                              >
                                {interview?.applicationId?.experienceRelevance || 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={interview?.applicationId?.experienceRelevance || 0}
                              variant={getProgressBarVariant(interview?.applicationId?.experienceRelevance || 0)}
                              style={{ height: '8px', borderRadius: '4px', marginBottom: '10px' }}
                            />
                          </div>
                          
                          {/* ATS Score */}
                          <div className="resume-stats-card mb-3" style={{ 
                            borderRadius: '12px',
                            padding: '15px',
                            border: '1px solid rgba(106, 17, 203, 0.1)',
                            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)',
                            background: 'white'
                          }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 style={{ margin: 0, fontWeight: '600' }}>ATS Score</h6>
                              <Badge 
                                pill 
                                bg={getProgressBarVariant(interview?.applicationId?.atsScore || 0)}
                                style={{ padding: '5px 10px' }}
                              >
                                {interview?.applicationId?.atsScore || 0}%
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={interview?.applicationId?.atsScore || 0}
                              variant={getProgressBarVariant(interview?.applicationId?.atsScore || 0)}
                              style={{ height: '8px', borderRadius: '4px', marginBottom: '10px' }}
                            />
                          </div>
                          
                          {/* Matched Skills */}
                          {interview?.applicationId?.matchedSkills && interview.applicationId.matchedSkills.length > 0 && (
                            <div className="matched-skills-card mb-3" style={{ 
                              borderRadius: '12px',
                              padding: '15px',
                              border: '1px solid rgba(106, 17, 203, 0.1)',
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)',
                              background: 'rgba(76, 175, 80, 0.1)'
                            }}>
                              <h6 style={{ color: '#4caf50', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <FaCheckCircle className="me-2" />
                                Matched Skills
                              </h6>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {interview.applicationId.matchedSkills.map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    bg="success" 
                                    style={{ padding: '6px 12px', fontWeight: '500' }}
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Missing Skills */}
                          {interview?.applicationId?.missingSkills && interview.applicationId.missingSkills.length > 0 && (
                            <div className="missing-skills-card" style={{ 
                              borderRadius: '12px',
                              padding: '15px',
                              border: '1px solid rgba(106, 17, 203, 0.1)',
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)',
                              background: 'rgba(244, 67, 54, 0.05)'
                            }}>
                              <h6 style={{ color: '#f44336', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <FaExclamationTriangle className="me-2" />
                                Missing Skills
                              </h6>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {interview.applicationId.missingSkills.map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    bg="danger" 
                                    style={{ padding: '6px 12px', fontWeight: '500' }}
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
                          
                          <div className="d-flex justify-content-between mb-3">
                            <div style={{ width: '48%' }}>
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
                                          className="skill-badge"
                                          style={{
                                            backgroundColor: getSkillBadgeColor(category).bg,
                                            color: getSkillBadgeColor(category).text,
                                            border: 'none',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                          }}
                                          onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                                          }}
                                          onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
                                          }}
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
                            
                            <div style={{ width: '48%' }}>
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
                                        className="skill-badge"
                                        style={{
                                          backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                          color: '#dc3545',
                                          border: '1px solid rgba(220, 53, 69, 0.2)',
                                          transition: 'all 0.2s ease',
                                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.transform = 'translateY(-2px)';
                                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.05)';
                                        }}
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
                          
                          <div className="score-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {interview.applicationId.skillsMatch !== undefined && (
                              <div className="score-item" style={{ 
                                padding: '12px', 
                                borderRadius: '8px', 
                                background: 'white',
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(0, 0, 0, 0.05)'
                              }}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span style={{ fontWeight: '500' }}>Skills Match</span>
                                  <span className="score-value" style={{ 
                                    fontWeight: '600', 
                                    color: getProgressBarVariant(interview.applicationId.skillsMatch) === 'success' ? '#28a745' : 
                                           getProgressBarVariant(interview.applicationId.skillsMatch) === 'info' ? '#17a2b8' : 
                                           getProgressBarVariant(interview.applicationId.skillsMatch) === 'warning' ? '#ffc107' : '#dc3545' 
                                  }}>
                                    {interview.applicationId.skillsMatch}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={interview.applicationId.skillsMatch} 
                                  variant={getProgressBarVariant(interview.applicationId.skillsMatch)}
                                  style={{ height: '8px', borderRadius: '4px' }}
                                />
                              </div>
                            )}
                            
                            {interview.applicationId.experienceRelevance !== undefined && (
                              <div className="score-item" style={{ 
                                padding: '12px', 
                                borderRadius: '8px', 
                                background: 'white',
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(0, 0, 0, 0.05)'
                              }}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span style={{ fontWeight: '500' }}>Experience</span>
                                  <span className="score-value" style={{ 
                                    fontWeight: '600', 
                                    color: getProgressBarVariant(interview.applicationId.experienceRelevance) === 'success' ? '#28a745' : 
                                           getProgressBarVariant(interview.applicationId.experienceRelevance) === 'info' ? '#17a2b8' : 
                                           getProgressBarVariant(interview.applicationId.experienceRelevance) === 'warning' ? '#ffc107' : '#dc3545' 
                                  }}>
                                    {interview.applicationId.experienceRelevance}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={interview.applicationId.experienceRelevance} 
                                  variant={getProgressBarVariant(interview.applicationId.experienceRelevance)}
                                  style={{ height: '8px', borderRadius: '4px' }}
                                />
                              </div>
                            )}
                            
                            {interview.applicationId.atsScore !== undefined && (
                              <div className="score-item" style={{ 
                                padding: '12px', 
                                borderRadius: '8px', 
                                background: 'white',
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(0, 0, 0, 0.05)'
                              }}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span style={{ fontWeight: '500' }}>ATS Score</span>
                                  <span className="score-value" style={{ 
                                    fontWeight: '600', 
                                    color: getProgressBarVariant(interview.applicationId.atsScore) === 'success' ? '#28a745' : 
                                           getProgressBarVariant(interview.applicationId.atsScore) === 'info' ? '#17a2b8' : 
                                           getProgressBarVariant(interview.applicationId.atsScore) === 'warning' ? '#ffc107' : '#dc3545' 
                                  }}>
                                    {interview.applicationId.atsScore}%
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={interview.applicationId.atsScore} 
                                  variant={getProgressBarVariant(interview.applicationId.atsScore)}
                                  style={{ height: '8px', borderRadius: '4px' }}
                                />
                              </div>
                            )}
                            
                            <div className="score-item" style={{ 
                              padding: '12px', 
                              borderRadius: '8px', 
                              background: 'white',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                              border: '1px solid rgba(0, 0, 0, 0.05)'
                            }}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span style={{ fontWeight: '500' }}>Overall Fit</span>
                                <span className="score-value" style={{ 
                                  fontWeight: '600', 
                                  color: getProgressBarVariant(interview.applicationId.candidateRoleFit || 0) === 'success' ? '#28a745' : 
                                         getProgressBarVariant(interview.applicationId.candidateRoleFit || 0) === 'info' ? '#17a2b8' : 
                                         getProgressBarVariant(interview.applicationId.candidateRoleFit || 0) === 'warning' ? '#ffc107' : '#dc3545' 
                                }}>
                                  {interview.applicationId.candidateRoleFit || 0}%
                                </span>
                              </div>
                              <ProgressBar 
                                now={interview.applicationId.candidateRoleFit || 0} 
                                variant={getProgressBarVariant(interview.applicationId.candidateRoleFit || 0)}
                                style={{ height: '8px', borderRadius: '4px' }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <FaChartLine className="mb-3" style={{ fontSize: '2rem', opacity: 0.3 }} />
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
                                    <Badge key={index} bg="secondary" className="skill-badge">{skill}</Badge>
                                  )) : 
                                  interview.applicationId.job.skills.split(',').map((skill, index) => (
                                    <Badge key={index} bg="secondary" className="skill-badge">{skill.trim()}</Badge>
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
                        <FaBriefcase className="mb-3" style={{ fontSize: '2rem', opacity: 0.3 }} />
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
                    <Button variant="link" className="p-0 text-muted">
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
                          <div className="message-text" style={{ fontSize: '0.95rem', lineHeight: '1.3' }}>
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Special styling for user messages
                                ...(message.role === 'user' ? {
                                  p: ({node, children, ...props}) => <p style={{ color: 'white', marginTop: '0.2rem', marginBottom: '0.2rem', fontWeight: '500' }} {...props}>{children}</p>,
                                  strong: ({node, children, ...props}) => <strong style={{ color: 'white', fontWeight: '700' }} {...props}>{children}</strong>,
                                  em: ({node, children, ...props}) => <em style={{ color: 'white', fontStyle: 'italic' }} {...props}>{children}</em>,
                                  a: ({node, children, ...props}) => <a style={{ color: '#f0f0f0', textDecoration: 'underline', fontWeight: '600' }} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                                  h1: ({node, children, ...props}) => <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginTop: '0.4rem', marginBottom: '0.3rem' }} {...props}>{children}</h1>,
                                  h2: ({node, children, ...props}) => <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.4rem', marginBottom: '0.3rem' }} {...props}>{children}</h2>,
                                  h3: ({node, children, ...props}) => <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.4rem', marginBottom: '0.2rem' }} {...props}>{children}</h3>,
                                  li: ({node, children, ...props}) => {
                                    if (React.Children.count(children) === 1 && React.isValidElement(children) && children.type === 'p') {
                                      return <li style={{ color: 'white', marginTop: '0', marginBottom: '0.1rem' }} {...props}>{children.props.children}</li>;
                                    }
                                    return <li style={{ color: 'white', marginTop: '0', marginBottom: '0.1rem' }} {...props}>{children}</li>;
                                  },
                                } : {}),
                                h1: ({node, children, ...props}) => <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '0.4rem', marginBottom: '0.3rem', color: '#333' }} {...props}>{children}</h1>,
                                h2: ({node, children, ...props}) => <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.4rem', marginBottom: '0.3rem', color: '#333' }} {...props}>{children}</h2>,
                                h3: ({node, children, ...props}) => <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.4rem', marginBottom: '0.2rem', color: '#333' }} {...props}>{children}</h3>,
                                h4: ({node, children, ...props}) => <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.3rem', marginBottom: '0.2rem', color: '#333' }} {...props}>{children}</h4>,
                                h5: ({node, children, ...props}) => <h5 style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.3rem', marginBottom: '0.2rem', color: '#333' }} {...props}>{children}</h5>,
                                h6: ({node, children, ...props}) => <h6 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginTop: '0.3rem', marginBottom: '0.2rem', color: '#333' }} {...props}>{children}</h6>,
                                p: ({node, children, ...props}) => <p style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }} {...props}>{children}</p>,
                                ul: ({node, children, ...props}) => <ul style={{ marginTop: '0.2rem', marginBottom: '0.2rem', paddingLeft: '1.2rem' }} {...props}>{children}</ul>,
                                ol: ({node, children, ...props}) => <ol style={{ marginTop: '0.2rem', marginBottom: '0.2rem', paddingLeft: '1.2rem' }} {...props}>{children}</ol>,
                                li: ({node, children, ...props}) => {
                                  // Check if children is a single paragraph and unwrap it
                                  if (React.Children.count(children) === 1 && React.isValidElement(children) && children.type === 'p') {
                                    return <li style={{ marginTop: '0', marginBottom: '0.1rem' }} {...props}>{children.props.children}</li>;
                                  }
                                  return <li style={{ marginTop: '0', marginBottom: '0.1rem' }} {...props}>{children}</li>;
                                },
                                strong: ({node, children, ...props}) => <strong style={{ fontWeight: 'bold', color: '#333' }} {...props}>{children}</strong>,
                                em: ({node, children, ...props}) => <em style={{ fontStyle: 'italic', color: '#555' }} {...props}>{children}</em>,
                                a: ({node, children, ...props}) => <a style={{ color: '#6a11cb', textDecoration: 'none', borderBottom: '1px dotted #6a11cb' }} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                                code: ({node, inline, children, ...props}) => 
                                  inline ? (
                                    <code style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '0.1em 0.3em', borderRadius: '3px', fontSize: '0.9em' }} {...props}>{children}</code>
                                  ) : (
                                    <pre style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '5px', overflowX: 'auto', marginTop: '0.3rem', marginBottom: '0.3rem' }}>
                                      <code style={{ fontFamily: 'monospace', fontSize: '0.9em' }} {...props}>{children}</code>
                                    </pre>
                                  ),
                                blockquote: ({node, children, ...props}) => <blockquote style={{ borderLeft: '3px solid #6a11cb', paddingLeft: '0.8rem', color: '#555', fontStyle: 'italic', margin: '0.3rem 0' }} {...props}>{children}</blockquote>,
                                table: ({node, children, ...props}) => <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '0.3rem', marginBottom: '0.3rem', fontSize: '0.9rem' }} {...props}>{children}</table>,
                                thead: ({node, children, ...props}) => <thead {...props}>{children}</thead>,
                                tbody: ({node, children, ...props}) => <tbody {...props}>{children}</tbody>,
                                tr: ({node, children, ...props}) => <tr {...props}>{children}</tr>,
                                th: ({node, children, ...props}) => <th style={{ border: '1px solid #ddd', padding: '0.3rem', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: '600' }} {...props}>{children}</th>,
                                td: ({node, children, ...props}) => <td style={{ border: '1px solid #ddd', padding: '0.3rem', textAlign: 'left' }} {...props}>{children}</td>
                              }}
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
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="response-mode-toggle">
                    <div 
                      className={`toggle-container ${responseMode === 'deep' ? 'active' : ''}`}
                      onClick={() => setResponseMode(responseMode === 'normal' ? 'deep' : 'normal')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '20px',
                        padding: '3px',
                        cursor: 'pointer',
                        position: 'relative',
                        width: '140px',
                        height: '30px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div 
                        className="toggle-button"
                        style={{
                          position: 'absolute',
                          left: responseMode === 'normal' ? '3px' : 'calc(50% + 3px)',
                          width: 'calc(50% - 6px)',
                          height: 'calc(100% - 6px)',
                          backgroundColor: responseMode === 'normal' ? '#fff' : 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                          background: responseMode === 'normal' ? '#fff' : 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                          borderRadius: '15px',
                          transition: 'all 0.3s ease',
                          zIndex: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <div 
                        className="normal-text"
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          color: responseMode === 'normal' ? '#6a11cb' : '#666',
                          fontWeight: responseMode === 'normal' ? '600' : '400',
                          fontSize: '0.8rem',
                          zIndex: 2,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Normal
                      </div>
                      <div 
                        className="deep-text"
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          color: responseMode === 'deep' ? '#fff' : '#666',
                          fontWeight: responseMode === 'deep' ? '600' : '400',
                          fontSize: '0.8rem',
                          zIndex: 2,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Deep
                      </div>
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
                    <Button variant="link" className="p-0 text-muted" style={{ fontSize: '0.8rem' }}>
                      <FaQuestionCircle />
                    </Button>
                  </OverlayTrigger>
                </div>
                <Form onSubmit={handleSendMessage}>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Ask about the candidate, job requirements, interview strategies..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={sendingMessage || initializing}
                      style={{
                        borderRadius: '24px',
                        padding: '12px 20px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(106, 17, 203, 0.2)',
                        fontSize: '0.95rem',
                        color: '#333',
                        paddingRight: '50px',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow = '0 0 0 3px rgba(106, 17, 203, 0.1)';
                        e.target.style.borderColor = '#6a11cb';
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
                        e.target.style.borderColor = 'rgba(106, 17, 203, 0.2)';
                      }}
                    />
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={sendingMessage || initializing || !inputMessage.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #6a11cb 0%, #ff9e00 100%)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '46px',
                        height: '46px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        right: '4px',
                        top: '4px',
                        zIndex: 10,
                        boxShadow: '0 3px 8px rgba(106, 17, 203, 0.3)',
                        transition: 'all 0.2s ease',
                        padding: '0'
                      }}
                      onMouseOver={(e) => {
                        if (!sendingMessage && !initializing && inputMessage.trim()) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 5px 12px rgba(106, 17, 203, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(106, 17, 203, 0.3)';
                      }}
                    >
                      {sendingMessage ? (
                        <Spinner animation="border" size="sm" style={{ color: 'white' }} />
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
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {suggestedQuestions.slice(0, 2).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setInputMessage(question);
                        handleSendMessage({ preventDefault: () => {} });
                      }}
                      disabled={sendingMessage || initializing}
                      className="rounded-pill"
                      style={{
                        background: 'rgba(106, 17, 203, 0.05)',
                        borderColor: 'rgba(106, 17, 203, 0.2)',
                        color: '#6a11cb',
                        fontWeight: '500',
                        padding: '8px 16px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.03)'
                      }}
                      onMouseOver={(e) => {
                        if (!sendingMessage && !initializing) {
                          e.currentTarget.style.background = 'rgba(106, 17, 203, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(106, 17, 203, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(106, 17, 203, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(106, 17, 203, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.03)';
                      }}
                    >
                      {question.length > 30 ? question.substring(0, 30) + '...' : question}
                    </Button>
                  ))}
                  <div className="w-100 text-center mt-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-muted"
                      onClick={() => {
                        // Rotate the suggested questions
                        const rotated = [...suggestedQuestions];
                        rotated.push(rotated.shift());
                        setSuggestedQuestions(rotated);
                      }}
                      disabled={sendingMessage || initializing}
                      style={{
                        transition: 'all 0.2s ease',
                        color: '#6c757d'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#6a11cb';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#6c757d';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
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
