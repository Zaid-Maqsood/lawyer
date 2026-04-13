import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: ['admin', 'lawyer', 'client'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    label: 'Cases',
    path: '/cases',
    roles: ['admin', 'lawyer', 'client'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    )
  },
  {
    label: 'Documents',
    path: '/documents',
    roles: ['admin', 'lawyer', 'client'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )
  },
  {
    label: 'Templates',
    path: '/templates',
    roles: ['admin', 'lawyer'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    )
  },
  {
    label: 'AI Assistant',
    path: '/ai',
    roles: ['admin', 'lawyer'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
        <path d="M12 6v6l4 2"/>
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
    badge: 'AI'
  },
  {
    label: 'Clients',
    path: '/clients',
    roles: ['admin', 'lawyer'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    label: 'Billing',
    path: '/billing',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    )
  },
  {
    label: 'Analytics',
    path: '/analytics',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  }
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  const sidebarContent = (
    <div style={{
      width: 256,
      height: '100vh',
      background: 'var(--primary)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 40
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1L3 5v6c0 5.25 3.75 10.14 9 11.33C17.25 21.14 21 16.25 21 11V5l-9-4z"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'EB Garamond, serif', fontWeight: 700, lineHeight: 1 }}>LexAI</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Legal Platform</div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              marginBottom: 2,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: isActive ? 700 : 400,
              transition: 'all 0.15s ease',
              position: 'relative'
            })}
            className="nav-item"
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                background: 'rgba(180,83,9,0.9)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 100,
                letterSpacing: '0.04em'
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <style>{`
        .nav-item:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.1) !important;
        }
      `}</style>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 12px' }} />

      {/* User section */}
      <div style={{ padding: 16 }}>
        <NavLink
          to="/profile"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            cursor: 'pointer',
            marginBottom: 8
          }}
          className="nav-item"
        >
          <div style={{
            width: 34, height: 34,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: '#fff',
            flexShrink: 0
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 'var(--radius)',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop">
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="sidebar-mobile"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 40 }}
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .sidebar-desktop { display: flex; }
        .sidebar-mobile { display: none; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none; }
          .sidebar-mobile { display: flex; }
        }
      `}</style>
    </>
  );
}
