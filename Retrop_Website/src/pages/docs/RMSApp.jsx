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
        <li><strong>Waiter / Floor Staff</strong> — Table management, POS order creation, running KOT updates, order status tracking, serving, and bill settlement.</li>
        <li><strong>Kitchen Staff</strong> — Kitchen Display System (KDS) Kanban board, order timers, item-level prep check-off, and ready alerts.</li>
      </ul>
      <p>Role permissions are configured by the restaurant owner in the Owner's Portal and enforced securely via backend authentication.</p>

      {/* ── 1. MANAGER DASHBOARD ─────────────────────────────────────────────── */}
      <h2 id="manager-dashboard">1. Manager Dashboard</h2>
      <p>
        The Manager Dashboard gives managers and owners complete operational control over the restaurant directly from their smartphone.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--color-primary)" /> Live Operations & Master Toggle
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Toggle restaurant ordering ON/OFF instantly. Real-time KPIs for Today's Revenue, Total Orders, Occupied Tables, Active Waiters, and Pending Orders.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="var(--color-primary)" /> Analytics & Business Reports
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Filter by Today, Last 7 Days, Last 30 Days, or Custom Range. View gross revenue, AOV, payment method split (Cash, Card, UPI), top dishes, and peak rush hours.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={16} color="var(--color-primary)" /> Menu Stock & Price Control
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            1-tap In-Stock / Out-of-Stock toggle per item to prevent orders for sold-out dishes. Price editing, category search, and menu item visibility.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutGrid size={16} color="var(--color-primary)" /> Floor Plan & QR Generator
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Visual floor layout with live statuses (Available, Occupied, Billed, Reserved). View and generate QR codes for customer self-ordering.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-primary)" /> Staff & Kitchen Management
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Create waiter and kitchen logins, view online shift status, and manage active order safety guards (prevents deleting staff with active orders).
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="var(--color-primary)" /> Expense Logger & EOD Day Close
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Log daily petty cash expenses (ingredients, repairs, advances). Perform End-of-Day register closure and drawer cash reconciliation.
          </p>
        </div>
      </div>

      <h3>Manager App Modules & Functionalities:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>App Section</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Page Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Key Capabilities & Functions</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Dashboard Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Operations Dashboard</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Master open/close toggle, real-time KPI counters, quick links to modules.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Analytics Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Analytics & Reports</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Revenue totals, payment method split, top-selling items, peak rush hour charts.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Menu & Stock Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Menu & Stock Control</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Toggle item availability (In-Stock / Out-of-Stock), edit prices, search & filter categories.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Floor Tables Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Table Floor Plan</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>View live table occupation statuses, generate table QR codes for customer self-ordering.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Waiters Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Waiter Management</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Add/remove waiters, view online status, safe deletion guard for active orders.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Kitchen Stations Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Kitchen KDS Accounts</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Provision kitchen display accounts, station assignments, active status toggles.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Expenses Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Expense Logger</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Log operational costs (ingredients, repairs, staff advance), category summary.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Day Close Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>EOD Shift Closure</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Drawer cash reconciliation, shift summary report, locking register session.</td>
          </tr>
          <tr>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Restaurant Info Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Restaurant Profile</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Edit restaurant name, phone, address, GSTIN, and tax settings.</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. WAITER DASHBOARD ─────────────────────────────────────────────── */}
      <h2 id="waiter-dashboard">2. Waiter Dashboard</h2>
      <p>
        The Waiter Dashboard empowers floor staff to take orders, manage tables, monitor kitchen prep in real time, and settle customer bills.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={16} color="var(--color-primary)" /> Waiter Home Command Center
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Overview of assigned tables, active order badges, real-time alert banners for ready orders, and shift summary counters.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--color-primary)" /> POS Order Creation
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Interactive menu browser with search, category tabs, quantity buttons, and custom item cooking instructions (e.g. "Less spicy").
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--color-primary)" /> Active Orders Stream
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Live status stream grouped by Pending, Cooking, Ready, Served, and Bill Requested. Auto-refreshes in real time.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="var(--color-primary)" /> Order Detail & Billing
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Add items to active running orders (Running KOT), mark items as Served, request customer bill, and conclude payment (Cash/Card/UPI) to clear table.
          </p>
        </div>
      </div>

      <h3>Waiter App Sections & Functionalities:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>App Section</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Page Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Key Capabilities & Functions</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Home Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Waiter Home</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Assigned table grid, active order counter, push notification banners, audio ready alerts.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Active Orders Tab</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Active Orders Stream</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Filterable live stream of table orders grouped by status with automatic real-time updates.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Create Order Screen</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Create New Order</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Table selector, category menu picker, item search, custom kitchen notes, Send KOT button.</td>
          </tr>
          <tr>
            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>Order Detail Screen</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Order Detail & Settlement</td>
            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>Add running KOT items, mark items as Served, print/request bill, process payment & free table.</td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. KITCHEN DASHBOARD ─────────────────────────────────────────────── */}
      <h2 id="kitchen-dashboard">3. Kitchen Dashboard (KDS)</h2>
      <p>
        The Kitchen Dashboard serves as the Kitchen Display System (KDS). It converts orders into digital kitchen tickets arranged in a real-time horizontal Kanban board.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0 32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} color="var(--color-primary)" /> Real-Time Kanban Board
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            4 columns: <strong>Queue / New</strong> ➔ <strong>Preparing / Cooking</strong> ➔ <strong>Ready for Pickup</strong> ➔ <strong>Completed History</strong>.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--color-primary)" /> Elapsed Urgency Timers
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Color-coded timers tracking elapsed time: Normal (&lt;10m), Warning (10-20m), Overdue (&gt;20m).
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--color-primary)" /> Item-Level Prep Check-Off
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Chefs can tap and check off individual dishes on a ticket as they finish cooking them.
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--color-primary)" /> Instant Waiter Ready Alerts
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Tapping <strong>Mark Ready</strong> moves ticket to Ready and triggers an instant chime & push alert on the waiter's device.
          </p>
        </div>
      </div>

      <div className="docs-callout tip">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>The Kitchen KDS plays a loud audio chime whenever a new order is received over the network so chefs never miss an incoming ticket during busy rushes.</p>
      </div>

      {/* ── 4. END-TO-END SYSTEM FLOW ────────────────────────────────────────── */}
      <h2 id="system-flow">4. End-to-End Inter-Dashboard Flow</h2>
      <p>
        Here is how all 3 dashboards operate together in real time during a live dining session:
      </p>

      <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '32px' }}>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.85, fontSize: '14.5px', color: 'var(--color-text)' }}>
          <li style={{ marginBottom: '16px' }}>
            <strong>Order Placement (Waiter POS / Digital QR):</strong>
            <br />
            A waiter enters an order on the <strong>New Order POS screen</strong> or a customer scans Table 4 QR code. The order is submitted instantly.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Automatic Real-Time Dispatch:</strong>
            <br />
            The system registers the order (Status: <strong>Pending</strong>) and immediately transmits it to the kitchen display screen along with a notification alert.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Kitchen KDS Processing:</strong>
            <br />
            The <strong>Kitchen Display Screen</strong> chimes and displays the ticket in the <strong>Queue</strong> column. Chef taps <strong>Start Preparing</strong> (Status: <strong>Preparing</strong>).
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Ready Alert & Serving:</strong>
            <br />
            When cooking finishes, chef taps <strong>Mark Ready</strong>. The assigned waiter's smartphone chimes with a notification banner. Waiter picks up the dish and taps <strong>Mark Served</strong> on the <strong>Order & Billing screen</strong>.
          </li>
          <li style={{ marginBottom: '16px' }}>
            <strong>Billing & Table Clearance:</strong>
            <br />
            Guest requests bill. Waiter generates bill and processes payment (Cash, Card, UPI). Waiter taps <strong>Conclude Payment</strong>, updating order status to <strong>Completed</strong> and resetting Table 4 back to <strong>Available</strong>.
          </li>
          <li>
            <strong>Manager Real-Time Sync & Shift Close:</strong>
            <br />
            Revenue, sales metrics, and tax data update live in the <strong>Manager Dashboard</strong> and <strong>Analytics section</strong>. At the end of the shift, the manager uses the <strong>Day Close section</strong> to perform cash drawer reconciliation and generate the EOD report.
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
