import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { analyticsAPI } from '../services/api';

const STATUS_COLORS = { open: '#0284C7', active: '#16A34A', pending: '#D97706', closed: '#94A3B8', archived: '#CBD5E1' };
const PRIORITY_COLORS = { low: '#94A3B8', medium: '#3B82F6', high: '#D97706', urgent: '#DC2626' };
const INVOICE_COLORS = { draft: '#94A3B8', sent: '#0284C7', paid: '#16A34A', overdue: '#DC2626', cancelled: '#CBD5E1' };

function ChartCard({ title, children, style }) {
  return (
    <div className="card" style={{ padding: 24, ...style }}>
      <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--primary)' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [caseData, setCaseData] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getCaseAnalytics(),
      analyticsAPI.getBillingAnalytics()
    ]).then(([c, b]) => {
      setCaseData(c.data);
      setBillingData(b.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ width: 200, height: 32 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}
        </div>
      </div>
    );
  }

  const statusData = (caseData?.byStatus || []).map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: parseInt(s.count),
    color: STATUS_COLORS[s.status] || '#94A3B8'
  }));

  const priorityData = (caseData?.byPriority || []).map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: parseInt(p.count),
    color: PRIORITY_COLORS[p.priority] || '#94A3B8'
  }));

  const practiceData = (caseData?.byPracticeArea || []).map(p => ({
    name: p.practice_area || 'Other',
    count: parseInt(p.count)
  }));

  const timelineData = (caseData?.timeline || []).map(t => ({
    month: new Date(t.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    cases: parseInt(t.new_cases)
  }));

  const invoiceStatusData = (billingData?.invoiceStats || []).map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    count: parseInt(s.count),
    total: parseFloat(s.total),
    color: INVOICE_COLORS[s.status] || '#94A3B8'
  }));

  const lawyerData = (billingData?.lawyerRevenue || []).map(l => ({
    name: l.lawyer_name,
    revenue: parseFloat(l.revenue),
    hours: parseFloat(l.total_hours)
  }));

  const topClientsData = (billingData?.topClients || []).map(c => ({
    name: c.client_name,
    billed: parseFloat(c.total_billed)
  }));

  const totalCases = statusData.reduce((s, d) => s + d.value, 0);
  const totalRevenue = invoiceStatusData.find(s => s.name === 'Paid')?.total || 0;
  const totalHours = lawyerData.reduce((s, l) => s + l.hours, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Firm performance and insights</p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Cases', value: totalCases, color: 'var(--primary)' },
          { label: 'Practice Areas', value: practiceData.length, color: 'var(--info)' },
          { label: 'Revenue Collected', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'var(--success)' },
          { label: 'Total Hours Logged', value: totalHours.toFixed(0) + 'h', color: 'var(--accent)' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <ChartCard title="Cases by Status">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => [v, 'Cases']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No data</p></div>}
        </ChartCard>

        <ChartCard title="Cases by Priority">
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => [v, 'Cases']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No data</p></div>}
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <ChartCard title="New Cases Over Time (12 months)">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'New Cases']} />
                <Line type="monotone" dataKey="cases" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No timeline data</p></div>}
        </ChartCard>

        <ChartCard title="Cases by Practice Area">
          {practiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={practiceData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={100} />
                <Tooltip formatter={(v) => [v, 'Cases']} />
                <Bar dataKey="count" fill="var(--blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No practice area data</p></div>}
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <ChartCard title="Invoice Status Breakdown">
          {invoiceStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={invoiceStatusData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v, name) => name === 'total' ? [`$${parseFloat(v).toLocaleString()}`, 'Amount'] : [v, 'Count']} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {invoiceStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No invoice data</p></div>}
        </ChartCard>

        <ChartCard title="Revenue by Lawyer">
          {lawyerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lawyerData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v, name) => name === 'revenue' ? [`$${parseFloat(v).toLocaleString()}`, 'Revenue'] : [v + 'h', 'Hours']} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No lawyer revenue data</p></div>}
        </ChartCard>
      </div>

      {topClientsData.length > 0 && (
        <ChartCard title="Top Clients by Revenue">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topClientsData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(v) => [`$${parseFloat(v).toLocaleString()}`, 'Billed']} />
              <Bar dataKey="billed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
