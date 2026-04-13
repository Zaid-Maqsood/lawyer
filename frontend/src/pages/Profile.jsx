import React, { useState } from 'react';
import { motion } from 'motion/react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { admin: 'Administrator', lawyer: 'Lawyer', client: 'Client' };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    hourly_rate: user?.hourly_rate || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pwForm.new_password !== pwForm.confirm_password) {
      return setPwMsg({ type: 'error', text: 'Passwords do not match.' });
    }
    if (pwForm.new_password.length < 6) {
      return setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {/* User card */}
      <motion.div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--blue-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'EB Garamond, serif', fontWeight: 700, fontSize: '1.8rem', color: 'var(--primary)',
          flexShrink: 0
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)', marginBottom: 4 }}>{user?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 8 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
              background: 'var(--blue-light)', color: 'var(--primary)',
              borderRadius: 'var(--radius-sm)', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            {user?.hourly_rate > 0 && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
                background: 'var(--success-bg)', color: 'var(--success)',
                borderRadius: 'var(--radius-sm)'
              }}>
                ${user.hourly_rate}/hr
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Info</button>
        <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>Change Password</button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: 20 }}>Personal Information</h3>

          {profileMsg.text && (
            <div className={`alert alert-${profileMsg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 20 }}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                required
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                value={user?.email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Email cannot be changed.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1-555-0100"
              />
            </div>

            {(user?.role === 'lawyer' || user?.role === 'admin') && (
              <div className="form-group">
                <label className="form-label">Hourly Rate ($)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="0.01"
                  value={profileForm.hourly_rate}
                  onChange={e => setProfileForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  placeholder="e.g. 250"
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                {profileSaving ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Saving...</>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: 20 }}>Change Password</h3>

          {pwMsg.text && (
            <div className={`alert alert-${pwMsg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 20 }}>
              {pwMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-input"
                required
                value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="Your current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-input"
                required
                minLength={6}
                value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-input"
                required
                value={pwForm.confirm_password}
                onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                placeholder="Repeat new password"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                {pwSaving ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Updating...</>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
