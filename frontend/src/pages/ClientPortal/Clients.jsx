import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clientsAPI } from '../../services/api';

function ClientModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', email: '', phone: '', company: '', address: '', notes: '',
    create_portal_access: false, portal_password: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

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
      <motion.div className="modal" style={{ maxWidth: 560 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="modal-header">
          <h2>{initial ? 'Edit Client' : 'New Client'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Full Name *</label>
                <input name="name" className="form-input" required value={form.name} onChange={handleChange} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input name="email" type="email" className="form-input" required value={form.email} onChange={handleChange} placeholder="jane@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="+1-555-0100" />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input name="company" className="form-input" value={form.company} onChange={handleChange} placeholder="Acme Corp" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input name="address" className="form-input" value={form.address} onChange={handleChange} placeholder="123 Main St, City" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Notes</label>
                <textarea name="notes" className="form-textarea" value={form.notes} onChange={handleChange} rows={2} placeholder="Internal notes..." />
              </div>
              {!initial && (
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                    <input type="checkbox" name="create_portal_access" checked={form.create_portal_access} onChange={handleChange} style={{ width: 16, height: 16 }} />
                    Create client portal access
                  </label>
                  {form.create_portal_access && (
                    <input
                      name="portal_password"
                      type="password"
                      className="form-input"
                      placeholder="Portal password (min. 6 chars)"
                      value={form.portal_password}
                      onChange={handleChange}
                      style={{ marginTop: 10 }}
                      minLength={6}
                      required
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initial ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [error, setError] = useState('');

  const fetchClients = async () => {
    try {
      const res = await clientsAPI.getAll({ search });
      setClients(res.data);
    } catch {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [search]);

  const handleCreate = async (form) => {
    await clientsAPI.create(form);
    fetchClients();
  };

  const handleUpdate = async (form) => {
    await clientsAPI.update(editClient.id, form);
    fetchClients();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? Their cases will be unlinked.')) return;
    await clientsAPI.delete(id);
    setClients(cs => cs.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditClient(null); setShowModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Client
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="search-input" style={{ maxWidth: 360 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>No clients found</h3>
            <p>{search ? `No results for "${search}"` : 'Add your first client to get started'}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>New Client</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {clients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card"
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--blue-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'EB Garamond, serif',
                    fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)'
                  }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/clients/${client.id}`} style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', textDecoration: 'none' }}>
                      {client.name}
                    </Link>
                    {client.company && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{client.company}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditClient(client); setShowModal(true); }} title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(client.id)} title="Delete" style={{ color: 'var(--error)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {client.email}
                </div>
                {client.phone && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.83 5.83l1.58-1.58a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {client.phone}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {client.case_count || 0} case{client.case_count !== 1 ? 's' : ''}
                </span>
                <Link to={`/clients/${client.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                  View Details
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ClientModal
            onClose={() => { setShowModal(false); setEditClient(null); }}
            onSave={editClient ? handleUpdate : handleCreate}
            initial={editClient}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
