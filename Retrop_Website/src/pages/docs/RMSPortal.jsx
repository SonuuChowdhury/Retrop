// ============================================================================
// RMS OWNER'S PORTAL DOC (/docs/rms/portal)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import { ArrowRight, Lightbulb, AlertTriangle } from 'lucide-react';

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
      <h1>Retrop RMS — Owner's Portal</h1>
      <p style={{ fontSize: '17px', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '32px' }}>
        The Owner's Portal is the central web dashboard for restaurant owners to manage every aspect
        of their Retrop RMS setup — from inventory and staff to analytics and vendor management.
      </p>

      {/* TOC */}
      <div className="docs-toc">
        <h4>On this page</h4>
        <ul>
          <li><a href="#accessing">Accessing the Portal</a></li>
          <li><a href="#dashboard-overview">Dashboard Overview</a></li>
          <li><a href="#inventory">Inventory Management</a></li>
          <li><a href="#menu-manager">Menu Manager</a></li>
          <li><a href="#cost-calculator">Cost Calculator</a></li>
          <li><a href="#staff-management">Staff Management</a></li>
          <li><a href="#vendor-management">Vendor Management</a></li>
          <li><a href="#orders-section">Orders Section</a></li>
          <li><a href="#analytics">Analytics & Reports</a></li>
          <li><a href="#table-management">Table Management</a></li>
          <li><a href="#settings">Account Settings</a></li>
        </ul>
      </div>

      <h2 id="accessing">Accessing the Portal</h2>
      <p>
        The Owner's Portal is a web application accessible at <code>retrop.in/login</code> from any modern browser.
        Use the owner credentials provided by the Retrop team when your account was created.
      </p>
      <ul>
        <li><strong>Supported browsers:</strong> Chrome, Firefox, Safari, Edge (latest versions)</li>
        <li><strong>Works on:</strong> Desktop, laptop, and tablet (mobile support coming soon)</li>
        <li><strong>First-time login:</strong> You'll be prompted to change your temporary password before entering the portal</li>
      </ul>

      <h2 id="dashboard-overview">Dashboard Overview</h2>
      <p>
        The main dashboard gives you a snapshot of your restaurant's current status. It refreshes automatically
        and shows live data.
      </p>
      <h3>Dashboard widgets</h3>
      <ul>
        <li><strong>Today's Orders</strong> — Total orders placed today, with a breakdown by status</li>
        <li><strong>Revenue Today</strong> — Gross revenue from served orders (based on menu prices)</li>
        <li><strong>Active Staff</strong> — Number of staff currently clocked in</li>
        <li><strong>Low Stock Items</strong> — Count of ingredients below their reorder threshold</li>
        <li><strong>Recent Orders Feed</strong> — Live list of the last 10 orders with table number and status</li>
        <li><strong>Top Selling Items Today</strong> — The most ordered menu items for the current day</li>
      </ul>

      <div className="docs-callout tip">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>Bookmark the dashboard link in your browser for quick daily access. The portal stays logged in for 7 days before requiring re-authentication.</p>
      </div>

      <h2 id="inventory">Inventory Management</h2>
      <p>
        The Inventory section is the core of Retrop RMS. Every ingredient your kitchen uses is tracked here,
        giving you visibility into what you have, what you've used, and what needs to be ordered.
      </p>
      <h3>Adding ingredients</h3>
      <ol>
        <li>Go to <strong>Inventory → Ingredients → Add New</strong>.</li>
        <li>Enter the ingredient name, unit of measurement (kg, litre, piece, etc.).</li>
        <li>Set the <strong>current stock quantity</strong> and the <strong>reorder threshold</strong> (quantity at which a low-stock alert is triggered).</li>
        <li>Optionally link to a vendor for automatic purchase order suggestions.</li>
        <li>Save — the ingredient is now tracked in real time.</li>
      </ol>

      <h3>Stock adjustments</h3>
      <p>Stock levels are automatically reduced when orders are served (based on recipe mappings). You can also manually adjust:</p>
      <ul>
        <li><strong>Add Stock</strong> — Log a delivery or purchase that increases stock</li>
        <li><strong>Remove Stock</strong> — Log wastage, spillage, or manual consumption</li>
        <li><strong>Stock Count</strong> — Perform a full physical count to reconcile system vs. actual stock</li>
      </ul>

      <h3>Low stock alerts</h3>
      <p>
        When an ingredient drops below its reorder threshold, it appears highlighted in the Inventory list
        and triggers notifications to Managers and the Owner. You can configure alert delivery via
        push notification or email in <strong>Settings → Notifications</strong>.
      </p>

      <h2 id="menu-manager">Menu Manager</h2>
      <p>
        The Menu Manager is where you build and maintain your digital menu — the same menu customers
        see when they scan your table QR codes.
      </p>
      <h3>Categories</h3>
      <p>Start by creating menu categories (e.g., Starters, Mains, Beverages). Each category can have:</p>
      <ul>
        <li>A name and optional description</li>
        <li>A display order (drag to reorder)</li>
        <li>An enabled/disabled toggle (useful for seasonal menus)</li>
      </ul>
      <h3>Menu items</h3>
      <p>Each menu item includes:</p>
      <ul>
        <li><strong>Name and description</strong></li>
        <li><strong>Price</strong> (inclusive of all taxes by default)</li>
        <li><strong>Image</strong> (JPG/PNG, recommended 800×800px)</li>
        <li><strong>Dietary tag</strong> — Veg, Non-Veg, Vegan, Contains Allergens</li>
        <li><strong>Serving size</strong></li>
        <li><strong>Recipe linkage</strong> — Link menu items to ingredient recipes for automatic stock deduction</li>
        <li><strong>Available toggle</strong> — Hide items from customers instantly</li>
      </ul>

      <h2 id="cost-calculator">Cost Calculator</h2>
      <p>
        The Cost Calculator helps you understand the true cost of each dish and determine your margins.
        This is one of the most powerful features of Retrop RMS for driving profitability.
      </p>
      <h3>How it works</h3>
      <ol>
        <li>Select a menu item to analyse.</li>
        <li>Add the ingredients used in the recipe and their quantities per serving.</li>
        <li>The system calculates the <strong>raw material cost per plate</strong> based on your current ingredient prices.</li>
        <li>Set your <strong>selling price</strong> and the system shows your <strong>gross margin percentage</strong>.</li>
        <li>Optionally add overhead costs (staff hours, utilities) for a net margin estimate.</li>
      </ol>
      <p>
        As ingredient prices change (after a purchase), the cost calculator automatically updates — helping you
        spot when a dish's margin has eroded and price adjustments are needed.
      </p>

      <h2 id="staff-management">Staff Management</h2>
      <p>Manage all staff accounts from the Staff section of the portal.</p>
      <h3>Adding a staff member</h3>
      <ol>
        <li>Go to <strong>Staff → Add Member</strong>.</li>
        <li>Enter their name, email, phone number, and role (Kitchen, Waiter, Manager).</li>
        <li>The system generates a temporary password and emails it to the staff member.</li>
        <li>On first login via the mobile app, they're prompted to set a new password.</li>
      </ol>
      <h3>Roles & permissions</h3>
      <ul>
        <li><strong>Kitchen</strong> — View and manage orders only; no access to inventory, analytics, or staff management</li>
        <li><strong>Waiter / Floor</strong> — Place orders, view order status, update table status</li>
        <li><strong>Manager</strong> — All of the above + inventory, purchase orders, task management, and shift reports</li>
        <li><strong>Owner</strong> — Full access to everything, including billing, settings, and account management</li>
      </ul>
      <h3>Deactivating a staff account</h3>
      <p>
        To remove a staff member's access immediately, go to their profile and toggle <strong>Account Status → Inactive</strong>.
        This prevents login without deleting their history.
      </p>

      <h2 id="vendor-management">Vendor Management</h2>
      <p>
        The Vendor section tracks all your ingredient suppliers and purchase history.
      </p>
      <h3>Adding a vendor</h3>
      <ul>
        <li>Name, contact person, phone, email, and address</li>
        <li>Ingredients typically supplied by this vendor</li>
        <li>Payment terms (e.g., 30-day credit)</li>
      </ul>
      <h3>Purchase orders</h3>
      <p>When ingredients hit their reorder threshold, Retrop can suggest a purchase order automatically:</p>
      <ol>
        <li>Go to <strong>Vendors → Purchase Orders → Create New</strong>.</li>
        <li>Select the vendor and the ingredients to order.</li>
        <li>Enter quantities and expected delivery date.</li>
        <li>Submit the order — it's saved in history and used to update stock when goods are received.</li>
        <li>When delivery arrives, mark the PO as <strong>Received</strong> — stock is automatically updated.</li>
      </ol>

      <h2 id="orders-section">Orders Section</h2>
      <p>
        The Orders section in the portal gives you a bird's-eye view of all orders — current and historical.
      </p>
      <ul>
        <li><strong>Live Orders</strong> — All orders currently in <code>Pending</code>, <code>Confirmed</code>, or <code>Preparing</code> state</li>
        <li><strong>Order History</strong> — Filter by date range, table, staff member, or item</li>
        <li><strong>Order Details</strong> — Click any order to see the full item list, timestamps, and staff who handled it</li>
        <li><strong>Refunds / Cancellations</strong> — Log and track cancelled orders with reasons</li>
      </ul>

      <h2 id="analytics">Analytics & Reports</h2>
      <p>
        The Analytics section gives you insight into your restaurant's performance over time.
      </p>
      <h3>Available reports</h3>
      <ul>
        <li><strong>Daily Revenue Summary</strong> — Orders served, gross revenue, average order value</li>
        <li><strong>Weekly / Monthly Trends</strong> — Revenue charts by day of the week and month</li>
        <li><strong>Top Selling Items</strong> — Ranked list of most ordered dishes for any period</li>
        <li><strong>Inventory Consumption</strong> — Which ingredients were used most and how fast stock is moving</li>
        <li><strong>Staff Performance</strong> — Orders handled per staff member, average processing time</li>
        <li><strong>Margin Analysis</strong> — Per-item profitability based on recipe costs and selling prices</li>
      </ul>
      <h3>Exporting reports</h3>
      <p>All reports can be exported as <strong>CSV</strong> or <strong>PDF</strong> from the Export button on each report page. Use these for accounting, CA filings, or business reviews.</p>

      <h2 id="table-management">Table Management</h2>
      <p>Set up and manage your restaurant's table layout:</p>
      <ul>
        <li><strong>Add Tables</strong> — Give each table a number or name</li>
        <li><strong>QR Code Generation</strong> — Download and print a QR code for each table</li>
        <li><strong>Table Status</strong> — View which tables are occupied, with active orders</li>
        <li><strong>Merge/Split Tables</strong> — Combine or split orders across multiple tables (coming soon)</li>
        <li><strong>Sections</strong> — Organise tables into sections (e.g., Indoor, Outdoor, Private Room)</li>
      </ul>

      <div className="docs-callout warning">
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>Regenerating a table's QR code invalidates the old one. If you reprint, make sure to replace all physical copies of that table's QR code.</p>
      </div>

      <h2 id="settings">Account Settings</h2>
      <p>Access Settings from the bottom-left of the dashboard sidebar.</p>
      <h3>Restaurant Profile</h3>
      <ul>
        <li>Restaurant name, address, GST number</li>
        <li>Logo and cover image (used on the digital menu)</li>
        <li>Operating hours</li>
        <li>Contact number displayed to customers</li>
      </ul>
      <h3>Billing & Subscription</h3>
      <ul>
        <li>View your current plan and usage</li>
        <li>Billing history and invoices</li>
        <li>Upgrade or modify your subscription (contact Retrop support)</li>
      </ul>
      <h3>Notifications</h3>
      <ul>
        <li>Email and push notification preferences</li>
        <li>Alert thresholds for low-stock notifications</li>
        <li>Daily summary email time</li>
      </ul>
      <h3>Theme</h3>
      <p>Toggle between <strong>Light Mode</strong> and <strong>Dark Mode</strong> using the theme toggle in the top-right header of the dashboard.</p>

      {/* Navigation */}
      <div style={{ marginTop: '48px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/docs/rms" className="btn btn-secondary">
          ← Back to Overview
        </Link>
        <Link to="/contact" className="btn btn-primary">
          Need Help? Contact Us <ArrowRight size={15} />
        </Link>
      </div>
    </DocsLayout>
  );
}
