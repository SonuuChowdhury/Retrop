// ============================================================================
// SITE FOOTER — Shared across all public pages
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

const companyLinks = [
  { to: '/',         label: 'Home'    },
  { to: '/services', label: 'Services'},
  { to: '/about',    label: 'About'   },
  { to: '/contact',  label: 'Contact' },
];

const legalLinks = [
  { to: '/privacy-policy',   label: 'Privacy Policy'  },
  { to: '/terms-of-service', label: 'Terms of Service'},
  { to: '/cookie-policy',    label: 'Cookie Policy'   },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
            <img src="/logo-corner-rounded.png" alt="Retrop" style={{ height: '34px', width: '34px', borderRadius: '9px', objectFit: 'cover' }} />
            <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.4px' }}>Retrop</span>
          </Link>
          <p className="footer-tagline">
            The modern operating system for businesses. Automate, digitalize, and grow with
            intelligent tools built for the way you work.
          </p>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul className="footer-links" role="list">
            {companyLinks.map(({ to, label }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <h4>Legal</h4>
          <ul className="footer-links" role="list">
            {legalLinks.map(({ to, label }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Retrop. All rights reserved.</span>
        <span style={{ fontSize: '12px', opacity: 0.6 }}>Powering modern businesses</span>
      </div>
    </footer>
  );
}
