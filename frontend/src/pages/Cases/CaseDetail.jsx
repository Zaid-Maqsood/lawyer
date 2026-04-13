import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { casesAPI, documentsAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABELS = { open: 'Open', active: 'Active', pending: 'Pending', closed: 'Closed', archived: 'Archived' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export default function CaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteForm, setNoteForm] = useState({ title: '', description: '' });
  const [addingNote, setAddingNote] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    Promise.all([
      casesAPI.getById(id),
      documentsAPI.getAll({ case_id: id })
    ]).then(([caseRes, docsRes]) => {
      setCaseData(caseRes.data);
      setDocuments(docsRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    setAddingNote(true);
    try {
      const res = await casesAPI.addTimeline(id, { event_type: 'note', ...noteForm });
      setCaseData(prev => ({ ...prev, timeline: [res.data, ...(prev.timeline || [])] }));
      setNoteForm({ title: '', description: '' });
    } finally {
      setAddingNote(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await aiAPI.analyzeCase(id);
      setAnalysis(res.data.analysis);
      setActiveTab('ai');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 20 }} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>Case not found</h3>
          <Link to="/cases" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Cases</Link>
        </div>
      </div>
    );
  }

  const eventTypeIcons = {
    created: '📁', note: '📝', status_change: '🔄', document: '📄', default: '⚡'
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/cases" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Cases</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caseData.title}</span>
      </div>

      {/* Header */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span className={`badge status-${caseData.status}`}>{STATUS_LABELS[caseData.status]}</span>
              <span className={`badge priority-${caseData.priority}`}>{PRIORITY_LABELS[caseData.priority]}</span>
              {caseData.practice_area && <span className="badge badge-muted">{caseData.practice_area}</span>}
            </div>
            <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.8rem', color: 'var(--primary)', marginBottom: 6 }}>{caseData.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{caseData.case_number}</p>
          </div>
          {user.role !== 'client' && (
            <button
              className="btn btn-accent"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Analyzing...</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
                  AI Analysis
                </>
              )}
            </button>
          )}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Client', value: caseData.client_name || '—' },
            { label: 'Assigned Lawyer', value: caseData.lawyer_name || '—' },
            { label: 'Court', value: caseData.court || '—' },
            { label: 'Filing Date', value: caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : '—' },
            { label: 'Due Date', value: caseData.due_date ? new Date(caseData.due_date).toLocaleDateString() : '—' },
            { label: 'Documents', value: documents.length }
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'documents', 'timeline', ...(user.role !== 'client' ? ['ai'] : [])].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Case Description</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
            {caseData.description || 'No description provided.'}
          </p>
        </div>
      )}

      {/* Documents */}
      {activeTab === 'documents' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: 'var(--primary)' }}>Case Documents ({documents.length})</h3>
            {user.role !== 'client' && (
              <Link to={`/documents?case_id=${id}`} className="btn btn-primary btn-sm">Upload Document</Link>
            )}
          </div>
          {documents.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <h3>No documents</h3>
              <p>Upload documents related to this case</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {documents.map(doc => (
                <div key={doc.id} style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--bg-muted)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {doc.document_type} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ''} • {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {user.role !== 'client' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: 16 }}>Add Note</h3>
              <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="form-input" placeholder="Note title" value={noteForm.title} onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))} required />
                <textarea className="form-textarea" placeholder="Note details..." value={noteForm.description} onChange={e => setNoteForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={addingNote}>
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: 20 }}>Timeline</h3>
            {(caseData.timeline || []).length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>No events yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(caseData.timeline || []).map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}
                  >
                    {i < (caseData.timeline?.length - 1) && (
                      <div style={{
                        position: 'absolute', left: 19, top: 36,
                        width: 2, bottom: 0,
                        background: 'var(--border)'
                      }} />
                    )}
                    <div style={{
                      width: 38, height: 38, flexShrink: 0,
                      background: 'var(--bg-muted)',
                      border: '2px solid var(--border)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      {i === 0 ? '📝' : eventTypeIcons[event.event_type] || eventTypeIcons.default}
                    </div>
                    <div style={{ flex: 1, paddingTop: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 3 }}>{event.title}</div>
                      {event.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>{event.description}</p>}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>
                        {event.user_name && <span>{event.user_name} • </span>}
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI */}
      {activeTab === 'ai' && user.role !== 'client' && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(180,83,9,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h3 style={{ color: 'var(--primary)' }}>AI Case Analysis</h3>
          </div>
          {analysis ? (
            <div style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 20,
              lineHeight: 1.8,
              color: 'var(--text)',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap'
            }}>
              {analysis}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
              <h3>No analysis yet</h3>
              <p>Click "AI Analysis" to get strategic insights</p>
              <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
