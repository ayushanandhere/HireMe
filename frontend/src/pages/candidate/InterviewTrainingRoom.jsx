import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowUp,
  FiCpu,
  FiEdit2,
  FiMenu,
  FiMessageSquare,
  FiChevronsLeft,
  FiPlus,
  FiStar,
  FiTrash2,
  FiUser
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiTrainingService, applicationService, interviewService } from '../../services/api';
import './InterviewTrainingRoom.css';

/* ── Helpers ── */

const STARTER_PROMPTS = [
  'Give me the 5 most likely interview questions for this role.',
  'Help me build a strong self-introduction for this interview.',
  'What gaps in my profile should I prepare to address?',
  'Create a 30-minute prep plan for this job.'
];

const sortConversations = (items) =>
  [...items].sort((a, b) => {
    if (a.isStarred !== b.isStarred) return Number(b.isStarred) - Number(a.isStarred);
    return new Date(b.lastUsedAt || b.updatedAt || 0) - new Date(a.lastUsedAt || a.updatedAt || 0);
  });

const formatRelativeTime = (value) => {
  if (!value) return '';
  const diff = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(diff) < 60) return rtf.format(diff, 'minute');
  const hrs = Math.round(diff / 60);
  if (Math.abs(hrs) < 24) return rtf.format(hrs, 'hour');
  const days = Math.round(hrs / 24);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  return rtf.format(Math.round(days / 30), 'month');
};

const normalizeSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  return String(skills).split(',').map((s) => s.trim()).filter(Boolean);
};

const mdComponents = {
  h1: ({ children, ...p }) => <h1 className="tr-md-h1" {...p}>{children}</h1>,
  h2: ({ children, ...p }) => <h2 className="tr-md-h2" {...p}>{children}</h2>,
  h3: ({ children, ...p }) => <h3 className="tr-md-h3" {...p}>{children}</h3>,
  p: ({ children, ...p }) => <p className="tr-md-p" {...p}>{children}</p>,
  ul: ({ children, ...p }) => <ul className="tr-md-ul" {...p}>{children}</ul>,
  ol: ({ children, ...p }) => <ol className="tr-md-ol" {...p}>{children}</ol>,
  li: ({ children, ...p }) => <li className="tr-md-li" {...p}>{children}</li>,
  strong: ({ children, ...p }) => <strong className="tr-md-strong" {...p}>{children}</strong>,
  a: ({ children, ...p }) => <a className="tr-md-a" target="_blank" rel="noopener noreferrer" {...p}>{children}</a>,
  code: ({ inline, children, ...p }) =>
    inline
      ? <code className="tr-md-code" {...p}>{children}</code>
      : <pre className="tr-md-pre"><code className="tr-md-code-block" {...p}>{children}</code></pre>
};

/* ── Component ── */

