// ============================================================================
// 404 NOT FOUND PAGE (*)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export default function NotFound() {
  return (
    <PageWrapper title="Page Not Found">
      <Navbar />

      <main className="not-found-body">
        <div className="not-found-number">
          4<span style={{ color: 'var(--color-primary)' }}>0</span>4
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px' }}>Page not found</h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.65 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,107,53,0.28)', transition: 'all 0.2s ease' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,107,53,0.38)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,53,0.28)'; }}
          >
            <Home size={16} /> Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>

        {/* Helpful links card */}
        <div style={{ padding: '28px 32px', background: 'var(--color-bg-subtle)', borderRadius: '20px', border: '1px solid var(--color-border)', textAlign: 'left', maxWidth: '400px', width: '100%' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: '16px' }}>
            Useful Links
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { to: '/services',   label: 'Our Solutions'    },
              { to: '/docs',       label: 'Documentation'    },
              { to: '/about',      label: 'About Retrop'     },
              { to: '/contact',    label: 'Contact Us'       },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '2px 0',
                  transition: 'color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                → {label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </PageWrapper>
  );
}
