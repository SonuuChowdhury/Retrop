import React, { useState, useEffect, useCallback } from 'react'
import './Navbar.css'

export default function Navbar({ branding }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 40)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navLinks = [
    { label: 'Menu', href: '#dishes' },
    { label: 'Hours', href: '#hours' },
    { label: 'Find Us', href: '#location' },
    { label: 'Contact', href: '#contact' },
  ]

  const handleNavClick = (href) => {
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="navbar__inner g-container">
          {/* Logo */}
          <a className="navbar__brand" href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {branding.logoUrl && (
              <img className="navbar__logo" src={branding.logoUrl} alt={`${branding.name} logo`} />
            )}
            <span className="navbar__name">{branding.name}</span>
          </a>

          {/* Desktop links */}
          <ul className="navbar__links" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <button
                  className="navbar__link"
                  onClick={() => handleNavClick(link.href)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Reserve CTA */}
          <a
            className="navbar__cta"
            href={`tel:${branding.phone || ''}`}
            aria-label="Make a reservation"
          >
            Reserve a Table
          </a>

          {/* Mobile hamburger */}
          <button
            className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`navbar__drawer ${menuOpen ? 'navbar__drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="navbar__drawer-inner">
          <ul className="navbar__drawer-links" role="list">
            {navLinks.map((link, i) => (
              <li
                key={link.href}
                className="navbar__drawer-item"
                style={{ transitionDelay: menuOpen ? `${i * 60 + 100}ms` : '0ms' }}
              >
                <button
                  className="navbar__drawer-link"
                  onClick={() => handleNavClick(link.href)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          <a
            className="navbar__drawer-cta"
            href="tel:"
            onClick={() => setMenuOpen(false)}
          >
            Reserve a Table
          </a>
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="navbar__backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}