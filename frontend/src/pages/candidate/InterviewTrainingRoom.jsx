import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge, ProgressBar, Tabs, Tab, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaPaperPlane, FaRobot, FaVideo, FaFileAlt, FaBriefcase, FaGraduationCap, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaChartLine, FaCheck, FaTimes, FaLightbulb, FaCode, FaUserTie, FaInfoCircle, FaQuestionCircle, FaStar, FaClipboardCheck, FaComments, FaCheckCircle, FaExclamationTriangle, FaBrain, FaBook, FaLaptopCode, FaHandshake } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { interviewService } from '../../services/api';
import openaiService from '../../services/openaiService';
import './InterviewTrainingRoom.css';

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
  return 'default';
};

const InterviewTrainingRoom = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [responseMode, setResponseMode] = useState('normal'); // 'normal' or 'deep'
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What skills should I focus on for this job?",
    "What technical questions might I be asked in the interview?",
    "How can I improve my chances of getting this job?",
    "What are common behavioral questions for this role?",
    "How should I prepare for coding challenges?",
    "What should I know about the company culture?",
    "How can I address gaps in my experience during the interview?",
    "What's the best way to explain my past projects?",
    "How should I discuss my salary expectations?"
  ]);
  
  // State for resume analysis data
  const [resumeAnalysisData, setResumeAnalysisData] = useState(null);

  // Fetch application data and initialize AI assistant
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setLoading(true);
        
        // First, check if this is an interview ID rather than an application ID
        // by trying to fetch the interview data
        try {
          const interviewResponse = await fetch(`http://localhost:5000/api/interviews/${applicationId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const interviewData = await interviewResponse.json();
          
          if (interviewData.success && interviewData.data && interviewData.data.applicationId) {
            // If this is an interview, redirect to the application training page
            navigate(`/application/${interviewData.data.applicationId._id}/training`);
            return;
          }
        } catch (interviewErr) {
          // If we can't fetch the interview, continue trying to fetch the application
          console.log('Not an interview ID, continuing to fetch application');
        }
        
        // Fetch application details
        const response = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const applicationData = await response.json();
        
        if (!applicationData.success) {
          throw new Error(applicationData.message || 'Failed to load application details');
        }
        
        setApplication(applicationData.data);
        
        // Note: We're skipping resume analysis fetch for candidates since it's recruiter-only
        // This data will be incorporated into the AI context through the application data we already have
        console.log('Candidate view does not have access to detailed resume analysis');
        
        // Set a basic analysis structure with data we already have from the application
        if (applicationData.data.matchedSkills || applicationData.data.missingSkills) {
          setResumeAnalysisData({
            strengths: applicationData.data.matchedSkills || [],
            weaknesses: applicationData.data.missingSkills || [],
            recommendations: [
              'Focus on highlighting your matched skills during the interview',
              'Prepare to discuss how you can develop in areas where there are skill gaps',
              'Research the company and position to demonstrate your interest'
            ],
            analysis: applicationData.data.candidateRoleFitExplanation || ''
          });
        }
        
        // Initialize AI assistant with context
        const contextResponse = await fetch(`http://localhost:5000/api/ai/training-context/${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const contextData = await contextResponse.json();
        
        if (contextData.success) {
          // Add the AI's initial message
          setMessages([
            {
              role: 'assistant',
              content: contextData.data.initialMessage || 'Hello! I\'m your AI interview training assistant. I can help you prepare for your upcoming interview. What would you like to know about the position or how to prepare?'
            }
          ]);
        } else {
          // Add a fallback message if context fetching fails
          setMessages([
            {
              role: 'assistant',
              content: 'Hello! I\'m your AI interview training assistant. I can help you prepare for your upcoming interview. What would you like to know about the position or how to prepare?'
            }
          ]);
        }
        
        setInitializing(false);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred while loading the training room');
        setLoading(false);
        setInitializing(false);
      }
    };
    
    fetchApplicationData();
  }, [applicationId]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a message to the AI assistant
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSendingMessage(true);
    
    // Add user message to chat
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: userMessage }
    ]);
    
    try {
      // Send message to AI assistant
      const response = await fetch(`http://localhost:5000/api/ai/training-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage,
          applicationId,
          responseMode: responseMode // 'normal' or 'deep'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add AI response to chat
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'assistant', content: data.data.response }
        ]);
      } else {
        throw new Error(data.message || 'Failed to get response from AI assistant');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again later.' 
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle pressing Enter to send a message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle clicking a suggested question
  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  // Format timestamp for chat messages
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render loading state
  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your interview training room...</p>
        </div>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger" 
              onClick={() => navigate('/dashboard/candidate/applications')}
            >
              Return to Applications
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="interview-training-room">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title-container">
            <h2 className="sidebar-title">AI Interview Training</h2>
          </div>
        </div>
        
        <div className="sidebar-content">
          {application && application.job && (
            <div className="job-info">
              <h3 className="section-title">Interview Details</h3>
              <div className="job-details-card">
                <div className="job-position">
                  <span>{application.job.title}</span>
                </div>
                <div className="job-company">
                  <span>{application.job.company}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="sidebar-section">
            <h3 className="section-title">Suggested Questions</h3>
            <div className="suggested-questions-list">
              {suggestedQuestions.map((question, idx) => (
                <div 
                  key={idx} 
                  className="suggested-question" 
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <FaQuestionCircle className="question-icon" size={18} />
                  <span>{question}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Response mode moved to chat input area */}
        </div>
      </div>
      
      <div className="chat-main">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-icon">
                  <FaRobot size={32} />
                </div>
                <h3>Welcome to AI Interview Training</h3>
                <p>I'm here to help you prepare for your interview. Ask me anything about the job, company, or interview process.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                  <div className="message-header">
                    {msg.role === 'assistant' ? (
                      <div className="message-avatar assistant-avatar">
                        <FaRobot />
                      </div>
                    ) : (
                      <div className="message-avatar user-avatar">
                        <FaUser />
                      </div>
                    )}
                    <div className="message-author">
                      {msg.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </div>
                    <div className="message-time">{formatTime()}</div>
                  </div>
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <div className="custom-toggle-container">
              <div className="custom-toggle-wrapper">
                <div 
                  className={`custom-toggle ${responseMode}`}
                  onClick={() => setResponseMode(responseMode === 'normal' ? 'deep' : 'normal')}
                >
                  <div className="toggle-option normal-option">
                    <span>Normal</span>
                  </div>
                  <div className="toggle-option deep-option">
                    <span>Deep</span>
                  </div>
                  <div className="toggle-slider"></div>
                </div>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Toggle between normal (concise) and deep (detailed) response modes</Tooltip>}
                >
                  <div className="toggle-info">
                    <FaInfoCircle size={16} />
                  </div>
                </OverlayTrigger>
              </div>
            </div>
            
            <div className="input-send-container">
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Type your question here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                className="chat-input"
              />
              <Button 
                className="send-button"
                onClick={handleSendMessage} 
                disabled={!inputMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <FaPaperPlane size={24} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewTrainingRoom;
