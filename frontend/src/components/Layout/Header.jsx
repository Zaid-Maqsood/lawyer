import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { searchAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);

    if (val.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchAPI.global(val);
        setResults(res.data);
        setShowResults(true);
      } catch {}
      setSearching(false);
    }, 350);
  };

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setQuery('');
    if (type === 'case') navigate(`/cases/${id}`);
    else if (type === 'client') navigate(`/clients/${id}`);
    else if (type === 'document') navigate('/documents');
  };

  const totalResults = results ? (results.cases?.length + results.documents?.length + results.clients?.length) : 0;

  return (
    <header style={{
      height: 65,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0
    }}>
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="btn btn-ghost btn-icon"
        style={{ display: 'none' }}
        id="mobile-menu-btn"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Search */}
      {user?.role !== 'client' && (
        <div ref={searchRef} style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
          <div className="search-input">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search cases, clients, documents..."
              value={query}
              onChange={handleSearch}
              onFocus={() => results && setShowResults(true)}
              style={{ paddingLeft: 40, paddingRight: 40 }}
            />
            {searching && (
              <div className="spinner" style={{ position: 'absolute', right: 12, width: 16, height: 16 }} />
            )}
          </div>

          <AnimatePresence>
            {showResults && results && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0, right: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  overflow: 'hidden',
                  maxHeight: 380,
                  overflowY: 'auto'
                }}
              >
                {totalResults === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No results found for "{query}"
                  </div>
                ) : (
                  <div>
                    {results.cases?.length > 0 && (
                      <div>
                        <div style={{ padding: '10px 16px 6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cases</div>
                        {results.cases.map(c => (
                          <button key={c.id} onClick={() => handleResultClick('case', c.id)}
                            style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                            </svg>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{c.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.case_number} • {c.client_name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.clients?.length > 0 && (
                      <div>
                        <div style={{ padding: '10px 16px 6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clients</div>
                        {results.clients.map(c => (
                          <button key={c.id} onClick={() => handleResultClick('client', c.id)}
                            style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email} {c.company ? `• ${c.company}` : ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.documents?.length > 0 && (
                      <div>
                        <div style={{ padding: '10px 16px 6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Documents</div>
                        {results.documents.map(d => (
                          <button key={d.id} onClick={() => handleResultClick('document', d.id)}
                            style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{d.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.case_title || 'No case'}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* User greeting */}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Welcome back, <strong style={{ color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</strong>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
