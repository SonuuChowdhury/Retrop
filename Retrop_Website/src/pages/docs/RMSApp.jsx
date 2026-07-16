// ============================================================================
// RMS MOBILE APP DOC (/docs/rms/app)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import { ArrowRight } from 'lucide-react';

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
          <li><a href="#home-screen">Home Screen</a></li>
          <li><a href="#order-management">Order Management</a></li>
          <li><a href="#inventory-check">Inventory Check</a></li>
          <li><a href="#task-list">Task List</a></li>
          <li><a href="#notifications">Notifications</a></li>
          <li><a href="#profile-settings">Profile & Settings</a></li>
        </ul>
      </div>

      <h2 id="installation">Installation & Login</h2>
      <p>
        The Retrop RMS app is available for both Android and iOS. Your restaurant owner will share
        your staff credentials when they set up your account.
      </p>
      <h3>Steps to get started:</h3>
      <ol>
        <li>Download the <strong>Retrop RMS</strong> app from the Google Play Store or Apple App Store.</li>
        <li>Open the app and enter your <strong>staff email</strong> and the <strong>temporary password</strong> provided by your manager.</li>
        <li>On first login, you'll be prompted to <strong>set a new password</strong>. Choose something memorable and at least 6 characters.</li>
        <li>Once logged in, the app automatically loads your <strong>role-specific dashboard</strong>.</li>
      </ol>

      <div className="docs-callout info">
        <div>ℹ️</div>
        <p>If you forget your password, contact your restaurant owner or manager. Password resets for staff accounts are managed by the owner through the Owner's Portal.</p>
      </div>

      <h2 id="roles">User Roles in the App</h2>
      <p>The mobile app shows different screens and permissions based on the role assigned to your account:</p>
      <ul>
        <li><strong>Kitchen Staff</strong> — View incoming orders, mark items as prepared, see ingredient usage for each dish</li>
        <li><strong>Waiter / Floor Staff</strong> — Take orders at tables, send orders to kitchen, update table status</li>
        <li><strong>Manager</strong> — All of the above, plus access to inventory counts, low-stock alerts, and daily summaries</li>
      </ul>
      <p>Role permissions are configured by the restaurant owner in the Owner's Portal and cannot be changed from the mobile app.</p>

      <h2 id="home-screen">Home Screen</h2>
      <p>
        The Home Screen is your command center. It shows you the most important information at a glance:
      </p>
      <ul>
        <li><strong>Active Orders</strong> — A live count of orders currently being processed</li>
        <li><strong>Today's Summary</strong> — Covers served, pending, and cancelled orders for the current shift</li>
        <li><strong>Low Stock Alerts</strong> — Items flagged as below the set reorder threshold (Manager role only)</li>
        <li><strong>Quick Actions</strong> — Shortcuts to New Order, Inventory, and Task List</li>
        <li><strong>Shift Status</strong> — Whether you're currently clocked in or out</li>
      </ul>

      <h2 id="order-management">Order Management</h2>
      <p>
        The Orders section is the most used part of the app. Here, you can view, manage, and track every order placed in your restaurant.
      </p>
      <h3>Order statuses</h3>
      <ul>
        <li><code>Pending</code> — Order received, not yet acknowledged by the kitchen</li>
        <li><code>Confirmed</code> — Kitchen has acknowledged the order</li>
        <li><code>Preparing</code> — Items are being prepared in the kitchen</li>
        <li><code>Ready</code> — Order is ready for serving or pickup</li>
        <li><code>Served</code> — Order has been delivered to the customer</li>
        <li><code>Cancelled</code> — Order was cancelled (reason recorded)</li>
      </ul>

      <h3>Placing an order (Waiter role)</h3>
      <ol>
        <li>Tap <strong>"New Order"</strong> on the home screen or Orders tab.</li>
        <li>Select the <strong>table number</strong> from the floor plan.</li>
        <li>Browse the menu by category and tap items to add them to the order.</li>
        <li>Adjust quantities, add special instructions for each item if needed.</li>
        <li>Tap <strong>"Send to Kitchen"</strong>. The order is immediately visible on the kitchen's screen.</li>
        <li>Track the order status in real time from the Orders list.</li>
      </ol>

      <h3>Managing orders (Kitchen role)</h3>
      <ol>
        <li>New orders appear automatically on the Kitchen Orders screen.</li>
        <li>Tap an order to view the full item list and any special instructions.</li>
        <li>Tap <strong>"Start Preparing"</strong> to change the status to <code>Preparing</code>.</li>
        <li>Once items are ready, tap <strong>"Mark as Ready"</strong> — this notifies the floor staff.</li>
      </ol>

      <div className="docs-callout tip">
        <div>💡</div>
        <p>Enable push notifications in your phone settings to receive instant alerts when an order is placed or when a status changes.</p>
      </div>

      <h2 id="inventory-check">Inventory Check</h2>
      <p>
        Managers and owners can perform quick inventory checks from the mobile app. This is useful
        during morning setup or before a busy shift.
      </p>
      <ul>
        <li>Navigate to <strong>Inventory</strong> from the bottom navigation bar.</li>
        <li>View all ingredients grouped by category (Vegetables, Proteins, Dairy, Dry Goods, etc.).</li>
        <li>Tap any item to view its current stock level, unit, reorder threshold, and last updated time.</li>
        <li>Use the <strong>"Update Stock"</strong> button to log a quantity adjustment (e.g., after a delivery arrives).</li>
        <li>Items highlighted in <span style={{ color: 'var(--color-danger)' }}>red</span> are below their reorder threshold — a purchase order should be raised.</li>
      </ul>

      <h2 id="task-list">Task List</h2>
      <p>
        The Task List feature allows managers to assign daily tasks to staff members — such as cleaning schedules,
        prep work, or equipment checks.
      </p>
      <ul>
        <li>Staff can view tasks assigned to them under the <strong>Tasks</strong> tab.</li>
        <li>Tap a task to view details, due time, and priority level.</li>
        <li>Mark tasks as <strong>Complete</strong> once done — this is visible to the manager in real time.</li>
        <li>Managers can create, edit, and assign tasks from either the app or the Owner's Portal.</li>
      </ul>

      <h2 id="notifications">Notifications</h2>
      <p>The Retrop RMS app sends push notifications for important events:</p>
      <ul>
        <li>New order received (Kitchen staff)</li>
        <li>Order marked as ready (Floor staff)</li>
        <li>Low-stock alert triggered (Managers)</li>
        <li>Task assigned or overdue (All staff)</li>
        <li>Shift reminder (All staff)</li>
      </ul>
      <p>Notification preferences can be adjusted in the app's <strong>Settings → Notifications</strong> screen.</p>

      <h2 id="profile-settings">Profile & Settings</h2>
      <p>Access your profile from the bottom navigation bar or the top-right avatar icon.</p>
      <ul>
        <li><strong>Profile</strong> — View and update your display name and contact number.</li>
        <li><strong>Change Password</strong> — Update your account password at any time.</li>
        <li><strong>Language</strong> — Switch the app language (Hindi and English currently supported).</li>
        <li><strong>Theme</strong> — Toggle between Light and Dark mode.</li>
        <li><strong>Log Out</strong> — Sign out of your account. You'll need your credentials to log back in.</li>
      </ul>

      <div className="docs-callout warning">
        <div>⚠️</div>
        <p>Logging out clears your session. If you share a device with other staff, make sure to log out when done to protect your account.</p>
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
