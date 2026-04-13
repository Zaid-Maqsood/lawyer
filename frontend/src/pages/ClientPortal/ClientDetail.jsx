import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { clientsAPI } from '../../services/api';

const STATUS_LABELS = { open: 'Open', active: 'Active', pending: 'Pending', closed: 'Closed', archived: 'Archived' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsAPI.getById(id)
      .then(r => setClient(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 20 }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>Client not found</h3>
          <Link to="/clients" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Clients</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/clients" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Clients</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{client.name}</span>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'EB Garamond, serif', fontWeight: 700, fontSize: '1.6rem', color: 'var(--primary)',
            flexShrink: 0
          }}>
            {client.name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.8rem', color: 'var(--primary)', marginBottom: 4 }}>{client.name}</h1>
            {client.company && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>{client.company}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'Email', value: client.email },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.83 5.83l1.58-1.58a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, label: 'Phone', value: client.phone || '—' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Address', value: client.address || '—' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <div style={{
              padding: '8px 16px',
              background: client.portal_active ? 'var(--success-bg)' : 'var(--bg-muted)',
              border: `1px solid ${client.portal_active ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem', fontWeight: 600,
              color: client.portal_active ? 'var(--success)' : 'var(--text-muted)'
            }}>
              {client.portal_active ? 'Portal Active' : 'No Portal Access'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              Client since {new Date(client.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {client.notes && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Internal Notes</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{client.notes}</p>
          </div>
        )}
      </div>

      {/* Cases */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'var(--primary)' }}>Cases ({(client.cases || []).length})</h3>
          <Link to={`/cases`} className="btn btn-primary btn-sm">New Case</Link>
        </div>

        {(client.cases || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            <h3>No cases yet</h3>
            <p>This client has no associated cases</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {client.cases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/cases/${c.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 16px',
                  background: 'var(--bg-muted)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                  transition: 'background var(--transition)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {c.case_number} {c.lawyer_name && `• ${c.lawyer_name}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span className={`badge status-${c.status}`}>{STATUS_LABELS[c.status] || c.status}</span>
                    <span className={`badge priority-${c.priority}`}>{PRIORITY_LABELS[c.priority] || c.priority}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
