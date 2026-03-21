import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaUserTie,
  FaVideo
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { applicationService, buildAssetUrl, interviewService } from '../../services/api';
import openaiService from '../../services/openaiService';
import './InterviewBriefingRoom.css';

const categorizeSkill = (skill) => {
  const normalizedSkill = skill.toLowerCase();

  if (['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'swift', 'kotlin', 'typescript'].some((lang) => normalizedSkill.includes(lang))) {
    return 'programming';
  }
  if (['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'laravel', 'rails', 'node.js', 'spring boot'].some((framework) => normalizedSkill.includes(framework))) {
    return 'framework';
  }
  if (['sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'firebase', 'dynamodb', 'redis', 'nosql', 'database'].some((database) => normalizedSkill.includes(database))) {
    return 'database';
  }
  if (['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'serverless', 'devops'].some((cloud) => normalizedSkill.includes(cloud))) {
    return 'cloud';
  }
  if (['git', 'jenkins', 'jira', 'agile', 'scrum', 'ci/cd', 'testing', 'postman', 'swagger'].some((tool) => normalizedSkill.includes(tool))) {
    return 'tool';
  }
  if (['communication', 'leadership', 'teamwork', 'problem-solving', 'critical', 'creativity'].some((soft) => normalizedSkill.includes(soft))) {
    return 'soft';
  }
  if (['rest', 'api', 'graphql', 'soap', 'microservices'].some((api) => normalizedSkill.includes(api))) {
    return 'api';
  }
  if (['mvc', 'architecture', 'design pattern', 'oop', 'functional', 'system design'].some((architecture) => normalizedSkill.includes(architecture))) {
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

const normalizeSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((skill) => String(skill).trim()).filter(Boolean);
  return String(skills)
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
};

const formatStatus = (status = '') => {
  if (!status) return 'Scheduled';
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  td: ({ children, ...props }) => <td className="markdown-td" {...props}>{children}</td>
};

const InsightMeter = ({ label, score }) => {
  const safeScore = Number(score) || 0;

  return (
    <div className="briefing-metric">
      <div className="briefing-metric-row">
        <span>{label}</span>
        <strong className={`tone-${getScoreTone(safeScore)}`}>{safeScore}%</strong>
      </div>
      <div className="briefing-meter">
        <span className={`briefing-meter-fill tone-${getScoreTone(safeScore)}`} style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  );
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
    'Suggest specific technical questions for this candidate based on their claimed skills',
    'How should I address the skill gaps identified in the analysis?',
    'What behavioral questions would reveal if this candidate is a good cultural fit?',
    'Based on their experience, what challenging scenarios should I ask about?',
    'What are potential red flags I should watch for in this interview?',
    "How does this candidate's experience align with our job requirements?",
    'What questions should I ask to verify their proficiency in the required skills?',
    'Can you suggest a structured interview plan for this candidate?'
  ]);
  const [resumeAnalysisData, setResumeAnalysisData] = useState(null);

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true);

        const response = await interviewService.getInterviewById(interviewId);

        if (!response.success) {
          throw new Error(response.message || 'Failed to load interview details');
        }

        setInterview(response.data);

        if (response.data.applicationId && response.data.applicationId._id) {
          try {
            const analysisData = await applicationService.getResumeAnalysis(response.data.applicationId._id);
            if (analysisData.success && analysisData.data) {
              setResumeAnalysisData(analysisData.data);
            }
          } catch (analysisErr) {
            console.error('Error fetching resume analysis:', analysisErr);
          }
        }

        const contextResponse = await openaiService.getInitialContext(interviewId);

        if (contextResponse.success) {
          setMessages([
            {
              role: 'assistant',
              content:
                contextResponse.data.initialMessage ||
                "Hello. I'm your AI interview assistant. I can help you review the candidate, shape the interview plan, and pressure-test the role fit before the call."
            }
          ]);
        } else {
          setMessages([
            {
              role: 'assistant',
              content:
                "Hello. I'm your AI interview assistant. Ask about the candidate, the role, gaps to probe, or the interview structure you want to run."
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const submitMessage = async (rawMessage) => {
    if (!rawMessage.trim() || sendingMessage || initializing || !interview) return;

    const userMessage = rawMessage.trim();
    setInputMessage('');
    setMessages((prevMessages) => [...prevMessages, { role: 'user', content: userMessage }]);
    setSendingMessage(true);

    try {
      const candidateId = interview.candidate?._id;
      const jobId = interview.applicationId?.job;

      const response = await openaiService.sendMessage(
        userMessage,
        interviewId,
        candidateId,
        jobId,
        responseMode
      );

      if (response.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant',
            content: response.data.message,
            mode: response.data.mode || responseMode
          }
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant',
            content: 'I ran into an issue while generating that answer. Please try rephrasing or ask a narrower question.'
          }
        ]);
        setError(response.message || 'Failed to get response from AI assistant');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: 'I ran into an issue while generating that answer. Please try rephrasing or ask a narrower question.'
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    await submitMessage(inputMessage);
  };

  const handleSuggestedQuestion = async (question) => {
    await submitMessage(question);
  };

  const rotateSuggestedQuestions = () => {
    setSuggestedQuestions((currentQuestions) => {
      const rotated = [...currentQuestions];
      rotated.push(rotated.shift());
      return rotated;
    });
  };

  const handleProceedToCall = () => {
    navigate(`/interview/${interviewId}/meeting`);
  };

  if (loading) {
    return (
      <div className="briefing-page page-shell">
        <div className="container briefing-loading-state">
          <div className="briefing-loading-orb" />
          <h2>Preparing the briefing room</h2>
          <p>Loading candidate context, interview details, and assistant memory.</p>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="briefing-page page-shell">
        <div className="container">
          <section className="briefing-empty surface-card">
            <span className="signal-chip alert">Unavailable</span>
            <h1>Unable to open the briefing room.</h1>
            <p>{error}</p>
            <button
              type="button"
              className="action-link ghost"
              onClick={() => navigate('/dashboard/recruiter/interviews')}
            >
              <FaArrowLeft />
              Back to Interviews
            </button>
          </section>
        </div>
      </div>
    );
  }

  const candidateName = interview?.candidate?.name || 'Candidate';
  const candidateSkills = normalizeSkills(interview?.candidate?.skills);
  const jobSkills = normalizeSkills(interview?.applicationId?.job?.skills);
  const application = interview?.applicationId || null;
  const fitScore = application?.candidateRoleFit || 0;
  const skillsMatch = application?.skillsMatch || 0;
  const experienceRelevance = application?.experienceRelevance || 0;
  const atsScore = application?.atsScore || 0;
  const matchedSkills = application?.matchedSkills || [];
  const missingSkills = application?.missingSkills || [];
  const topQuestions = suggestedQuestions.slice(0, 2);
  const activeModeLabel = responseMode === 'deep' ? 'Deep' : 'Normal';

  const renderProfilePanel = () => (
    <>
      <div className="briefing-identity">
        <div className="briefing-avatar">
          {interview?.candidate?.profilePicture ? (
            <img
              src={buildAssetUrl(interview.candidate.profilePicture)}
              alt={candidateName}
              className="briefing-avatar-image"
            />
          ) : (
            <FaUser />
          )}
        </div>
        <div>
          <h3>{candidateName}</h3>
          <p>{interview?.candidate?.email || 'No email available'}</p>
          {interview?.candidate?.currentPosition && (
            <span className="briefing-role-chip">
              <FaUserTie />
              {interview.candidate.currentPosition}
            </span>
          )}
        </div>
      </div>

      <div className="briefing-detail-list">
        <div>
          <span><FaBriefcase /> Position</span>
          <strong>{interview?.position?.title || 'N/A'}</strong>
        </div>
        <div>
          <span><FaCalendarAlt /> Scheduled</span>
          <strong>{interview?.scheduledDateTime ? formatDateTime(interview.scheduledDateTime) : 'N/A'}</strong>
        </div>
        <div>
          <span><FaChartLine /> Duration</span>
          <strong>{interview?.duration || 60} minutes</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{formatStatus(interview?.status)}</strong>
        </div>
      </div>

      {candidateSkills.length > 0 && (
        <section className="briefing-section">
          <h4>Candidate skills</h4>
          <div className="briefing-chip-cloud">
            {candidateSkills.map((skill, index) => (
              <span key={`${skill}-${index}`} className={`briefing-chip tone-${categorizeSkill(skill)}`}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {interview?.candidate?.experience && (
        <section className="briefing-section">
          <h4>Experience</h4>
          <p>{interview.candidate.experience}</p>
        </section>
      )}

      <div className="briefing-rail-actions">
        {interview?.candidate?.resumePath && (
          <a
            href={buildAssetUrl(interview.candidate.resumePath)}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link ghost"
          >
            <FaFileAlt />
            View Resume
          </a>
        )}
        <button type="button" className="action-link primary" onClick={handleProceedToCall}>
          <FaVideo />
          Start Interview
        </button>
      </div>
    </>
  );

  const renderAnalysisPanel = () => (
    <>
      <section className="briefing-section">
        <h4>Role fit snapshot</h4>
        <div className="briefing-analysis-stack">
          <InsightMeter label="Candidate fit" score={fitScore} />
          <InsightMeter label="Skills match" score={skillsMatch} />
          <InsightMeter label="Experience" score={experienceRelevance} />
          <InsightMeter label="ATS score" score={atsScore} />
        </div>
      </section>

      {matchedSkills.length > 0 && (
        <section className="briefing-section">
          <h4>Aligned skills</h4>
          <div className="briefing-chip-cloud">
            {matchedSkills.map((skill, index) => (
              <span key={`${skill}-${index}`} className="briefing-chip tone-match">
                <FaCheckCircle />
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {missingSkills.length > 0 && (
        <section className="briefing-section">
          <h4>Probe carefully</h4>
          <div className="briefing-chip-cloud">
            {missingSkills.map((skill, index) => (
              <span key={`${skill}-${index}`} className="briefing-chip tone-gap">
                <FaExclamationTriangle />
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {resumeAnalysisData?.analysis && (
        <section className="briefing-section">
          <h4>Analysis notes</h4>
          <p>
            Resume analysis is available for this application. Use the assistant to ask for a tighter
            question plan, risk areas, or skill-verification prompts grounded in that analysis.
          </p>
        </section>
      )}
    </>
  );

  const renderJobPanel = () => (
    <>
      <div className="briefing-identity briefing-identity-job">
        <div className="briefing-avatar briefing-avatar-job">
          <FaBriefcase />
        </div>
        <div>
          <h3>{interview?.applicationId?.job?.title || interview?.position?.title || 'Role'}</h3>
          <p>
            {interview?.applicationId?.job?.company || 'Company not specified'}
            {interview?.applicationId?.job?.location ? ` · ${interview.applicationId.job.location}` : ''}
          </p>
        </div>
      </div>

      <div className="briefing-detail-list">
        <div>
          <span><FaBuilding /> Company</span>
          <strong>{interview?.applicationId?.job?.company || 'Not specified'}</strong>
        </div>
        <div>
          <span><FaMapMarkerAlt /> Location</span>
          <strong>{interview?.applicationId?.job?.location || 'Not specified'}</strong>
        </div>
        <div>
          <span><FaBriefcase /> Type</span>
          <strong>{interview?.applicationId?.job?.type || 'Not specified'}</strong>
        </div>
        <div>
          <span><FaChartLine /> Experience level</span>
          <strong>{interview?.applicationId?.job?.experienceLevel || 'Not specified'}</strong>
        </div>
      </div>

      {jobSkills.length > 0 && (
        <section className="briefing-section">
          <h4>Required skills</h4>
          <div className="briefing-chip-cloud">
            {jobSkills.map((skill, index) => (
              <span key={`${skill}-${index}`} className="briefing-chip tone-job">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {interview?.applicationId?.job?.description && (
        <section className="briefing-section">
          <h4>Role context</h4>
          <div className="briefing-description">
            {interview.applicationId.job.description}
          </div>
        </section>
      )}
    </>
  );

  const renderRailContent = () => {
    if (activeTab === 'analysis') {
      return renderAnalysisPanel();
    }

    if (activeTab === 'job') {
      return renderJobPanel();
    }

    return renderProfilePanel();
  };

  return (
    <div className="briefing-page page-shell">
      <div className="container briefing-shell">
        <header className="briefing-header">
          <div className="briefing-header-left">
            <h1>Interview Briefing</h1>
            <div className="briefing-header-meta">
              <span className="signal-chip positive">{formatStatus(interview?.status)}</span>
              <span className="signal-chip ai">{interview?.duration || 60} min</span>
              <span className="signal-chip active">{activeModeLabel} mode</span>
            </div>
            <p className="briefing-header-note">
              {candidateName} for {interview?.position?.title || 'the role'}.
              {` ${interview?.scheduledDateTime ? formatDateTime(interview.scheduledDateTime) : ''}`}
            </p>
          </div>

          <div className="briefing-header-actions">
            <button
              type="button"
              className="action-link ghost"
              onClick={() => navigate('/dashboard/recruiter/interviews')}
            >
              <FaArrowLeft />
              Interviews
            </button>
            <button type="button" className="action-link primary" onClick={handleProceedToCall}>
              <FaVideo />
              Start Interview
            </button>
          </div>
        </header>

        <section className="briefing-workspace">
          <aside className="briefing-rail">
            <div className="briefing-rail-nav">
              <button
                type="button"
                className={`briefing-rail-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <FaUser />
                Profile
              </button>
              <button
                type="button"
                className={`briefing-rail-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                <FaChartLine />
                Analysis
              </button>
              <button
                type="button"
                className={`briefing-rail-tab ${activeTab === 'job' ? 'active' : ''}`}
                onClick={() => setActiveTab('job')}
              >
                <FaBriefcase />
                Job
              </button>
            </div>

            <div className="briefing-rail-panel surface-card">
              {renderRailContent()}
            </div>
          </aside>

          <section className="briefing-assistant surface-card">
            <div className="briefing-assistant-head">
              <div>
                <h2>Briefing assistant</h2>
                <p>
                  Ask for targeted probes, skill checks, red flags, or a tighter interview plan.
                </p>
              </div>

              <div className="briefing-mode-toggle" role="tablist" aria-label="Response mode">
                <button
                  type="button"
                  className={responseMode === 'normal' ? 'active' : ''}
                  onClick={() => setResponseMode('normal')}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={responseMode === 'deep' ? 'active' : ''}
                  onClick={() => setResponseMode('deep')}
                >
                  Deep
                </button>
              </div>
            </div>

            {error && <div className="briefing-inline-alert alert">{error}</div>}

            <div className="briefing-chat-window">
              {initializing ? (
                <div className="briefing-chat-state">
                  <div className="briefing-loading-orb" />
                  <h3>Initializing assistant context</h3>
                  <p>Pulling candidate, role, and interview context into the workspace.</p>
                </div>
              ) : (
                <div className="briefing-messages">
                  {messages.map((message, index) => (
                    <article
                      key={`${message.role}-${index}`}
                      className={`briefing-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
                    >
                      <div className="briefing-message-meta">
                        <span className="briefing-message-avatar">
                          {message.role === 'user' ? <FaUser /> : <FaRobot />}
                        </span>
                        <div>
                          <strong>{message.role === 'user' ? 'You' : 'Assistant'}</strong>
                          {message.role === 'assistant' && message.mode && (
                            <span>{message.mode === 'deep' ? 'Deep response' : 'Normal response'}</span>
                          )}
                        </div>
                      </div>

                      <div className="briefing-message-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </article>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="briefing-chat-footer">
              <div className="briefing-suggestions">
                {topQuestions.map((question, index) => (
                  <button
                    key={`${question}-${index}`}
                    type="button"
                    className="briefing-suggestion-chip"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={sendingMessage || initializing}
                  >
                    {question}
                  </button>
                ))}
                <button
                  type="button"
                  className="briefing-suggestions-more"
                  onClick={rotateSuggestedQuestions}
                  disabled={sendingMessage || initializing}
                >
                  <FaClipboardCheck />
                  More suggestions
                </button>
              </div>

              <form className="briefing-composer" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  disabled={sendingMessage || initializing}
                  placeholder="Ask about the candidate, gaps to probe, or the interview structure you want to run..."
                  className="briefing-composer-input"
                />
                <button
                  type="submit"
                  className="briefing-composer-submit"
                  disabled={sendingMessage || initializing || !inputMessage.trim()}
                  aria-label="Send message"
                >
                  {sendingMessage ? (
                    <span className="briefing-composer-spinner" />
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </form>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default InterviewBriefingRoom;
