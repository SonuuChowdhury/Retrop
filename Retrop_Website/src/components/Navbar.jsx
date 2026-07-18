// ============================================================================
// SITE NAVBAR — Floating pill design, mobile-first, auth-aware, theme toggle
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/',         label: 'Home'     },
  { to: '/services', label: 'Services' },
  { to: '/docs',     label: 'Docs'     },
  { to: '/downloads', label: 'Downloads' },
  { to: '/about',    label: 'About'    },
  { to: '/contact',  label: 'Contact'  },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const { owner, logout, theme, toggleTheme } = useAuth();
  const location   = useLocation();
  const navigate   = useNavigate();

  // Close everything on route change
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = () => setDropOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropOpen]);

  // Close mobile menu when user scrolls
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* ── Floating Nav Wrapper ─────────────────────────────────────────── */}
      <div className="nav-float-wrap">

        {/* ── Pill Nav Bar ────────────────────────────────────────────────── */}
        <nav
          className={`nav-pill${scrolled ? ' nav-pill-scrolled' : ''}`}
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link to="/" aria-label="Retrop home" className="nav-pill-logo">
            <img
              src="/logo-corner-rounded.png"
              alt="Retrop"
              style={{ height: '34px', width: '34px', borderRadius: '9px', objectFit: 'cover' }}
            />
            <span className="nav-pill-logo-text">Retrop</span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="nav-desktop-links" aria-label="Navigation links">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `nav-desktop-link${isActive ? ' nav-desktop-link-active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="nav-right-actions">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="nav-theme-btn"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Auth — avatar dropdown OR Sign In button */}
            {owner ? (
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  className="nav-avatar-btn"
                  aria-label="Account menu"
                  aria-expanded={dropOpen}
                >
                  <div className="nav-avatar-dot">
                    {(owner.name || owner.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="nav-avatar-name">{owner.name?.split(' ')[0] || 'Account'}</span>
                </button>

                {dropOpen && (
                  <div className="nav-dropdown">
                    <Link to="/dashboard" className="nav-dropdown-item">
                      <LayoutDashboard size={15} color="var(--color-primary)" /> Dashboard
                    </Link>
                    <div className="nav-dropdown-divider" />
                    <button onClick={handleLogout} className="nav-dropdown-item nav-dropdown-danger">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nav-signin-btn">
                <User size={14} /> Sign In
              </Link>
            )}

            {/* Hamburger — always in DOM, shown/hidden by CSS */}
            <button
              className={`nav-hamburger-btn${menuOpen ? ' nav-hamburger-open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>

        {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
        <div
          className={`nav-mobile-drawer${menuOpen ? ' nav-mobile-drawer-open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <div className="nav-mobile-drawer-inner">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `nav-mobile-link${isActive ? ' nav-mobile-link-active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="nav-mobile-divider" />

            {owner ? (
              <>
                <Link
                  to="/dashboard"
                  className="nav-mobile-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <LayoutDashboard size={15} color="var(--color-primary)" /> Dashboard
                </Link>
                <button onClick={handleLogout} className="nav-mobile-logout">
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-mobile-signin">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Push page content below fixed navbar */}
      {location.pathname !== '/' && (
        <div style={{ height: '90px' }} aria-hidden="true" />
      )}

      <style>{`
        /* ── Float wrapper ─────────────────────────────────────────────── */
        .nav-float-wrap {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 24px);
          max-width: 1160px;
          z-index: 100;
        }
        @media (min-width: 480px) {
          .nav-float-wrap { width: calc(100% - 48px); }
        }

        /* ── Pill ──────────────────────────────────────────────────────── */
        .nav-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          height: 52px;
          border-radius: 16px;
          background: var(--nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--nav-border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.3s ease;
          gap: 8px;
        }
        @media (min-width: 480px) {
          .nav-pill { padding: 0 20px; height: 58px; }
        }
        .nav-pill-scrolled {
          box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
        }

        /* ── Logo ──────────────────────────────────────────────────────── */
        .nav-pill-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-pill-logo-text {
          font-size: 17px;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.4px;
        }

        /* ── Desktop links ─────────────────────────────────────────────── */
        .nav-desktop-links {
          display: none;
          align-items: center;
          gap: 2px;
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1;
          justify-content: center;
        }
        @media (min-width: 769px) {
          .nav-desktop-links { display: flex; }
        }
        .nav-desktop-link {
          display: block;
          padding: 6px 13px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-muted);
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .nav-desktop-link:hover {
          color: var(--color-text);
          background: var(--color-bg-subtle);
        }
        .nav-desktop-link-active {
          font-weight: 600;
          color: var(--color-text) !important;
          background: var(--color-bg-subtle) !important;
        }

        /* ── Right actions ─────────────────────────────────────────────── */
        .nav-right-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        @media (min-width: 480px) {
          .nav-right-actions { gap: 8px; }
        }

        /* ── Theme btn ─────────────────────────────────────────────────── */
        .nav-theme-btn {
          width: 34px;
          height: 34px;
          min-height: unset;
          border-radius: 10px;
          border: 1px solid var(--color-border);
          background: var(--color-bg-subtle);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .nav-theme-btn:hover {
          color: var(--color-text);
          border-color: var(--color-border-strong);
        }

        /* ── Sign In button (hidden on mobile) ─────────────────────────── */
        .nav-signin-btn {
          display: none;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 12px;
          background: var(--color-primary);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(255,107,53,0.28);
          transition: all 0.2s ease;
          white-space: nowrap;
          min-height: unset;
        }
        @media (min-width: 769px) {
          .nav-signin-btn { display: inline-flex; }
        }
        .nav-signin-btn:hover {
          background: var(--color-primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255,107,53,0.35);
        }

        /* ── Avatar button ─────────────────────────────────────────────── */
        .nav-avatar-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 10px 5px 6px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
          min-height: unset;
        }
        .nav-avatar-dot {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .nav-avatar-name {
          display: none;
        }
        @media (min-width: 769px) {
          .nav-avatar-name { display: inline; }
        }

        /* ── Dropdown ──────────────────────────────────────────────────── */
        .nav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 8px;
          min-width: 180px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          animation: fadeIn 0.15s ease;
          z-index: 200;
        }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: var(--color-text);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.15s ease;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          min-height: unset;
        }
        .nav-dropdown-item:hover { background: var(--color-bg-subtle); }
        .nav-dropdown-divider { height: 1px; background: var(--color-border); margin: 6px 0; }
        .nav-dropdown-danger { color: var(--color-danger) !important; }
        .nav-dropdown-danger:hover { background: rgba(230,57,70,0.06) !important; }

        /* ── Hamburger ─────────────────────────────────────────────────── */
        .nav-hamburger-btn {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          background: none;
          border: 1px solid var(--color-border);
          padding: 7px 8px;
          border-radius: 10px;
          cursor: pointer;
          width: 36px;
          height: 34px;
          flex-shrink: 0;
          min-height: unset;
        }
        @media (min-width: 769px) {
          .nav-hamburger-btn { display: none; }
        }
        .nav-hamburger-btn span {
          display: block;
          width: 18px;
          height: 2px;
          background: var(--color-text);
          border-radius: 2px;
          transition: transform 0.25s ease, opacity 0.2s ease;
          transform-origin: center;
        }
        .nav-hamburger-open span:nth-child(1) { transform: rotate(45deg) translate(0, 7px); }
        .nav-hamburger-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .nav-hamburger-open span:nth-child(3) { transform: rotate(-45deg) translate(0, -7px); }

        /* ── Mobile Drawer ─────────────────────────────────────────────── */
        .nav-mobile-drawer {
          margin-top: 8px;
          border-radius: 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
          pointer-events: none;
        }
        @media (min-width: 769px) {
          .nav-mobile-drawer { display: none !important; }
        }
        .nav-mobile-drawer-open {
          max-height: 540px;
          opacity: 1;
          pointer-events: auto;
        }
        .nav-mobile-drawer-inner {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .nav-mobile-link {
          display: block;
          padding: 13px 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text);
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .nav-mobile-link:hover { background: var(--color-bg-subtle); }
        .nav-mobile-link-active {
          color: var(--color-primary) !important;
          background: var(--color-primary-light) !important;
          font-weight: 600;
        }
        .nav-mobile-divider {
          height: 1px;
          background: var(--color-border);
          margin: 6px 0;
        }
        .nav-mobile-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          background: none;
          border: none;
          color: var(--color-danger);
          font-size: 15px;
          font-weight: 600;
          padding: 13px 14px;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
          min-height: unset;
        }
        .nav-mobile-logout:hover { background: rgba(230,57,70,0.06); }
        .nav-mobile-signin {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          border-radius: 10px;
          background: var(--color-primary);
          color: #fff !important;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          margin-top: 6px;
          transition: opacity 0.2s ease;
        }
        .nav-mobile-signin:hover { opacity: 0.9; }
      `}</style>
    </>
  );
}
