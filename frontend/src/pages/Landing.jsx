import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } }
};

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--primary)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1L3 5v6c0 5.25 3.75 10.14 9 11.33C17.25 21.14 21 16.25 21 11V5l-9-4z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>LexAI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F0F9FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 32px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(30,58,138,0.06) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute', bottom: -150, left: -100,
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(30,58,138,0.08)',
                border: '1px solid rgba(30,58,138,0.15)',
                borderRadius: 100,
                padding: '6px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: 28,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                AI-Powered Legal Intelligence
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{
              fontFamily: 'EB Garamond, serif',
              fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
              fontWeight: 700,
              color: 'var(--primary)',
              lineHeight: 1.15,
              marginBottom: 24,
              maxWidth: 820,
              margin: '0 auto 24px'
            }}>
              The Future of Legal<br />
              <span style={{ color: 'var(--accent)' }}>Practice Management</span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-muted)',
              maxWidth: 580,
              margin: '0 auto 40px',
              lineHeight: 1.7
            }}>
              Streamline your law firm with AI-powered case management, intelligent document analysis, automated billing, and client collaboration — all in one platform.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                View Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{
              display: 'flex',
              gap: 40,
              justifyContent: 'center',
              marginTop: 64,
              flexWrap: 'wrap'
            }}
          >
            {[
              { value: '500+', label: 'Law Firms' },
              { value: '50K+', label: 'Cases Managed' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9/5', label: 'Client Rating' }
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <div style={{
              display: 'inline-block', background: 'var(--blue-light)',
              color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700,
              padding: '4px 16px', borderRadius: 100, marginBottom: 16,
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Core Features
            </div>
            <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--primary)', marginBottom: 16 }}>
              Everything Your Firm Needs
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
              From case intake to invoice generation, LexAI handles your entire legal workflow.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {[
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M12 8v4l3 3"/></svg>,
                title: 'AI Legal Assistant',
                desc: 'Analyze documents, extract key clauses, get instant case strategy insights — powered by GPT-4.',
                color: 'var(--primary)'
              },
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
                title: 'Case Management',
                desc: 'Track cases, timelines, deadlines, and notes. Stay on top of every matter with ease.',
                color: '#0284C7'
              },
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                title: 'Document Automation',
                desc: 'Upload PDFs, generate documents from templates, and auto-fill client data instantly.',
                color: '#16A34A'
              },
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
                title: 'Time & Billing',
                desc: 'Log hours, track billable time, generate professional invoices in one click.',
                color: 'var(--accent)'
              },
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: 'Client Portal',
                desc: 'Clients can log in, view their cases, download documents, and send messages securely.',
                color: '#7C3AED'
              },
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                title: 'Analytics Dashboard',
                desc: 'Visualize case outcomes, revenue trends, and firm performance at a glance.',
                color: '#DB2777'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                style={{ padding: 32, cursor: 'default' }}
              >
                <div style={{
                  width: 52, height: 52,
                  background: `${feature.color}14`,
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: feature.color,
                  marginBottom: 20
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.2rem', color: 'var(--primary)', marginBottom: 10 }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 32px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--primary)', marginBottom: 12 }}>
              Get Started in Minutes
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No setup complexity — your firm is operational immediately.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
            {[
              { step: '01', title: 'Create Your Account', desc: 'Register your firm and invite your legal team with role-based access.' },
              { step: '02', title: 'Add Your Cases', desc: 'Import or create cases, assign lawyers, and link clients instantly.' },
              { step: '03', title: 'Upload Documents', desc: 'Drag and drop legal files for AI-powered analysis and extraction.' },
              { step: '04', title: 'Scale Your Practice', desc: 'Track time, generate invoices, and grow with data-driven insights.' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ textAlign: 'center', padding: '32px 20px' }}
              >
                <div style={{
                  fontFamily: 'EB Garamond, serif',
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: 'var(--border)',
                  lineHeight: 1,
                  marginBottom: 16
                }}>{item.step}</div>
                <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.15rem', color: 'var(--primary)', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--primary)', textAlign: 'center', marginBottom: 52 }}
          >
            Trusted by Leading Law Firms
          </motion.h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                quote: "LexAI transformed how we manage cases. The AI document analysis alone saves us 10+ hours per week.",
                name: "Sarah Mitchell",
                role: "Managing Partner, Mitchell & Associates"
              },
              {
                quote: "The client portal has dramatically improved our communication. Clients love the transparency.",
                name: "James Harrison",
                role: "Senior Counsel, Harrison Law Group"
              },
              {
                quote: "Invoice generation used to take hours. Now it's seconds. The ROI was immediate.",
                name: "Elena Rodriguez",
                role: "Founder, Rodriguez Legal"
              }
            ].map((t, i) => (
              <motion.div
                key={i}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: 28 }}
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 32px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #1E40AF 100%)',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: 16 }}>
            Ready to Modernize Your Practice?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
            Join hundreds of law firms already using LexAI to work smarter.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px',
              background: '#fff',
              color: 'var(--primary)',
              borderRadius: 'var(--radius)',
              fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
            >
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '14px 32px',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              borderRadius: 'var(--radius)',
              fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px',
        background: 'var(--primary)',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1L3 5v6c0 5.25 3.75 10.14 9 11.33C17.25 21.14 21 16.25 21 11V5l-9-4z"/>
          </svg>
          <span style={{ color: '#fff', fontFamily: 'EB Garamond, serif', fontSize: '1.1rem', fontWeight: 700 }}>LexAI</span>
        </div>
        <p>© {new Date().getFullYear()} LexAI Legal Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
