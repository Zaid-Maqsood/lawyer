import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { templatesAPI, clientsAPI, casesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Contract', 'Letter', 'Motion', 'Agreement', 'Notice', 'Brief', 'Other'];

function TemplateModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', description: '', category: 'Contract', content: '', variables: []
  });
  const [varInput, setVarInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addVariable = () => {
    const v = varInput.trim();
    if (v && !form.variables.includes(v)) {
      setForm(f => ({ ...f, variables: [...f.variables, v] }));
    }
    setVarInput('');
  };

  const removeVariable = (v) => setForm(f => ({ ...f, variables: f.variables.filter(x => x !== v) }));

  const insertVar = (v) => {
    const textarea = document.getElementById('template-content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.content;
      const newText = text.substring(0, start) + `{{${v}}}` + text.substring(end);
      setForm(f => ({ ...f, content: newText }));
      setTimeout(() => { textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + v.length + 4; }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'auto' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>{initial ? 'Edit Template' : 'New Template'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Template Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Non-Disclosure Agreement" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this template" />
            </div>

            {/* Variables */}
            <div className="form-group">
              <label className="form-label">Template Variables</label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                Define variables to auto-fill. Use <code style={{ background: 'var(--bg-muted)', padding: '1px 4px', borderRadius: 3 }}>{'{{variable_name}}'}</code> in the content below.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  className="form-input"
                  placeholder="variable_name"
                  value={varInput}
                  onChange={e => setVarInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-secondary" onClick={addVariable}>Add</button>
              </div>
              {form.variables.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.variables.map(v => (
                    <div key={v} style={{
                      display: 'flex', gap: 6, alignItems: 'center',
                      background: 'var(--blue-light)', padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--primary)'
                    }}>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem', padding: 0 }} onClick={() => insertVar(v)} title="Insert into content">
                        {'{{' + v + '}}'}
                      </button>
                      <button type="button" onClick={() => removeVariable(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Template Content *</label>
              <textarea
                id="template-content"
                className="form-textarea"
                required
                rows={14}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Enter the template content here. Use {{variable_name}} for dynamic fields..."
                style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.8 }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initial ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function FillModal({ template, onClose }) {
  const [vars, setVars] = useState({});
  const [result, setResult] = useState('');
  const [filling, setFilling] = useState(false);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);

  useEffect(() => {
    clientsAPI.getAll().then(r => setClients(r.data)).catch(() => {});
    casesAPI.getAll().then(r => setCases(r.data.cases || [])).catch(() => {});
    // Initialize empty vars
    const init = {};
    (template.variables || []).forEach(v => { init[v] = ''; });
    setVars(init);
  }, [template]);

  const handleFill = async () => {
    setFilling(true);
    try {
      const res = await templatesAPI.fill(template.id, { variables: vars });
      setResult(res.data.content);
    } finally {
      setFilling(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>Fill Template: {template.name}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          {(template.variables || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fill in the variables to generate the document:</p>
              {template.variables.map(v => (
                <div key={v} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                  {v === 'client_name' ? (
                    <select className="form-select" value={vars[v]} onChange={e => setVars(prev => ({ ...prev, [v]: e.target.value }))}>
                      <option value="">Type or select...</option>
                      {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : v === 'case_title' ? (
                    <select className="form-select" value={vars[v]} onChange={e => setVars(prev => ({ ...prev, [v]: e.target.value }))}>
                      <option value="">Type or select...</option>
                      {cases.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      type={v.includes('date') ? 'date' : 'text'}
                      value={vars[v]}
                      onChange={e => setVars(prev => ({ ...prev, [v]: e.target.value }))}
                      placeholder={`Enter ${v}...`}
                    />
                  )}
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleFill} disabled={filling} style={{ alignSelf: 'flex-start' }}>
                {filling ? 'Generating...' : 'Generate Document'}
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleFill} disabled={filling} style={{ marginBottom: 20 }}>
              {filling ? 'Generating...' : 'Generate Document'}
            </button>
          )}

          {result && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Generated Document</span>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
              <div style={{
                background: 'var(--bg-muted)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: 20,
                fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.9,
                whiteSpace: 'pre-wrap', color: 'var(--text)', maxHeight: 400, overflow: 'auto'
              }}>
                {result}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [fillTemplate, setFillTemplate] = useState(null);

  const fetchTemplates = () => {
    const params = categoryFilter ? { category: categoryFilter } : {};
    templatesAPI.getAll(params)
      .then(r => setTemplates(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, [categoryFilter]);

  const handleCreate = async (form) => { await templatesAPI.create(form); fetchTemplates(); };
  const handleUpdate = async (form) => { await templatesAPI.update(editTemplate.id, form); fetchTemplates(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await templatesAPI.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Templates</h1>
          <p className="page-subtitle">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        {user.role !== 'client' && (
          <button className="btn btn-primary" onClick={() => { setEditTemplate(null); setShowModal(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Template
          </button>
        )}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['', ...CATEGORIES].map(c => (
          <button key={c} className={`chip ${categoryFilter === c ? 'active' : ''}`} onClick={() => setCategoryFilter(c)}>
            {c || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <h3>No templates yet</h3>
            <p>Create reusable document templates to speed up your workflow</p>
            {user.role !== 'client' && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>New Template</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {templates.map((tmpl, i) => (
            <motion.div
              key={tmpl.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card"
              style={{ padding: 20, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                {user.role !== 'client' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditTemplate(tmpl); setShowModal(true); }} title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(tmpl.id)} title="Delete" style={{ color: 'var(--error)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: 4 }}>{tmpl.name}</div>
                {tmpl.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 10 }}>{tmpl.description}</p>}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {tmpl.category && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                      background: 'var(--bg-muted)', borderRadius: 4, color: 'var(--text-muted)'
                    }}>{tmpl.category}</span>
                  )}
                  {(tmpl.variables || []).length > 0 && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                      background: 'var(--blue-light)', borderRadius: 4, color: 'var(--primary)'
                    }}>{tmpl.variables.length} variable{tmpl.variables.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setFillTemplate(tmpl)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Use Template
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <TemplateModal
            onClose={() => { setShowModal(false); setEditTemplate(null); }}
            onSave={editTemplate ? handleUpdate : handleCreate}
            initial={editTemplate}
          />
        )}
        {fillTemplate && <FillModal template={fillTemplate} onClose={() => setFillTemplate(null)} />}
      </AnimatePresence>
    </div>
  );
}
