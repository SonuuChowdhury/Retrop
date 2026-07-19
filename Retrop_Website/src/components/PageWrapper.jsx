// ============================================================================
// PAGE WRAPPER — Fade-in, dynamic page titles, and premium skeleton loader
// ============================================================================
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import SEO from './SEO';

export default function PageWrapper({ children, title, description, schemaData }) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Simulate premium skeleton loading transition
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 300); // 300ms shimmer transition for high-end UX
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div className="public-page-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 20% 0%, rgba(255,107,53,0.08), transparent 34%), radial-gradient(circle at 80% 100%, rgba(99,102,241,0.06), transparent 32%)' }} />
        {/* Render actual navbar so user sees a stable header instantly */}
        <Navbar />

        {/* Shimmer CSS Injection */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .skeleton-shimmer {
            background: linear-gradient(90deg, 
              var(--color-bg-subtle) 25%, 
              var(--color-border) 37%, 
              var(--color-bg-subtle) 63%
            );
            background-size: 200% 100%;
            animation: shimmer 1.4s ease infinite;
          }
        `}</style>

        {/* Skeleton Structure */}
        <main style={{ flex: 1, padding: '40px 24px', maxWidth: '1160px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Skeleton Hero / Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '40px 0 20px', textAlign: 'center' }}>
            <div className="skeleton-shimmer" style={{ width: '140px', height: '24px', borderRadius: '9999px' }} />
            <div className="skeleton-shimmer" style={{ width: '80%', maxWidth: '480px', height: '56px', borderRadius: '12px' }} />
            <div className="skeleton-shimmer" style={{ width: '90%', maxWidth: '380px', height: '20px', borderRadius: '8px' }} />
          </div>

          {/* Skeleton Cards / Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '20px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '32px', borderRadius: '20px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                <div className="skeleton-shimmer" style={{ width: '60%', height: '20px', borderRadius: '6px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton-shimmer" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ width: '90%', height: '14px', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ width: '75%', height: '14px', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Loaded state with high-quality fade entrance
  return (
    <div
      className="public-page-shell"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both'
      }}
    >
      <SEO title={title} description={description} pathname={location.pathname} schemaData={schemaData} />
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at top left, rgba(255,107,53,0.08), transparent 32%), radial-gradient(circle at bottom right, rgba(99,102,241,0.05), transparent 30%)' }} />
      {children}
    </div>
  );
}
