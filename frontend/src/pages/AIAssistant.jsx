import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { aiAPI, casesAPI } from '../services/api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m LexAI, your AI legal assistant. I can help with case strategy, legal research, document drafting, and more. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    casesAPI.getAll().then(r => setCases(r.data.cases || [])).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSending(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat({
        message: userMessage,
        case_id: selectedCase || undefined,
        conversation_history: history
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your OpenAI API key configuration and try again.'
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?'
    }]);
  };

  const suggestions = [
    'What are the key elements to prove negligence?',
    'Draft a demand letter for a contract breach',
    'What discovery documents should I request?',
    'Summarize the statute of limitations for this case type',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">AI Legal Assistant</h1>
          <p className="page-subtitle">Powered by GPT-4 — case strategy, research, and drafting</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={clearChat}>Clear Chat</button>
      </div>

      {/* Case context selector */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Case context:</span>
        <select
          className="form-select"
          style={{ flex: 1, maxWidth: 360, padding: '6px 12px', fontSize: '0.875rem' }}
          value={selectedCase}
          onChange={e => setSelectedCase(e.target.value)}
        >
          <option value="">General assistant (no case context)</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="card" style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 1 && (
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Suggested questions:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="chip"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                gap: 12,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(180,83,9,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
                )}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '75%',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-muted)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none'
              }}>
                {msg.role === 'assistant' ? (
                  <div className="ai-markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(180,83,9,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div style={{
              background: 'var(--bg-muted)', border: '1px solid var(--border)',
              padding: '14px 18px', borderRadius: '16px 16px 16px 4px',
              display: 'flex', gap: 6, alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--text-light)',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            className="form-textarea"
            placeholder="Ask a legal question... (Shift+Enter for new line)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            style={{ flex: 1, resize: 'none', fontSize: '0.9rem', minHeight: 56 }}
          />
          <button
            className="btn btn-accent"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ padding: '14px 20px', alignSelf: 'flex-end' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 8 }}>
          AI responses are for informational purposes only and do not constitute legal advice.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .ai-markdown p { margin: 0 0 10px 0; }
        .ai-markdown p:last-child { margin-bottom: 0; }
        .ai-markdown h1, .ai-markdown h2, .ai-markdown h3 {
          font-family: 'EB Garamond', serif;
          color: var(--primary);
          margin: 14px 0 6px 0;
          font-size: 1rem;
          font-weight: 700;
        }
        .ai-markdown h1:first-child, .ai-markdown h2:first-child, .ai-markdown h3:first-child { margin-top: 0; }
        .ai-markdown ul, .ai-markdown ol {
          margin: 6px 0 10px 0;
          padding-left: 20px;
        }
        .ai-markdown li { margin-bottom: 4px; }
        .ai-markdown strong { color: var(--primary); font-weight: 700; }
        .ai-markdown code {
          background: var(--border);
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 0.82rem;
          font-family: monospace;
        }
        .ai-markdown hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
}
