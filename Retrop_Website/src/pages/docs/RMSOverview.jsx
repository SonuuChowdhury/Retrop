// ============================================================================
// RMS OVERVIEW DOC (/docs/rms)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import { ArrowRight, Smartphone, ShoppingCart, LayoutDashboard, Lightbulb } from 'lucide-react';

export default function RMSOverview() {
  return (
    <DocsLayout title="RMS Overview">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        <Link to="/docs" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Docs</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text)' }}>Retrop RMS</span>
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Retrop RMS</span>
      <h1>Overview</h1>
      <p style={{ fontSize: '17px', color: 'var(--color-text)', marginBottom: '32px', lineHeight: 1.7 }}>
        Retrop RMS (Restaurant Management System) is an all-in-one platform designed to
        simplify and supercharge how restaurant owners manage their business operations.
      </p>

      {/* TOC */}
      <div className="docs-toc">
        <h4>On this page</h4>
        <ul>
          <li><a href="#what-is-rms">What is Retrop RMS?</a></li>
          <li><a href="#key-components">Key Components</a></li>
          <li><a href="#who-is-it-for">Who is it for?</a></li>
          <li><a href="#getting-started">Getting Started</a></li>
          <li><a href="#system-requirements">System Requirements</a></li>
        </ul>
      </div>

      <h2 id="what-is-rms">What is Retrop RMS?</h2>
      <p>
        Retrop RMS is a Software-as-a-Service (SaaS) product built specifically for Indian restaurants,
        cloud kitchens, and food businesses. It combines inventory management, menu costing, staff coordination,
        customer ordering, and owner-level analytics into a single, cohesive platform.
      </p>
      <p>
        Rather than patching together multiple tools, Retrop RMS gives you one source of truth for
        every aspect of your restaurant's operations — from the morning inventory count to the end-of-day
        revenue summary.
      </p>

      <div className="docs-callout tip">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p><strong>Tip:</strong> Retrop RMS is cloud-based, meaning your data is securely synced and accessible from any device, anywhere — with no local installation required.</p>
      </div>

      <h2 id="key-components">Key Components</h2>
      <p>Retrop RMS is made up of three primary interfaces, each designed for a different user role:</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '24px 0' }}>
        {[
          { icon: Smartphone, title: 'Mobile App', desc: 'For kitchen staff, waiters, and on-floor teams to manage orders, view tasks, and track stock on the go.', to: '/docs/rms/app' },
          { icon: ShoppingCart, title: 'Ordering System', desc: 'QR-based digital menus and order management that connects customers to the kitchen in real time.', to: '/docs/rms/ordering' },
          { icon: LayoutDashboard, title: "Owner's Portal", desc: 'A web-based dashboard for restaurant owners to control inventory, view analytics, manage staff, and more.', to: '/docs/rms/portal' },
        ].map(({ icon: Icon, title, desc, to }) => (
          <Link to={to} key={to} style={{ textDecoration: 'none', display: 'block', padding: '20px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', transition: 'all 0.2s ease' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <Icon size={20} color="var(--color-primary)" style={{ marginBottom: '10px' }} />
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text)' }}>{title}</strong>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{desc}</span>
          </Link>
        ))}
      </div>

      <h2 id="who-is-it-for">Who is it for?</h2>
      <p>Retrop RMS is designed for:</p>
      <ul>
        <li><strong>Restaurant Owners</strong> — Full control over all operations, financials, and staff</li>
        <li><strong>Kitchen Staff</strong> — Order tracking and recipe/ingredient visibility via the mobile app</li>
        <li><strong>Waiters</strong> — Order placement and table management</li>
        <li><strong>Managers</strong> — Shift oversight, inventory counting, and purchase approvals</li>
      </ul>
      <p>
        From a single café to a restaurant group with multiple locations — RMS scales to fit your needs.
      </p>



      <h2 id="getting-started">Getting Started</h2>
      <p>Here's the typical onboarding flow for new restaurants:</p>
      <ol>
        <li><strong>Account Creation</strong> — Sign up directly via the portal or have your Owner account provisioned by the Retrop team.</li>
        <li><strong>Initial Setup</strong> — Log in to the Owner's Portal and configure your restaurant profile, menu categories, and ingredient inventory.</li>
        <li><strong>Add Your Team</strong> — Create staff accounts and assign roles (Kitchen, Waiter, Manager).</li>
        <li><strong>Set Up Vendors</strong> — Add your ingredient suppliers and set reorder quantities.</li>
        <li><strong>Launch Ordering</strong> — Generate your table QR codes and go live with the ordering system.</li>
        <li><strong>Monitor & Grow</strong> — Use the analytics dashboard to track performance, costs, and trends.</li>
      </ol>

      <h2 id="system-requirements">System Requirements</h2>
      <p>Retrop RMS is fully cloud-based and works on any modern browser:</p>
      <ul>
        <li><strong>Owner's Portal:</strong> Any device with a modern browser (Chrome, Firefox, Safari, Edge)</li>
        <li><strong>Mobile App:</strong> Android 8.0+</li>
        <li><strong>Ordering System:</strong> Any smartphone with a QR scanner (built into the camera app)</li>
        <li><strong>Internet:</strong> Stable internet connection recommended; offline queuing available for ordering</li>
      </ul>

      {/* Next steps */}
      <div style={{ marginTop: '48px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/docs/rms/app" className="btn btn-primary">
          Mobile App Guide <ArrowRight size={15} />
        </Link>
        <Link to="/docs/rms/ordering" className="btn btn-secondary">
          Ordering System
        </Link>
        <Link to="/docs/rms/portal" className="btn btn-secondary">
          Owner's Portal
        </Link>
      </div>
    </DocsLayout>
  );
}
