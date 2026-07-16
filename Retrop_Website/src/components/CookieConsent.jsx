// ============================================================================
// COOKIE CONSENT BANNER
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('retrop_cookie_consent');
    if (!consent) {
      // Delay slightly so it doesn't flash during page load
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (accepted) => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem('retrop_cookie_consent', accepted ? 'accepted' : 'declined');
      setVisible(false);
      setClosing(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '680px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 999,
        flexWrap: 'wrap',
        animation: closing ? 'cookieOut 0.3s ease forwards' : 'cookieIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      <style>{`
        @keyframes cookieIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
        @keyframes cookieOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0);    }
          to   { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
      `}</style>

      <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
        <Cookie size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>
          We use cookies
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          We use cookies to improve your experience and analyse site usage.{' '}
          <a href="/cookie-policy" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Learn more
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => dismiss(false)}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          Decline
        </button>
        <button
          onClick={() => dismiss(true)}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--color-primary-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <ShieldCheck size={14} /> Accept
        </button>
      </div>

      <button
        onClick={() => dismiss(false)}
        style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--color-text-subtle)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
        aria-label="Close cookie banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
