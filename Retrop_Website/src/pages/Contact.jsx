// ============================================================================
// CONTACT PAGE (/contact) — Direct Contacts
// ============================================================================

import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    detail: 'chowdhurysonu047@gmail.com',
    sub: 'Direct support & inquiries',
    href: 'mailto:chowdhurysonu047@gmail.com',
  },
  {
    icon: Phone,
    title: 'Mobile',
    detail: '+91 84205 64402',
    sub: 'Direct phone & messaging assistance',
    href: 'tel:+918420564402',
  },
  {
    icon: MapPin,
    title: 'Location',
    detail: 'India',
    sub: 'Serving businesses nationwide',
    href: null,
  },
];

export default function Contact() {
  return (
    <PageWrapper title="Contact">
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <div className="page-hero">
          <span className="badge badge-primary" style={{ margin: '0 auto 16px' }}>Contact</span>
          <h1>Let's talk</h1>
          <p>
            Have a question or want to get started with Retrop?
            We'd love to hear from you.
          </p>
        </div>

        {/* Contact Info Grid */}
        <section className="section">
          <div className="container" style={{ maxWidth: '820px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px' }}>
                Reach us directly
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                No wait queues. No automated responses. You talk directly with the people who built Retrop.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '20px' }}>
              {contactInfo.map(({ icon: Icon, title, detail, sub, href }) => (
                <div
                  key={title}
                  style={{
                    padding: '28px', borderRadius: '20px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                    cursor: href ? 'pointer' : 'default',
                  }}
                  onClick={() => href && window.open(href, '_blank')}
                  onMouseOver={e => { if (href) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)'; } }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '16px' }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: '6px' }}>{title}</h3>
                  {href ? (
                    <a href={href} style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', textDecoration: 'none', display: 'block', marginBottom: '4px', transition: 'color 0.2s ease' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--color-primary)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--color-text)'}
                    >{detail}</a>
                  ) : (
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>{detail}</p>
                  )}
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </PageWrapper>
  );
}
