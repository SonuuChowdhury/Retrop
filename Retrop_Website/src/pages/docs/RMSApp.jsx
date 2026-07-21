// ============================================================================
// RMS MOBILE APP DOC (/docs/rms/app)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import {
  ArrowRight, Info, Lightbulb, Zap, BarChart3, Utensils,
  LayoutGrid, Users, DollarSign, Home, FileText, CreditCard,
  ClipboardList, Clock, CheckCircle2, Bell
} from 'lucide-react';

export default function RMSApp() {
  return (
    <DocsLayout title="RMS Mobile App">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        <Link to="/docs" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Docs</Link>
        <span>›</span>
        <Link to="/docs/rms" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Retrop RMS</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text)' }}>Mobile App</span>
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Mobile App</span>
      <h1>Retrop RMS — Mobile App</h1>
      <p style={{ fontSize: '17px', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '32px' }}>
        The Retrop RMS mobile app is used by kitchen staff, waiters, and on-floor teams to manage
        daily restaurant operations from their smartphones.
      </p>

      {/* TOC */}
      <div className="docs-toc">
        <h4>On this page</h4>
        <ul>
          <li><a href="#installation">Installation & Login</a></li>
          <li><a href="#roles">User Roles in the App</a></li>
          <li><a href="#manager-dashboard">1. Manager Dashboard</a></li>
          <li><a href="#waiter-dashboard">2. Waiter Dashboard</a></li>
          <li><a href="#kitchen-dashboard">3. Kitchen Dashboard (KDS)</a></li>
          <li><a href="#system-flow">4. End-to-End Inter-Dashboard Flow</a></li>
        </ul>
      </div>

      <h2 id="installation">Installation & Login</h2>
      <p>
        The Retrop RMS app is available for Android. Your restaurant owner will share
        your staff credentials when they set up your account.
      </p>
      <h3>Steps to get started:</h3>
      <ol>
        <li>Download the latest <strong>Retrop RMS</strong> app from the <Link to="/downloads" style={{ color: 'var(--color-primary)' }}>Downloads section</Link>.</li>
        <li>Open the app settings, go to <strong>App Authentication</strong>, and scan the authentication QR code provided in the owner's email.</li>
        <li>Enter your <strong>mobile number</strong> and <strong>password</strong> provided by your manager.</li>
        <li>Once logged in, the app automatically loads your <strong>role-specific dashboard</strong>.</li>
      </ol>

      <div className="docs-callout info">
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>If you forget your password, contact your restaurant owner or manager. Password resets for staff accounts are managed by the owner through the Owner's Portal.</p>
      </div>

      <h2 id="roles">User Roles in the App</h2>
      <p>The mobile app shows specialized dashboards and permissions based on the role assigned to your account:</p>
      <ul>
        <li><strong>Manager</strong> — Operational command center, live analytics, menu stock toggles, table layout, staff management, expense logs, and end-of-day closure.</li>
        <li><strong>Waiter</strong> — Table management, POS order creation, running KOT updates, order status tracking, serving, and bill settlement.</li>
        <li><strong>Kitchen Staff</strong> — Kitchen Display System (KDS) Kanban board, order timers, item-level prep check-off, and ready alerts.</li>
      </ul>
      <p>Role permissions are configured by the restaurant owner in the Owner's Portal and enforced securely via backend authentication.</p>

      {/* ── 1. MANAGER DASHBOARD ─────────────────────────────────────────────── */}
      <h2 id="manager-dashboard">1. Manager Dashboard</h2>
      <p>
        The Manager Dashboard serves as the central operational hub in the mobile app for restaurant managers, displaying real-time business KPIs, store status control, and access to all core setup modules.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--color-primary)" /> Restaurant Status Switch
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Toggle restaurant status between OPEN (accepting orders) and CLOSED. Prevents closing if active customer orders are still in progress.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="var(--color-primary)" /> Live Today's KPIs
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Real-time metric cards for Active Waiters, Tables Occupied, Today's Orders count, Today's Revenue (₹), and Pending Orders alerts.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-primary)" /> Waiters Management
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Manage profiles, login status, passcode credentials, active shift status, daily order stats, and account deletion safety guards.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={16} color="var(--color-primary)" /> Kitchen Accounts
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Credentials and access control for kitchen staff. Create kitchen accounts (username/password), toggle access, and reset passwords.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutGrid size={16} color="var(--color-primary)" /> Tables & Seating
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Setup dining tables, seating capacity, view live table occupancy status, and export or print QR codes for customer self-ordering.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} color="var(--color-primary)" /> Menu & Category
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Edit dishes, category rules, dish pricing, descriptions, and 1-tap item availability (In-Stock / Out-of-Stock) toggles.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="var(--color-primary)" /> Business Analytics
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            View sales stats, revenue details, payment method splits (Cash, Card, UPI), top dishes, and performance trends over custom time ranges.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="var(--color-primary)" /> Expenses Ledger
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Log and track restaurant cash expenses, petty cash spending (ingredients, repairs, advances), and expense category history.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--color-primary)" /> Day Close Register
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Perform EOD closing, enter drawer cash counts, calculate expected vs actual cash variance tracking, and view close logs.
          </p>
        </div>
      </div>

      <h3>Operations & Setup Modules</h3>
      <p>The Manager Dashboard provides direct access to 7 core operations and setup modules:</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Module Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Description</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Key Functionalities</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Waiters Management</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Manage profiles, login status and daily stats</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Create waiter accounts (Name, Phone, Passcode), view online/offline status, track daily stats, toggle active access, and delete accounts.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Kitchen Accounts</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Credentials and access control for kitchen staff</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Create kitchen staff login credentials (username/password), manage account status (active/inactive), and reset passwords.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Tables & Seating</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Setup dining tables, export and print QR codes</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Set up table numbers and seating capacity, view live occupancy status, and export or print table QR codes for customer self-ordering.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Menu & Category</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Edit dishes, category rules and availability</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Browse menu categories, toggle item availability (In-Stock / Out-of-Stock), edit dish prices and descriptions, and add/edit categories.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Business Analytics</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>View sales stats, revenue details and trends</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>View sales metrics (Revenue, Net Sales, Total Orders, Average Order Value), time period filters (Today, 7 Days, 30 Days, Custom), payment method splits (Cash, Card, UPI), top dishes, and sales charts.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Expenses Ledger</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Log and track restaurant cash expenses</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Record restaurant cash expenses (amount, category, description, date), view expense history, and filter entries by category.</td>
          </tr>
          <tr>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Day Close Register</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Perform EOD closing and cash variance tracking</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Perform End-of-Day closing, input drawer cash count, calculate expected vs actual cash variance, and view day close history logs.</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. WAITER DASHBOARD ─────────────────────────────────────────────── */}
      <h2 id="waiter-dashboard">2. Waiter Dashboard</h2>
      <p>
        The Waiter Dashboard provides floor staff with tools to accept table requests, create manual orders, track real-time kitchen status, append running KOT items, and process bill settlements.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--color-primary)" /> New Table Requests Panel
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Live alert cards showing customer QR self-order requests with table number, customer name, waiting timer, and 1-tap Accept Table action.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--color-primary)" /> Take Manual Order (POS)
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Quick POS order launcher with table picker, customer details, category menu search, quantity controls, and custom kitchen prep notes.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--color-primary)" /> Active Orders Stream
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Live order list showing table badges, order numbers, elapsed time, status pills (Ordering, Preparing, Ready, Serving), and totals.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} color="var(--color-primary)" /> Running KOT Updates
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Append additional items or dishes to an active table order directly without creating a new separate table session.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--color-primary)" /> Shift Performance KPIs
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Real-time shift summary cards tracking total orders handled today and completed table orders count.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="var(--color-primary)" /> Bill Settlement & Clearance
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Review order bill, mark order status as Completed, collect payment via Cash, Card, or UPI, and clear the table.
          </p>
        </div>
      </div>

      <h3>Waiter App Sections & Functionalities</h3>
      <p>The Waiter Dashboard consists of the following screens and functional areas:</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>App Section</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Description</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Key Functionalities</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>New Table Requests</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Customer QR self-ordering alerts</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Displays customer name, mobile number, table number badge, elapsed waiting time, and 1-tap Accept Table button.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Take Manual Order</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>POS manual order creation screen</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Select dining table, enter customer info, search menu items, adjust dish quantities, add custom kitchen notes, and submit order.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Active Orders Stream</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Live table orders dashboard</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Displays list of active table orders with table number chips, order numbers, elapsed time, status badges, and order totals.</td>
          </tr>
          <tr>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Order Detail & Settlement</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Order breakdown and payment screen</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>View items ordered, add extra dishes to active orders (Running KOT), update order status, collect payment (Cash/Card/UPI), and complete table session.</td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. KITCHEN DASHBOARD ─────────────────────────────────────────────── */}
      <h2 id="kitchen-dashboard">3. Kitchen Dashboard (KDS)</h2>
      <p>
        The Kitchen Dashboard functions as a Kitchen Display System (KDS), organizing incoming kitchen tickets into a real-time Kanban workflow across status stages.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} color="var(--color-primary)" /> Real-Time Kanban Board
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            4 status columns: <strong>Queue</strong> (New) ➔ <strong>Preparing</strong> (Cooking) ➔ <strong>Ready</strong> (Pickup) ➔ <strong>Serving</strong> (Active).
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--color-primary)" /> Standalone Add-On Cards
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Separate pulsing tickets generated when extra items are added to an active table order, allowing quick prep and 1-tap dismissal.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="var(--color-primary)" /> Item Modifications & Banners
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Pulsing warning banners (`ITEMS UPDATED BY CUSTOMER`) highlight ticket changes instantly when dishes or quantities are modified.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--color-primary)" /> Elapsed Urgency Timers
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Live order age timers (`⏱️ 5m ago`) with red warning badges (`LATE BY Xm`) for orders overdue by more than 20 minutes.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-primary)" /> Kitchen Station Access
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Secure kitchen account login provisioned through the Manager / Owner Portals for station access control.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--color-primary)" /> Instant Waiter Ready Alerts
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Tapping <strong>Mark Ready</strong> moves ticket to Ready column and triggers real-time notification alerts to the assigned waiter.
          </p>
        </div>
      </div>

      <h3>Kitchen Display System (KDS) Columns & Workflow</h3>
      <p>The Kitchen Dashboard uses the following 4 status columns:</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Column Stage</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Description</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Key Capabilities & Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Queue (New)</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Incoming order tickets</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Displays new orders with table numbers, daily order numbers, item list, and tap <strong>Start Preparing</strong> button.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Preparing (Cooking)</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Active preparation stage</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Tracks cooking progress, shows standalone <strong>Add-On Cards</strong> for item updates, and tap <strong>Mark Ready</strong> button.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Ready (Pickup)</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Ready for waiter pickup</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Lists completed dishes awaiting serving; sends instant ready notifications to waiter app.</td>
          </tr>
          <tr>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Serving (Active)</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Orders currently being served</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Displays active orders that have been picked up and are currently being served at customer tables.</td>
          </tr>
        </tbody>
      </table>

      <div className="docs-callout tip">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>The Kitchen KDS plays a loud audio chime whenever a new order is received over the network so chefs never miss an incoming ticket during busy rushes.</p>
      </div>

      {/* ── 4. END-TO-END SYSTEM FLOW ────────────────────────────────────────── */}
      <h2 id="system-flow">4. End-to-End Inter-Dashboard Flow</h2>
      <p>
        How all app dashboards and systems operate together during a live dining session:
      </p>

      <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '32px' }}>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.85, fontSize: '14.5px', color: 'var(--color-text)' }}>
          <li style={{ marginBottom: '16px' }}>
            <strong>Order Initiation (Customer QR / Waiter POS):</strong>
            <br />
            A customer scans the table QR code to submit an order request (appearing in the waiter's <strong>New Table Requests Panel</strong> to accept), or a waiter creates a manual order via <strong>Take Manual Order</strong>.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Kitchen Queue & Dispatch:</strong>
            <br />
            The order enters the system and appears in the <strong>Queue</strong> column on the <strong>Kitchen Display System (KDS)</strong> accompanied by a chime/notification.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Kitchen Prep & Add-On Tracking:</strong>
            <br />
            Chef taps <strong>Start Preparing</strong> (moving order to <strong>Preparing</strong> column). If extra items are added during dining, standalone <strong>Add-On Cards</strong> and updated item banners alert the kitchen staff in real time.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Ready Alert & Serving:</strong>
            <br />
            Once cooking completes, chef taps <strong>Mark Ready</strong> (moving ticket to <strong>Ready</strong>). The assigned waiter receives an alert notification, picks up the dishes, and marks them as served.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Bill Settlement & Table Clearance:</strong>
            <br />
            Waiter opens <strong>Order Detail & Settlement</strong>, verifies the bill, collects payment (Cash, Card, or UPI), and completes the order session, releasing the table status.
          </li>
          <li>
            <strong>Manager Real-Time Sync & Day Close:</strong>
            <br />
            Sales totals and KPI cards update live on the <strong>Manager Dashboard</strong> and <strong>Business Analytics</strong>. At end of day, manager records cash expenses in <strong>Expenses Ledger</strong> and performs drawer reconciliation in <strong>Day Close Register</strong>.
          </li>
        </ol>
      </div>

      {/* Navigation */}
      <div style={{ marginTop: '48px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/docs/rms/ordering" className="btn btn-primary">
          Ordering System <ArrowRight size={15} />
        </Link>
        <Link to="/docs/rms" className="btn btn-secondary">
          ← Back to Overview
        </Link>
      </div>
    </DocsLayout>
  );
}
