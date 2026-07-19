// ============================================================================
// DOCS LANDING (/docs)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Smartphone, ShoppingCart, LayoutDashboard, ArrowRight, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

const docsCards = [
  { icon: BookOpen,        title: 'RMS Overview',     desc: 'Start here — a full introduction to Retrop RMS, its architecture, and how to get started.', to: '/docs/rms'           },
  { icon: Smartphone,      title: 'Mobile App',        desc: 'A complete guide to the Retrop RMS mobile app for staff and team members.',                   to: '/docs/rms/app'       },
  { icon: ShoppingCart,    title: 'Ordering System',   desc: 'How the QR-based ordering system works — from customer scan to fulfilment.',                  to: '/docs/rms/ordering'  },
  { icon: LayoutDashboard, title: "Owner's Portal",    desc: 'Every section of the management dashboard explained — inventory, reports, staff, and more.',   to: '/docs/rms/portal'    },
];

export default function Docs() {
  return (
    <PageWrapper title="Documentation">
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-hero">
          <span className="badge badge-primary" style={{ margin: '0 auto 16px' }}>Documentation</span>
          <h1>Retrop Documentation</h1>
          <p>
            Everything you need to understand, set up, and get the most out of Retrop.
            Clear, practical, and always up to date.
          </p>
        </div>

        <section className="section">
          <div className="container">
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: '24px' }}>
                Retrop RMS · Restaurant Management System
              </h2>
              <div className="services-grid">
                {docsCards.map(({ icon: Icon, title, desc, to }) => (
                  <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block', padding: '28px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.25s ease' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '16px' }}>
                      <Icon size={20} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>{title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: '16px' }}>{desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Read docs <ChevronRight size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '48px', padding: '28px 32px', background: 'var(--color-bg-subtle)', borderRadius: '18px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>More documentation coming soon</h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Docs for upcoming Retrop products will be published as they launch.</p>
              </div>
              <Link to="/services" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1.5px solid var(--color-border)', color: 'var(--color-text)', fontWeight: 600, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s ease' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                View All Solutions <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </PageWrapper>
  );
}