const InterviewTrainingRoom = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [responseMode, setResponseMode] = useState('normal');
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const focusSkills = useMemo(() => normalizeSkills(application?.missingSkills).slice(0, 4), [application?.missingSkills]);
  const matchedSkills = useMemo(() => normalizeSkills(application?.matchedSkills).slice(0, 4), [application?.matchedSkills]);

  const starterPrompts = useMemo(() => {
    const dynamic = [];
    if (focusSkills.length > 0) dynamic.push(`Help me prepare for questions about ${focusSkills.join(', ')}.`);
    if (application?.job?.title) dynamic.push(`Give me a focused prep plan for the ${application.job.title} interview.`);
    return [...dynamic, ...STARTER_PROMPTS].slice(0, 4);
  }, [application?.job?.title, focusSkills]);

  /* ── Data helpers ── */

  const upsertConversation = (conv) => {
    setConversations((cur) => {
      const next = cur.filter((c) => c.id !== conv.id);
      next.push(conv);
      return sortConversations(next);
    });
  };

  const removeConversation = (id) => setConversations((cur) => cur.filter((c) => c.id !== id));

  const loadConversation = async (id) => {
    setLoadingConversation(true);
    setError(null);
    try {
      const res = await aiTrainingService.getTrainingConversation(id);
      if (!res.success) throw new Error(res.message || 'Failed to load conversation');
      setActiveConversationId(id);
      setMessages(res.data.messages || []);
      upsertConversation(res.data.conversation);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoadingConversation(false);
    }
  };

  const createConversation = async () => {
    try {
      const res = await aiTrainingService.createTrainingConversation(applicationId);
      if (!res.success) throw new Error(res.message || 'Failed to create conversation');
      setMessages(res.data.messages || []);
      setActiveConversationId(res.data.conversation.id);
      upsertConversation(res.data.conversation);
      setEditingConversationId(null);
      setEditingTitle('');
      return res.data.conversation.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Failed to create conversation');
      return null;
    }
  };

  /* ── Bootstrap ── */

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        setError(null);
        try {
          const iv = await interviewService.getInterviewById(applicationId);
          if (iv.success && iv.data?.applicationId) {
            navigate(`/application/${iv.data.applicationId._id}/training`);
            return;
          }
        } catch { /* not an interview ID */ }

        const [appRes, ctxRes, convRes] = await Promise.all([
          applicationService.getApplicationById(applicationId),
          aiTrainingService.getTrainingContext(applicationId),
          aiTrainingService.listTrainingConversations(applicationId)
        ]);
        if (!appRes.success) throw new Error(appRes.message || 'Failed to load application');
        if (!ctxRes.success) throw new Error(ctxRes.message || 'Failed to load context');
        if (!convRes.success) throw new Error(convRes.message || 'Failed to load conversations');

        setApplication(appRes.data);
        const sorted = sortConversations(convRes.data || []);
        setConversations(sorted);
        if (sorted.length > 0) await loadConversation(sorted[0].id);
        else await createConversation();
      } catch (err) {
        console.error('Error bootstrapping:', err);
        setError(err.message || 'Failed to load training room');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [applicationId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Handlers ── */

  const handleSendMessage = async (override) => {
    const raw = typeof override === 'string' ? override : inputMessage;
    if (!raw.trim() || sendingMessage) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    const optimistic = { role: 'user', content: raw.trim(), timestamp: new Date().toISOString() };
    setInputMessage('');
    setSendingMessage(true);
    setMessages((cur) => [...cur, optimistic]);
    setError(null);

    try {
      const res = await aiTrainingService.sendTrainingMessage({
        message: raw.trim(), applicationId, conversationId: convId, responseMode
      });
      if (!res.success) throw new Error(res.message || 'Failed to get response');
      setMessages(res.data.messages || []);
      upsertConversation(res.data.conversation);
      setActiveConversationId(res.data.conversation.id);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      setMessages((cur) => cur.slice(0, -1));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setActiveConversationId(null);
    setInputMessage('');
    await createConversation();
  };

  const handleDeleteConversation = async (id) => {
    try {
      await aiTrainingService.deleteTrainingConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      removeConversation(id);
      if (id === activeConversationId) {
        if (remaining.length > 0) await loadConversation(remaining[0].id);
        else await handleNewChat();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err.message || 'Failed to delete');
    }
  };

  const handleToggleStar = async (conv) => {
    try {
      const res = await aiTrainingService.updateTrainingConversation(conv.id, { isStarred: !conv.isStarred });
      if (!res.success) throw new Error(res.message || 'Failed to update');
      upsertConversation(res.data);
    } catch (err) {
      console.error('Error toggling star:', err);
      setError(err.message || 'Failed to update');
    }
  };

  const handleStartRename = () => {
    if (!activeConversation) return;
    setEditingConversationId(activeConversation.id);
    setEditingTitle(activeConversation.title);
  };

  const handleCommitRename = async () => {
    if (!editingConversationId) return;
    const trimmed = editingTitle.trim();
    if (!trimmed) { setEditingConversationId(null); setEditingTitle(''); return; }
    try {
      const res = await aiTrainingService.updateTrainingConversation(editingConversationId, { title: trimmed });
      if (!res.success) throw new Error(res.message || 'Failed to rename');
      upsertConversation(res.data);
      setEditingConversationId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Error renaming:', err);
      setError(err.message || 'Failed to rename');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  /* Auto-resize textarea */
  const handleInput = (e) => {
    setInputMessage(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  };

  /* ── Loading state ── */

  if (loading) {
    return (
      <div className="tr tr-loading-page">
        <div className="tr-loading-center">
          <div className="tr-pulse" />
          <h2>Setting up your workspace</h2>
          <p>Loading context and conversations…</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="tr tr-loading-page">
        <div className="tr-error-center surface-card">
          <span className="signal-chip alert">Unavailable</span>
          <h2>Unable to open training</h2>
          <p>{error}</p>
          <button className="tr-btn-back" onClick={() => navigate('/dashboard/candidate/applications')}>
            <FiArrowLeft /> Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const starredConversations = conversations.filter((c) => c.isStarred);
  const recentConversations = conversations.filter((c) => !c.isStarred);

  const contextLine = [
    focusSkills.length > 0 && `Focus: ${focusSkills.join(', ')}`,
    application?.job?.location
  ].filter(Boolean).join('  ·  ');

  /* ── Render ── */

  return (
    <div className={`tr ${sidebarOpen ? '' : 'tr--collapsed'}`}>

      {/* ── Sidebar ── */}
      <aside className="tr-side">
        <div className="tr-side-header">
          <h1 className="tr-side-heading">Interview Training</h1>
          <button
            className="tr-btn-icon tr-btn-collapse"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FiChevronsLeft size={16} />
          </button>
        </div>
        <div className="tr-side-top">
          <button className="tr-btn-new" onClick={handleNewChat}>
            <FiPlus size={15} />
            <span>New chat</span>
          </button>
        </div>

        <nav className="tr-threads">
          {starredConversations.length > 0 && (
            <div className="tr-threads-group">
              <span className="tr-threads-label"><FiStar size={10} /> Starred</span>
              {starredConversations.map((c) => (
                <button
                  key={c.id}
                  className={`tr-thread ${activeConversationId === c.id ? 'active' : ''}`}
                  onClick={() => loadConversation(c.id)}
                >
                  <FiMessageSquare size={13} className="tr-thread-icon" />
                  <span className="tr-thread-title">{c.title}</span>
                  <span className="tr-thread-actions">
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleToggleStar(c); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleToggleStar(c); } }}>
                      <FiStar size={12} />
                    </span>
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDeleteConversation(c.id); } }}>
                      <FiTrash2 size={12} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="tr-threads-group">
            <span className="tr-threads-label">Recent</span>
            {recentConversations.length === 0 ? (
              <p className="tr-threads-empty">No conversations yet</p>
            ) : (
              recentConversations.map((c) => (
                <button
                  key={c.id}
                  className={`tr-thread ${activeConversationId === c.id ? 'active' : ''}`}
                  onClick={() => loadConversation(c.id)}
                >
                  <FiMessageSquare size={13} className="tr-thread-icon" />
                  <span className="tr-thread-title">{c.title}</span>
                  <span className="tr-thread-actions">
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleToggleStar(c); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleToggleStar(c); } }}>
                      {c.isStarred ? <FiStar size={12} /> : <FiStar size={12} />}
                    </span>
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDeleteConversation(c.id); } }}>
                      <FiTrash2 size={12} />
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </nav>

        <div className="tr-side-foot">
          <div className="tr-side-context">
            <span className="tr-side-context-lbl">Training for</span>
            <strong>{application?.job?.title || 'Interview prep'}</strong>
            <span className="tr-side-context-sub">
              {application?.job?.company || ''}
              {application?.stage && <span className="tr-side-stage">{application.stage.replace(/_/g, ' ')}</span>}
            </span>
          </div>
          <button className="tr-btn-back" onClick={() => navigate('/dashboard/candidate/applications')}>
            <FiArrowLeft size={14} /> Applications
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="tr-main">
        <header className="tr-head">
          <div className="tr-head-left">
            {!sidebarOpen && (
              <button className="tr-btn-icon" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                <FiMenu size={17} />
              </button>
            )}
            <div className="tr-head-title">
              {editingConversationId === activeConversationId ? (
                <input
                  className="tr-title-input"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleCommitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCommitRename(); }
                    if (e.key === 'Escape') { setEditingConversationId(null); setEditingTitle(''); }
                  }}
                  autoFocus
                />
              ) : (
                <h1>{activeConversation?.title || 'New chat'}</h1>
              )}
            </div>
          </div>

          <div className="tr-head-right">
            <div className="tr-mode">
              <button
                className={responseMode === 'normal' ? 'active' : ''}
                onClick={() => setResponseMode('normal')}
              >Normal</button>
              <button
                className={responseMode === 'deep' ? 'active' : ''}
                onClick={() => setResponseMode('deep')}
              >Deep</button>
            </div>

            {activeConversation && (
              <div className="tr-head-actions">
                <button className="tr-btn-icon" onClick={() => handleToggleStar(activeConversation)}
                  aria-label={activeConversation.isStarred ? 'Unstar' : 'Star'}>
                  <FiStar size={15} className={activeConversation.isStarred ? 'tr-starred' : ''} />
                </button>
                <button className="tr-btn-icon" onClick={handleStartRename} aria-label="Rename">
                  <FiEdit2 size={15} />
                </button>
                <button className="tr-btn-icon" onClick={() => handleDeleteConversation(activeConversation.id)} aria-label="Delete">
                  <FiTrash2 size={15} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="tr-stream">
          <div className="tr-stream-inner">
            {loadingConversation ? (
              <div className="tr-loading-center">
                <div className="tr-pulse" />
                <p>Loading conversation…</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={`${msg.role}-${i}-${msg.timestamp || i}`}
                    className={`tr-msg ${msg.role === 'user' ? 'tr-msg--user' : 'tr-msg--ai'}`}
                  >
                    <div className="tr-msg-avatar">
                      {msg.role === 'user' ? <FiUser size={14} /> : <FiCpu size={14} />}
                    </div>
                    <div className="tr-msg-content">
                      <div className="tr-msg-head">
                        <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
                        <time>{formatRelativeTime(msg.timestamp || new Date().toISOString())}</time>
                      </div>
                      <div className="tr-msg-body">
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {sendingMessage && (
                  <div className="tr-msg tr-msg--ai">
                    <div className="tr-msg-avatar"><FiCpu size={14} /></div>
                    <div className="tr-msg-content">
                      <div className="tr-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}

                {messages.length <= 1 && !sendingMessage && (
                  <div className="tr-starters">
                    {starterPrompts.map((prompt, i) => (
                      <button
                        key={`${prompt}-${i}`}
                        className="tr-starter"
                        onClick={() => handleSendMessage(prompt)}
                        disabled={sendingMessage}
                      >
                        <span className="tr-starter-text">{prompt}</span>
                        <span className="tr-starter-hint">Start a prep thread</span>
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        <footer className="tr-foot">
          {error && <div className="tr-inline-error">{error}</div>}

          <form
            className="tr-compose"
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={sendingMessage}
              placeholder="Message your training assistant…"
              className="tr-compose-input"
            />
            <button
              type="submit"
              className="tr-compose-send"
              disabled={!inputMessage.trim() || sendingMessage}
              aria-label="Send"
            >
              <FiArrowUp size={16} />
            </button>
          </form>

          {contextLine && <span className="tr-foot-context">{contextLine}</span>}
        </footer>
      </main>
    </div>
  );
};

export default InterviewTrainingRoom;
