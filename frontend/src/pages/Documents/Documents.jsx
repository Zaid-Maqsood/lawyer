import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { documentsAPI, casesAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function UploadModal({ onClose, onSuccess, caseId }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ name: '', document_type: 'general', description: '', case_id: caseId || '' });
  const [cases, setCases] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    casesAPI.getAll({ limit: 100 }).then(r => setCases(r.data.cases || [])).catch(() => {});
  }, []);

  const handleFile = (f) => {
    if (f) {
      setFile(f);
      if (!form.name) setForm(prev => ({ ...prev, name: f.name }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name);
      fd.append('document_type', form.document_type);
      fd.append('description', form.description);
      if (form.case_id) fd.append('case_id', form.case_id);
      await documentsAPI.upload(fd);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>Upload Document</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'var(--blue-light)' : 'var(--bg-muted)',
                transition: 'all 0.15s'
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {file ? (
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Drop file here or click to browse</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, DOC, DOCX, TXT up to 10MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt,.jpg,.png" onChange={e => handleFile(e.target.files[0])} />
            </div>

            <div className="form-group">
              <label className="form-label">Document Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Document name" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}>
                  {['general', 'contract', 'motion', 'brief', 'exhibit', 'correspondence', 'invoice', 'agreement'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Related Case</label>
                <select className="form-select" value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                  <option value="">No case</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
              {uploading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Uploading...</>
              ) : 'Upload'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AIPanel({ doc, onClose }) {
  const [summary, setSummary] = useState(doc.ai_summary || '');
  const [clauses, setClauses] = useState(doc.ai_key_clauses || []);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState({ summarize: false, clauses: false, ask: false });
  const [activeTab, setActiveTab] = useState('summary');

  const summarize = async () => {
    setLoading(l => ({ ...l, summarize: true }));
    try {
      const res = await aiAPI.summarize(doc.id);
      setSummary(res.data.summary);
    } catch (err) {
      alert(err.response?.data?.error || 'AI service error');
    } finally {
      setLoading(l => ({ ...l, summarize: false }));
    }
  };

  const extractClauses = async () => {
    setLoading(l => ({ ...l, clauses: true }));
    try {
      const res = await aiAPI.extractClauses(doc.id);
      setClauses(res.data.clauses || []);
      setActiveTab('clauses');
    } catch (err) {
      alert(err.response?.data?.error || 'AI service error');
    } finally {
      setLoading(l => ({ ...l, clauses: false }));
    }
  };

  const askQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(l => ({ ...l, ask: true }));
    try {
      const res = await aiAPI.askQuestion(doc.id, { question, conversation_history: history });
      const newHistory = [...history, { role: 'user', content: question }, { role: 'assistant', content: res.data.answer }];
      setHistory(newHistory);
      setAnswer(res.data.answer);
      setQuestion('');
    } catch (err) {
      alert(err.response?.data?.error || 'AI service error');
    } finally {
      setLoading(l => ({ ...l, ask: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 420,
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        zIndex: 45,
        display: 'flex', flexDirection: 'column'
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)' }}>
        <div>
          <h3 style={{ color: '#fff', fontFamily: 'EB Garamond, serif', fontSize: '1.1rem' }}>AI Document Analysis</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{doc.name}</p>
        </div>
        <button className="btn btn-icon" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Actions */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={summarize} disabled={loading.summarize} style={{ flex: 1, justifyContent: 'center' }}>
          {loading.summarize ? <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : 'Summarize'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={extractClauses} disabled={loading.clauses} style={{ flex: 1, justifyContent: 'center' }}>
          {loading.clauses ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Key Clauses'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
        {['summary', 'clauses', 'qa'].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ fontSize: '0.82rem' }}>
            {t === 'qa' ? 'Q&A' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {activeTab === 'summary' && (
          summary ? (
            <div className="ai-markdown" style={{ lineHeight: 1.8, color: 'var(--text)', fontSize: '0.875rem' }}>
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
              <p>Click "Summarize" to generate an AI summary</p>
            </div>
          )
        )}

        {activeTab === 'clauses' && (
          clauses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clauses.map((clause, i) => (
                <div key={i} style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius)', padding: 16, borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    {clause.type || `Clause ${i + 1}`}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 6 }}>{clause.title}</div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{clause.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>Click "Key Clauses" to extract important provisions</p>
            </div>
          )
        )}

        {activeTab === 'qa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-muted)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6
                }}>
                  {msg.role === 'assistant' ? (
                    <div className="ai-markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>Ask a question about this document</p>
            )}
          </div>
        )}
      </div>

      {activeTab === 'qa' && (
        <form onSubmit={askQuestion} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            placeholder="Ask about this document..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-icon" disabled={loading.ask || !question.trim()}>
            {loading.ask ? <div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
          </button>
        </form>
      )}

      <style>{`
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
        .ai-markdown ul, .ai-markdown ol { margin: 6px 0 10px 0; padding-left: 20px; }
        .ai-markdown li { margin-bottom: 4px; }
        .ai-markdown strong { color: var(--primary); font-weight: 700; }
        .ai-markdown code {
          background: var(--border);
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 0.82rem;
          font-family: monospace;
        }
        .ai-markdown hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
      `}</style>
    </motion.div>
  );
}

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [aiDoc, setAIDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await documentsAPI.getAll({ search });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await documentsAPI.delete(id);
    setDocuments(ds => ds.filter(d => d.id !== id));
  };

  const typeColors = {
    contract: '#16A34A', motion: '#0284C7', brief: '#7C3AED',
    exhibit: '#D97706', correspondence: '#DB2777', invoice: 'var(--accent)',
    agreement: 'var(--primary)', general: 'var(--text-muted)'
  };

  return (
    <div style={{ paddingRight: aiDoc ? 440 : 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        {user.role !== 'client' && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Document
          </button>
        )}
      </div>

      <div className="search-input" style={{ maxWidth: 400, marginBottom: 24 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" className="form-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <h3>No documents yet</h3>
            <p>Upload your first document to get started</p>
            {user.role !== 'client' && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowUpload(true)}>Upload Document</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              className="card card-hover"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: `${typeColors[doc.document_type] || typeColors.general}15`,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: typeColors[doc.document_type] || typeColors.general
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {doc.document_type} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                  </div>
                  {doc.case_title && <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.case_title}</div>}
                  {doc.ai_summary && <div style={{ marginTop: 6 }}><span className="badge badge-info" style={{ fontSize: '0.65rem' }}>AI Analyzed</span></div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </a>
                {user.role !== 'client' && (
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }} onClick={() => setAIDoc(doc)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
                    AI Analyze
                  </button>
                )}
                {user.role !== 'client' && (
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(doc.id)} title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onSuccess={fetchDocuments}
          />
        )}
        {aiDoc && <AIPanel doc={aiDoc} onClose={() => setAIDoc(null)} />}
      </AnimatePresence>
    </div>
  );
}
