import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  open: '#0284C7', active: '#16A34A', pending: '#D97706', closed: '#94A3B8', archived: '#CBD5E1'
};
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_LABELS = { open: 'Open', active: 'Active', pending: 'Pending', closed: 'Closed', archived: 'Archived' };

function StatCard({ label, value, icon, color, sub, delay = 0 }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color }}>{value}</div>
          {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{
          width: 48, height: 48,
          background: `${color}14`,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function RecentCases({ cases }) {
  if (!cases?.length) {
    return (
      <div className="empty-state" style={{ padding: '32px 0' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        </svg>
        <h3>No cases yet</h3>
        <p>Create your first case to get started</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {cases.map((c, i) => (
        <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
          <Link to={`/cases/${c.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 16px', background: 'var(--bg-muted)',
            borderRadius: 'var(--radius)', textDecoration: 'none', transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}
          >
            <div style={{ width: 40, height: 40, background: 'var(--bg-card)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.client_name || 'No client'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <span className={`badge status-${c.status}`}>{STATUS_LABELS[c.status] || c.status}</span>
              <span className={`badge priority-${c.priority}`}>{PRIORITY_LABELS[c.priority] || c.priority}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function LawyerDashboard({ stats, user }) {
  const tl = stats.timeLogs || {};
  const caseStatusData = (stats.casesByStatus || []).map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: parseInt(s.count),
    color: STATUS_COLORS[s.status] || '#94A3B8'
  }));
  const hoursData = (stats.hoursByMonth || []).map(h => ({
    month: h.month,
    hours: parseFloat(h.hours)
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">Your caseload and activity overview</p>
        </div>
        <Link to="/cases" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Case
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="My Cases" value={stats.cases?.total || 0} color="var(--primary)" delay={0}
          sub={`${stats.cases?.active || 0} active · ${stats.cases?.open || 0} open`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
        />
        <StatCard label="My Clients" value={stats.clients?.total || 0} color="#0284C7" delay={0.06}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Hours This Month" value={`${parseFloat(tl.hours_this_month || 0).toFixed(1)}h`} color="var(--success)" delay={0.12}
          sub={`${parseFloat(tl.total_hours || 0).toFixed(1)}h total logged`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Unbilled Amount" value={`$${parseFloat(tl.unbilled || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`} color="var(--accent)" delay={0.18}
          sub={`$${parseFloat(tl.total_billable || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} total billable`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--primary)' }}>My Cases by Status</h3>
          {caseStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={caseStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {caseStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => [v, 'Cases']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No case data yet</p></div>}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--primary)' }}>Hours Logged (Last 6 Months)</h3>
          {hoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hoursData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `${v}h`} />
                <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
                <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No hours logged yet</p></div>}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>My Recent Cases</h3>
          <Link to="/cases" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>View All</Link>
        </div>
        <RecentCases cases={stats.recentCases} />
      </div>
    </div>
  );
}

function AdminDashboard({ stats, user }) {
  const caseStatusData = (stats.casesByStatus || []).map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: parseInt(s.count),
    color: STATUS_COLORS[s.status] || '#94A3B8'
  }));
  const revenueData = (stats.revenueByMonth || []).map(r => ({
    month: r.month,
    revenue: parseFloat(r.revenue)
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">Here's what's happening at your firm today</p>
        </div>
        <Link to="/cases" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Case
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Total Cases" value={stats.cases?.total || 0} color="var(--primary)" delay={0}
          sub={`${stats.cases?.active || 0} active · ${stats.cases?.closed || 0} closed`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
        />
        <StatCard label="Total Clients" value={stats.clients?.total || 0} color="#0284C7" delay={0.06}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Revenue (Paid)" value={`$${parseFloat(stats.billing?.total_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`} color="var(--success)" delay={0.12}
          sub={`$${parseFloat(stats.billing?.outstanding || 0).toLocaleString()} outstanding`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
        <StatCard label="Documents" value={stats.documents?.total || 0} color="var(--accent)" delay={0.18}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--primary)' }}>Cases by Status</h3>
          {caseStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={caseStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {caseStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => [v, 'Cases']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No case data yet</p></div>}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--primary)' }}>Revenue (Last 6 Months)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No revenue data yet</p></div>}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Recent Cases</h3>
          <Link to="/cases" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>View All</Link>
        </div>
        <RecentCases cases={stats.recentCases} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 260, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 180, height: 18 }} />
          </div>
        </div>
        <div className="grid-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  if (user?.role === 'lawyer') return <LawyerDashboard stats={stats} user={user} />;
  return <AdminDashboard stats={stats} user={user} />;
}
