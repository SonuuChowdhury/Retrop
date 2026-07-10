// ============================================================================
// BRANDING HOME PAGE (/)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo-text">RETROP</div>
        <Link to="/login" className="btn btn-secondary">
          Owner Portal
        </Link>
      </header>

      <main className="landing-hero">
        <h1 style={{ color: 'var(--color-text)' }}>
          The World Class <span style={{ color: 'var(--color-primary)' }}>SaaS Ecosystem</span> for Modern Restaurants
        </h1>
        <p>
          Empower your CA, streamline inventory tracking, calculate per-plate margins, and keep staff connected—all under a single consolidated dashboard.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
            Go to Owner Dashboard
          </Link>
        </div>
      </main>

      <footer className="landing-footer">
        <p>© {currentYear} Retrop. All rights reserved. | Built for Restaurant Excellence</p>
      </footer>
    </div>
  );
}
