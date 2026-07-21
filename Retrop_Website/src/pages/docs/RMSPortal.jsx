// ============================================================================
// RMS OWNER'S PORTAL DOC (/docs/rms/portal)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import {
  LayoutDashboard, Users, Settings as SettingsIcon,
  ShoppingBag, DollarSign, Store, ChefHat, Truck, Box,
  ClipboardList, CheckCircle, FileSpreadsheet, BookOpen, Star,
  ArrowRight, Lightbulb, Zap
} from 'lucide-react';

export default function RMSPortal() {
  return (
    <DocsLayout title="RMS Owner's Portal">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        <Link to="/docs" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Docs</Link>
        <span>›</span>
        <Link to="/docs/rms" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Retrop RMS</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text)' }}>Owner's Portal</span>
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Owner's Portal</span>
      <h1>Retrop RMS — Owner's Portal Guide</h1>
      <p style={{ fontSize: '16.5px', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '32px' }}>
        The Owner's Portal is the master web-based management platform accessible at <code>/dashboard</code>. It gives restaurant owners end-to-end control over menu catalogs, real-time orders, staff credentials, raw ingredient inventory, recipes (BOM), purchase orders, petty cash expenses, GST compliance, and End-of-Day register closure.
      </p>

      {/* TOC */}
      <div className="docs-toc">
        <h4>Table of Contents</h4>
        <ul>
          <li><a href="#system-flow-diagram">1. System Architecture & Inter-Module Data Flow</a></li>
          <li><a href="#snapshot-analytics">2. Snapshot & Executive Overview</a></li>
          <li><a href="#customer-flow">3. Customer Flow (Menu, Orders & Reviews)</a></li>
          <li><a href="#operations-inventory">4. Operations & Inventory (Staff, Stock, Vendors, BOM, Purchases, Expenses)</a></li>
          <li><a href="#compliance-settings">5. Compliance, Day Close & Settings</a></li>
          <li><a href="#form-recording-guidelines">6. Form Filling & Data Recording Guidelines</a></li>
        </ul>
      </div>

      {/* ── 1. SYSTEM FLOW DIAGRAM ────────────────────────────────────────── */}
      <h2 id="system-flow-diagram">1. System Architecture & Inter-Module Data Flow</h2>
      <p>
        The Owner's Portal connects every restaurant operation into a unified data pipeline:
      </p>

      <div style={{ overflowX: 'auto', margin: '24px 0 32px' }}>
        <div style={{ minWidth: '600px', padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', textAlign: 'center' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 107, 53, 0.1)', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
              <ShoppingBag size={24} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
              <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--color-text)' }}>1. Order Placed</strong>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Customer QR / POS</span>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <ChefHat size={24} color="#6366F1" style={{ margin: '0 auto 8px' }} />
              <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--color-text)' }}>2. BOM Deduction</strong>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Auto stock deduction</span>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Box size={24} color="#F59E0B" style={{ margin: '0 auto 8px' }} />
              <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--color-text)' }}>3. Reorder Alert</strong>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Issue PO to Vendor</span>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle size={24} color="#10B981" style={{ margin: '0 auto 8px' }} />
              <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--color-text)' }}>4. EOD & GST Audit</strong>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Cash & tax reporting</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. SNAPSHOT & ANALYTICS ────────────────────────────────────────── */}
      <h2 id="snapshot-analytics">2. Snapshot & Executive Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={16} color="var(--color-primary)" /> Executive Dashboard Overview
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Real-time business snapshot displaying Today's Revenue (₹), Total Orders count, Active Table occupancy %, Net Profit metrics, and instant Low Stock alert banners.
          </p>
        </div>
      </div>

      {/* ── 3. CUSTOMER FLOW ────────────────────────────────────────── */}
      <h2 id="customer-flow">3. Customer Flow (Menu, Orders & Reviews)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="var(--color-primary)" /> Menu List Manager
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Create and edit menu items. Upload dish photos (PNG/JPG/WEBP max 2MB), set base price (₹), select category, apply tax rate %, set veg/non-veg tags, and toggle In-Stock / Out-of-Stock.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} color="var(--color-primary)" /> Orders Live Monitor
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Real-time feed of all incoming customer orders across dining tables. View customer details, ordered dishes, KOT status, bill totals, payment modes (Cash, Card, UPI), and print receipts.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={16} color="var(--color-primary)" /> Customer Reviews & Ratings
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Track star ratings and customer feedback submitted at the end of digital QR dining sessions to monitor service quality and dish satisfaction.
          </p>
        </div>
      </div>

      {/* ── 4. OPERATIONS & INVENTORY ────────────────────────────────────────── */}
      <h2 id="operations-inventory">4. Operations & Inventory (Staff, Stock, Vendors, BOM, Purchases, Expenses)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-primary)" /> Staff Registry
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Provision staff accounts for Managers, Waiters, and Kitchen Chefs. Assign mobile login credentials, passcodes, shift permissions, and toggle active/inactive access.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={16} color="var(--color-primary)" /> Stock Items (Inventory)
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Track raw ingredients (e.g. Cheese, Flour, Oil) with unit measures (kg, L, pcs), current stock count, minimum safety reorder thresholds, and unit cost prices.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={16} color="var(--color-primary)" /> Vendors Directory
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Manage ingredient suppliers, company contact persons, phone numbers, email addresses, vendor GSTIN, and credit payment terms.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChefHat size={16} color="var(--color-primary)" /> Recipes & Bill of Materials (BOM)
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Link menu dishes to ingredient quantities (e.g., 1 Pizza = 150g Cheese + 200g Dough). Enables automated real-time inventory deduction whenever an order is completed.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} color="var(--color-primary)" /> Purchases & Stock Intake
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Issue Purchase Orders (POs) to vendors. Marking a PO as <strong>Received</strong> automatically increases raw ingredient stock counts in the inventory module.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="var(--color-primary)" /> Operational Expenses Ledger
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Log petty cash store expenses (Rent, Electricity, Maintenance, Staff Advances, Repairs). Categorize costs and track net operating expenses.
          </p>
        </div>
      </div>

      {/* ── 5. COMPLIANCE & SETTINGS ────────────────────────────────────────── */}
      <h2 id="compliance-settings">5. Compliance, Day Close & Settings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '20px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="var(--color-primary)" /> Day Close Register
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            End-of-Day shift register closure. Record physical cash counted in drawer; system calculates expected cash vs. actual cash variance and locks the session.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={16} color="var(--color-primary)" /> GST Compliance & Tax Reports
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Configure GSTIN number, CGST/SGST tax split rates, and export monthly GST audit reports for tax filing.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={16} color="var(--color-primary)" /> Restaurant Settings
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Manage store profile (Restaurant Name, Phone, Address, Logo, Currency), operating hours, and master Customer QR Self-Ordering toggle.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={16} color="var(--color-primary)" /> Account & Security Settings
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Owner profile settings, password changes, authentication security, dark/light theme toggle, and system preferences.
          </p>
        </div>
      </div>

      {/* ── 6. FORM RECORDING GUIDELINES ────────────────────────────────────────── */}
      <h2 id="form-recording-guidelines">6. Form Filling & Data Recording Guidelines</h2>
      <p>Follow these operational standards when populating or updating forms in the Owner's Portal:</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Module / Form</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>What to Record</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>What NOT to Record</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Menu Item Form</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>Exact dish title, net base price (₹) excluding tax, dish image (PNG/JPG max 2MB), category, veg/non-veg flag, tax rate %.</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Do not include currency symbols in price fields. Do not upload images larger than 2MB or non-image files.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Stock Item Form</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>Ingredient name, standard unit (kg, L, pcs, g), current stock level, minimum safety threshold, unit purchase cost.</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Do not mix units (e.g. entering grams when unit is kg). Do not leave reorder threshold at 0.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Staff Account Form</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>Staff full name, registered mobile number (used for app login), assigned role (Manager/Waiter/Chef), 4-digit passcode.</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Do not assign master owner password to staff. Do not use duplicate mobile numbers across staff accounts.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Expenses Form</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>Expense category (Rent, Repairs, Utilities, Wages), exact amount paid in cash (₹), transaction date, notes/invoice ref.</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Do not log supplier inventory purchases here (use Purchase Orders module instead).</td>
          </tr>
          <tr>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Day Close Form</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>Actual counted cash physically present in register drawer at shift end.</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Do not alter recorded expected sales figures manually. System calculates variance automatically.</td>
          </tr>
        </tbody>
      </table>

      <div className="docs-callout tip">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>The Owner's Portal layout is fully responsive across desktop, tablet, and mobile browsers. Data changes sync instantly with all active mobile app instances.</p>
      </div>

      {/* Navigation */}
      <div style={{ marginTop: '48px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/docs/rms/app" className="btn btn-primary">
          RMS Mobile App <ArrowRight size={15} />
        </Link>
        <Link to="/docs/rms" className="btn btn-secondary">
          ← Back to Overview
        </Link>
      </div>
    </DocsLayout>
  );
}
