import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { casesAPI, clientsAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABELS = { open: 'Open', active: 'Active', pending: 'Pending', closed: 'Closed', archived: 'Archived' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function CaseModal({ onClose, onSave, initial }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initial || {
    title: '', description: '', client_id: '', assigned_lawyer_id: '',
    status: 'open', priority: 'medium', practice_area: '', court: '',
    filing_date: '', due_date: ''
  });
  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user.role !== 'client') {
      clientsAPI.getAll().then(r => setClients(r.data)).catch(() => {});
    }
    if (user.role === 'admin') {
      authAPI.getAllUsers().then(r => setLawyers(r.data.filter(u => u.role !== 'client'))).catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" style={{ maxWidth: 600 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>{initial ? 'Edit Case' : 'New Case'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Case Title *</label>
              <input name="title" className="form-input" required value={form.title} onChange={handleChange} placeholder="e.g. Smith v. Johnson Contract Dispute" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange} placeholder="Brief description of the case..." rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            {clients.length > 0 && (
              <div className="form-group">
                <label className="form-label">Client</label>
                <select name="client_id" className="form-select" value={form.client_id} onChange={handleChange}>
                  <option value="">Select a client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {lawyers.length > 0 && (
              <div className="form-group">
                <label className="form-label">Assigned Lawyer</label>
                <select name="assigned_lawyer_id" className="form-select" value={form.assigned_lawyer_id} onChange={handleChange}>
                  <option value="">Select a lawyer</option>
                  {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Practice Area</label>
                <input name="practice_area" className="form-input" value={form.practice_area} onChange={handleChange} placeholder="e.g. Corporate Law" />
              </div>
              <div className="form-group">
                <label className="form-label">Court</label>
                <input name="court" className="form-input" value={form.court} onChange={handleChange} placeholder="e.g. District Court" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Filing Date</label>
                <input name="filing_date" type="date" className="form-input" value={form.filing_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input name="due_date" type="date" className="form-input" value={form.due_date} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initial ? 'Update Case' : 'Create Case'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Cases() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCase, setEditCase] = useState(null);
  const [error, setError] = useState('');

  const fetchCases = async () => {
    try {
      const res = await casesAPI.getAll({ search, status: statusFilter });
      setCases(res.data.cases || []);
    } catch {
      setError('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter]);

  const handleCreate = async (form) => {
    await casesAPI.create(form);
    fetchCases();
  };

  const handleUpdate = async (form) => {
    await casesAPI.update(editCase.id, form);
    fetchCases();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this case? This action cannot be undone.')) return;
    await casesAPI.delete(id);
    setCases(cs => cs.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">{cases.length} case{cases.length !== 1 ? 's' : ''} found</p>
        </div>
        {user.role !== 'client' && (
          <button className="btn btn-primary" onClick={() => { setEditCase(null); setShowModal(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'open', 'active', 'pending', 'closed'].map(s => (
            <button
              key={s}
              className={`chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 76 }} />)}
        </div>
      ) : cases.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <h3>No cases found</h3>
            <p>{search ? `No results for "${search}"` : 'Create your first case to get started'}</p>
            {user.role !== 'client' && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>New Case</button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Client</th>
                <th>Lawyer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                {user.role !== 'client' && <th style={{ width: 80 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td>
                    <Link to={`/cases/${c.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 3 }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.case_number}</div>
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{c.client_name || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{c.lawyer_name || '—'}</td>
                  <td><span className={`badge status-${c.status}`}>{STATUS_LABELS[c.status] || c.status}</span></td>
                  <td><span className={`badge priority-${c.priority}`}>{PRIORITY_LABELS[c.priority] || c.priority}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {c.due_date ? new Date(c.due_date).toLocaleDateString() : '—'}
                  </td>
                  {user.role !== 'client' && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit"
                          onClick={() => { setEditCase(c); setShowModal(true); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {user.role === 'admin' && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Delete"
                            onClick={() => handleDelete(c.id)}
                            style={{ color: 'var(--error)' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CaseModal
            onClose={() => { setShowModal(false); setEditCase(null); }}
            onSave={editCase ? handleUpdate : handleCreate}
            initial={editCase}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
