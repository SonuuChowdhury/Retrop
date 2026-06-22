import React from 'react'
import './Footer.css'

export default function Footer({ branding, contact }) {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner g-container">
        <div className="footer__brand">
          {branding.logoUrl && (
            <img className="footer__logo" src={branding.logoUrl} alt={`${branding.name} logo`} />
          )}
          <span className="footer__name">{branding.name}</span>
          <p className="footer__tagline">{branding.tagline}</p>
        </div>

        <nav className="footer__nav" aria-label="Footer navigation">
          <ul className="footer__nav-list" role="list">
            {[
              { label: 'Menu', href: '#dishes' },
              { label: 'Hours', href: '#hours' },
              { label: 'Find Us', href: '#location' },
              { label: 'Contact', href: '#contact' },
            ].map((link) => (
              <li key={link.href}>
                <a
                  className="footer__nav-link"
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__contact">
          <a className="footer__contact-link" href={`tel:${contact.phone}`}>{contact.phone}</a>
          <a className="footer__contact-link" href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="g-container">
          <p className="footer__copy">
            © {year} {branding.name}. All rights reserved. | Powered by <a href="https://retrop.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #e85d3a)', textDecoration: 'none' }}>retrop.in</a>
          </p>
        </div>
      </div>
    </footer>
  )
}