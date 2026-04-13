import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 46, height: 46,
              background: 'var(--primary)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1L3 5v6c0 5.25 3.75 10.14 9 11.33C17.25 21.14 21 16.25 21 11V5l-9-4z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>LexAI</span>
          </Link>
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.9rem' }}>
            Sign in to your legal workspace
          </p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.7rem', color: 'var(--primary)', marginBottom: 24, textAlign: 'center' }}>
            Welcome Back
          </h1>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@lawfirm.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: 24,
            padding: 16,
            background: 'var(--blue-light)',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(59,130,246,0.2)'
          }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo Accounts
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Admin', email: 'admin@lexai.com', password: 'admin123' },
                { label: 'Lawyer', email: 'james@lexai.com', password: 'lawyer123' },
                { label: 'Client', email: 'client1@lexai.com', password: 'client123' }
              ].map(cred => (
                <button
                  key={cred.label}
                  onClick={() => fillDemo(cred.email, cred.password)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 0', fontSize: '0.8rem', color: 'var(--text-muted)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <strong style={{ color: 'var(--primary)' }}>{cred.label}</strong>
                  <span>{cred.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Create one</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: 'var(--text-light)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to homepage</Link>
        </p>
      </motion.div>
    </div>
  );
}
