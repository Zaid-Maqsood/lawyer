import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', role: 'lawyer', hourly_rate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match.');
    }

    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const { confirm_password, ...data } = form;
      await register(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1L3 5v6c0 5.25 3.75 10.14 9 11.33C17.25 21.14 21 16.25 21 11V5l-9-4z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>LexAI</span>
          </Link>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.6rem', color: 'var(--primary)', marginBottom: 6, textAlign: 'center' }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: 28 }}>
            Start managing your legal practice today
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" className="form-input" placeholder="Jane Smith" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" className="form-input" placeholder="jane@lawfirm.com" value={form.email} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="role">Role</label>
                <select id="role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                  <option value="admin">Admin</option>
                  <option value="lawyer">Lawyer</option>
                </select>
              </div>
              {(form.role === 'lawyer' || form.role === 'admin') && (
                <div className="form-group">
                  <label className="form-label" htmlFor="hourly_rate">Hourly Rate ($)</label>
                  <input id="hourly_rate" name="hourly_rate" type="number" className="form-input" placeholder="250" value={form.hourly_rate} onChange={handleChange} min="0" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm_password">Confirm Password</label>
              <input id="confirm_password" name="confirm_password" type="password" className="form-input" placeholder="Repeat password" value={form.confirm_password} onChange={handleChange} required />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
