// ============================================================================
// ABOUT PAGE (/about) — Business-focused
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lightbulb, Target, Shield, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

const values = [
  { icon: Heart, title: 'Business First', desc: 'Every feature starts with a real business problem. We listen, observe, and design for the people who run operations every day.' },
  { icon: Lightbulb, title: 'Simplicity as a Feature', desc: 'Complexity is easy. Simplicity is hard. We obsess over making every screen, flow, and interaction feel obvious and effortless.' },
  { icon: Target, title: 'Relentless Reliability', desc: 'Businesses can\'t afford downtime. We hold our systems to the highest standards of uptime, performance, and data integrity.' },
  { icon: Shield, title: 'Honest & Transparent', desc: 'No hidden fees. No dark patterns. What you see is what you get — from pricing to data practices.' },
];

export default function About() {
  return (
    <PageWrapper title="About">
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <div className="page-hero">
          <span className="badge badge-primary" style={{ margin: '0 auto 16px' }}>About Us</span>
          <h1>We build solutions<br />for modern businesses</h1>
          <p>
            Retrop exists to give businesses the kind of intelligent software that was
            previously only available to large enterprises — made simple, affordable, and beautiful.
          </p>
        </div>

        {/* Mission */}
        <section className="section">
          <div className="container" style={{ maxWidth: '820px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }} className="about-grid">
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Our Mission</span>
                <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.2 }}>
                  Empowering every business to operate at its best
                </h2>
              </div>
              <div>
                <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', lineHeight: 1.85, marginBottom: '16px' }}>
                  Running a business is one of the most challenging things in the world. Margins are tight,
                  competition is fierce, and the people who run these operations work incredibly hard.
                </p>
                <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', lineHeight: 1.85 }}>
                  We built Retrop because we believe every business owner — whether running a single outlet
                  or a growing organization — deserves access to software that actually helps them succeed.
                  Powerful enough for serious operations, simple enough that any team member can use it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section section-alt">
          <div className="container">
            <div className="section-header">
              <span className="badge badge-primary">Our Values</span>
              <h2>What we stand for</h2>
              <p>
                These aren't words on a wall — they're the principles guiding every decision
                we make, from product design to customer interactions.
              </p>
            </div>
            <div className="values-grid">
              {values.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="value-card"
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '16px' }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ marginBottom: '8px' }}>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision CTA */}
        <section className="section">
          <div className="container" style={{ maxWidth: '640px', textAlign: 'center' }}>
            <span className="badge badge-primary" style={{ margin: '0 auto 16px' }}>Our Vision</span>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '20px', lineHeight: 1.2 }}>
              To become the default operating system for modern businesses
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '36px' }}>
              We're starting with the tools that matter most and building toward a complete ecosystem
              that covers every touchpoint of any business — from operations to customer experience.
            </p>
            <Link to="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 28px rgba(255,107,53,0.28)', transition: 'all 0.25s ease' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(255,107,53,0.38)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,107,53,0.28)'; }}
            >
              Get in Touch <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <style>{`
        @media (max-width: 640px) { .about-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
      `}</style>
    </PageWrapper>
  );
}
