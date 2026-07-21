// ============================================================================
// SERVICES PAGE (/services) — Retrop as business platform, RMS only
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowRight, CheckCircle2, Layers, Bot, Cpu, LineChart, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export default function Services() {
  return (
    <PageWrapper title="Services">
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Page Hero */}
        <div className="page-hero">
          <span className="badge badge-primary" style={{ margin: '0 auto 16px' }}>Our Solutions</span>
          <h1>Tools built for modern businesses</h1>
          <p>
            A growing ecosystem of intelligent software that automates operations,
            digitalizes workflows, and empowers smarter decisions.
          </p>
        </div>

        {/* RMS — Full Card */}
        <section className="section">
          <div className="container" style={{ maxWidth: '900px' }}>
            <div
              style={{
                border: '1.5px solid rgba(255,107,53,0.25)', borderRadius: '24px',
                padding: '40px', background: 'var(--color-surface)',
                position: 'relative', overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#FF6B35,#FF9A3C)' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '18px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <ChefHat size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '2px' }}>Retrop RMS</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, margin: 0 }}>Restaurant Management System</p>
                  </div>
                </div>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Available Now</span>
              </div>

              <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', lineHeight: 1.85, marginBottom: '28px' }}>
                Retrop RMS is our flagship product — a comprehensive restaurant &amp; café management platform tailored for restaurants, cafes, and food service businesses to automate their day-to-day operations. From real-time inventory tracking and intelligent cost analysis to kitchen-to-team coordination and digital QR ordering, RMS gives you everything you need to run a smarter, leaner, and more profitable restaurant or cafe.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px', marginBottom: '32px' }}>
                {[
                  'Real-time inventory & stock tracking',
                  'Automated cost & margin calculator',
                  'Digital ordering system with QR',
                  'Staff roles & access management',
                  'Vendor & purchase order management',
                  'Owner analytics & business reports',
                  'Low-stock alerts & notifications',
                  'Comprehensive financial reporting',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    {f}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/docs/rms" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,107,53,0.28)', transition: 'all 0.2s ease' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,107,53,0.38)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,53,0.28)'; }}
                >
                  View Documentation <ArrowRight size={15} />
                </Link>
                <Link to="/docs/rms/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: '1.5px solid var(--color-primary)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s ease' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'rgba(255,107,53,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--color-primary-light)'; }}
                >
                  Pricing <Tag size={15} />
                </Link>
                <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', fontWeight: 600, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s ease' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            {/* Roadmap / Coming soon note */}
            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px' }}>
              {[
                { icon: Cpu, label: 'Retrop POS', desc: 'A cloud-native point-of-sale system for modern businesses.' },
                { icon: LineChart, label: 'Retrop Analytics', desc: 'Deep business intelligence and forecasting platform.' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', opacity: 0.75 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Icon size={16} color="var(--color-text-muted)" />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{label}</span>
                    <span className="badge badge-muted" style={{ marginLeft: 'auto', fontSize: '11px' }}>Soon</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg,#FF6B35,#FF9A3C)', padding: '72px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.08) 0%,transparent 60%)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.2px', marginBottom: '14px' }}>Not sure which product fits?</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px', lineHeight: 1.7 }}>Our team is happy to guide you to the right solution for your business.</p>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', borderRadius: '12px', background: '#fff', color: 'var(--color-primary)', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'all 0.2s ease' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Talk to Us <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </PageWrapper>
  );
}
