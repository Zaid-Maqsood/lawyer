import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { billingAPI, casesAPI, clientsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const INVOICE_STATUS_COLORS = {
  draft: 'var(--text-muted)', sent: 'var(--info)', paid: 'var(--success)',
  overdue: 'var(--error)', cancelled: 'var(--text-light)'
};

function TimeLogModal({ onClose, onSave, cases }) {
  const [form, setForm] = useState({ case_id: '', description: '', hours: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" style={{ maxWidth: 480 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>Log Time</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Case *</label>
              <select className="form-select" required value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                <option value="">Select a case</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" required rows={2} placeholder="Work performed..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Hours *</label>
                <input type="number" className="form-input" required min="0.1" step="0.1" placeholder="1.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Log Time'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function InvoiceModal({ onClose, onSave, cases, clients }) {
  const [form, setForm] = useState({ case_id: '', client_id: '', due_date: '', notes: '', tax_rate: '0', include_time_logs: true });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" style={{ maxWidth: 520 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>Create Invoice</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Client *</label>
              <select className="form-select" required value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">Select a client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Case</label>
              <select className="form-select" value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
                <option value="">Select a case (optional)</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input type="number" className="form-input" min="0" max="100" step="0.1" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} />
              </div>
            </div>
            {form.case_id && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', padding: '12px 14px', background: 'var(--blue-light)', borderRadius: 'var(--radius-sm)' }}>
                <input type="checkbox" checked={form.include_time_logs} onChange={e => setForm(f => ({ ...f, include_time_logs: e.target.checked }))} style={{ width: 16, height: 16 }} />
                Auto-include unbilled time logs for this case
              </label>
            )}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timelogs');
  const [timeLogs, setTimeLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([
      billingAPI.getTimeLogs(),
      billingAPI.getInvoices(),
      casesAPI.getAll(),
      clientsAPI.getAll()
    ]).then(([tl, inv, c, cl]) => {
      setTimeLogs(tl.data);
      setInvoices(inv.data);
      setCases(c.data.cases || []);
      setClients(cl.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateTimeLog = async (form) => {
    const res = await billingAPI.createTimeLog(form);
    setTimeLogs(prev => [res.data, ...prev]);
  };

  const handleDeleteTimeLog = async (id) => {
    if (!window.confirm('Delete this time log?')) return;
    await billingAPI.deleteTimeLog(id);
    setTimeLogs(prev => prev.filter(t => t.id !== id));
  };

  const handleCreateInvoice = async (form) => {
    const res = await billingAPI.createInvoice(form);
    setInvoices(prev => [res.data, ...prev]);
  };

  const handleUpdateStatus = async (id, status) => {
    const paid_date = status === 'paid' ? new Date().toISOString().slice(0, 10) : null;
    const res = await billingAPI.updateInvoiceStatus(id, { status, paid_date });
    setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
  };

  const totalHours = timeLogs.reduce((s, t) => s + parseFloat(t.hours || 0), 0);
  const totalBillable = timeLogs.reduce((s, t) => s + (parseFloat(t.hours || 0) * parseFloat(t.hourly_rate || 0)), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);

  const filteredInvoices = statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices;

  if (loading) {
    return (
      <div>
        <div className="page-header"><div className="skeleton" style={{ width: 200, height: 32 }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Time tracking and invoices</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowTimeModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Log Time
          </button>
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Hours', value: totalHours.toFixed(1) + 'h', color: 'var(--primary)' },
          { label: 'Billable Amount', value: `$${totalBillable.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'var(--info)' },
          { label: 'Total Invoiced', value: `$${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'var(--accent)' },
          { label: 'Total Collected', value: `$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'var(--success)' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'timelogs' ? 'active' : ''}`} onClick={() => setActiveTab('timelogs')}>
          Time Logs ({timeLogs.length})
        </button>
        <button className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
          Invoices ({invoices.length})
        </button>
      </div>

      {/* Time Logs */}
      {activeTab === 'timelogs' && (
        <div className="card" style={{ padding: 0 }}>
          {timeLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <h3>No time logs yet</h3>
              <p>Start tracking billable hours</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowTimeModal(true)}>Log Time</button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Case</th>
                    <th>Lawyer</th>
                    <th>Description</th>
                    <th>Hours</th>
                    <th>Amount</th>
                    <th>Status</th>
                    {user.role !== 'client' && <th style={{ width: 60 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.map((log, i) => (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.case_title || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{log.lawyer_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{parseFloat(log.hours).toFixed(1)}h</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.875rem' }}>
                        ${(parseFloat(log.hours) * parseFloat(log.hourly_rate)).toFixed(0)}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px',
                          borderRadius: 4,
                          background: log.is_billed ? 'var(--success-bg)' : 'var(--warning-bg)',
                          color: log.is_billed ? 'var(--success)' : 'var(--warning)'
                        }}>
                          {log.is_billed ? 'Billed' : 'Unbilled'}
                        </span>
                      </td>
                      {user.role !== 'client' && (
                        <td>
                          <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteTimeLog(log.id)} title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {activeTab === 'invoices' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
              <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '60px 0' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <h3>No invoices found</h3>
                {user.role === 'admin' && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowInvoiceModal(true)}>Create Invoice</button>}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Client</th>
                      <th>Case</th>
                      <th>Total</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      {user.role === 'admin' && <th style={{ width: 140 }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv, i) => (
                      <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                        <td style={{ fontSize: '0.875rem' }}>{inv.client_name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.case_title || '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>${parseFloat(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'capitalize',
                            background: `${INVOICE_STATUS_COLORS[inv.status]}18`,
                            color: INVOICE_STATUS_COLORS[inv.status]
                          }}>
                            {inv.status}
                          </span>
                        </td>
                        {user.role === 'admin' && (
                          <td>
                            <select
                              className="form-select"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', width: '100%' }}
                              value={inv.status}
                              onChange={e => handleUpdateStatus(inv.id, e.target.value)}
                            >
                              {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showTimeModal && <TimeLogModal onClose={() => setShowTimeModal(false)} onSave={handleCreateTimeLog} cases={cases} />}
        {showInvoiceModal && <InvoiceModal onClose={() => setShowInvoiceModal(false)} onSave={handleCreateInvoice} cases={cases} clients={clients} />}
      </AnimatePresence>
    </div>
  );
}
