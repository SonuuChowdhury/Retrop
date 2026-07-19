// ============================================================================
// RMS ORDERING SYSTEM DOC (/docs/rms/ordering)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import DocsLayout from '../../components/DocsLayout';
import { ArrowRight, Lightbulb, Info } from 'lucide-react';

export default function RMSOrdering() {
  return (
    <DocsLayout title="RMS Ordering System">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        <Link to="/docs" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Docs</Link>
        <span>›</span>
        <Link to="/docs/rms" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Retrop RMS</Link>
        <span>›</span>
        <span style={{ color: 'var(--color-text)' }}>Ordering System</span>
      </div>

      <span className="badge badge-primary" style={{ marginBottom: '16px' }}>Ordering System</span>
      <h1>Retrop RMS — Ordering System</h1>
      <p style={{ fontSize: '17px', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '32px' }}>
        The Retrop ordering system enables restaurants to take customer orders digitally via QR codes,
        eliminating paper menus and reducing the time between ordering and kitchen acknowledgement.
      </p>

      {/* TOC */}
      <div className="docs-toc">
        <h4>On this page</h4>
        <ul>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#setup">Setting Up the Ordering System</a></li>
          <li><a href="#customer-flow">Customer Ordering Flow</a></li>
          <li><a href="#kitchen-flow">Kitchen & Staff Flow</a></li>
          <li><a href="#order-lifecycle">Order Lifecycle</a></li>
          <li><a href="#menu-management">Managing the Digital Menu</a></li>
          <li><a href="#takeaway">Takeaway & Pickup Mode</a></li>
          <li><a href="#troubleshooting">Troubleshooting</a></li>
        </ul>
      </div>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The Retrop ordering system is built around a simple, contactless workflow:
      </p>
      <ol>
        <li><strong>QR Code per Table</strong> — Each table in your restaurant gets a unique QR code, generated from the Owner's Portal.</li>
        <li><strong>Customer Scans</strong> — The customer opens their phone camera and scans the QR code — no app download required.</li>
        <li><strong>Digital Menu</strong> — A mobile-optimised menu loads in the browser, showing categories, items, images, and prices.</li>
        <li><strong>Order Placed</strong> — Customer selects items and places the order. It's instantly received by the kitchen app and owner portal.</li>
        <li><strong>Kitchen Prepares</strong> — Kitchen staff view and manage the order on the mobile app or a kitchen display screen.</li>
        <li><strong>Served</strong> — Once ready, the waiter receives a notification to serve the order.</li>
      </ol>

      <div className="docs-callout tip">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>The ordering system is also accessible on a staff-operated device — waiters can place orders on behalf of customers by scanning the same QR code or using the staff app's manual ordering mode.</p>
      </div>

      <h2 id="setup">Setting Up the Ordering System</h2>
      <p>Before going live, complete these steps in the Owner's Portal:</p>

      <h3>1. Build your digital menu</h3>
      <ul>
        <li>Go to <strong>Menu Manager</strong> in the Owner's Portal.</li>
        <li>Create <strong>categories</strong> (e.g., Starters, Main Course, Beverages, Desserts).</li>
        <li>Add <strong>items</strong> under each category — name, price, description, image, and dietary tags.</li>
        <li>Toggle items as <strong>Available</strong> or <strong>Unavailable</strong> (useful for daily specials or sold-out items).</li>
        <li>Mark items as <strong>Veg / Non-Veg / Vegan</strong> for customer filtering.</li>
      </ul>

      <h3>2. Set up your tables</h3>
      <ul>
        <li>Go to <strong>Table Management</strong> → <strong>Add Tables</strong>.</li>
        <li>Enter the number of tables and their names or numbers.</li>
        <li>The system generates a <strong>unique QR code</strong> for each table automatically.</li>
        <li>Download and <strong>print QR codes</strong> — laminate them or place them in table stands.</li>
      </ul>

      <h3>3. Test before going live</h3>
      <ul>
        <li>Scan one of your table QR codes with your phone.</li>
        <li>Place a test order and verify it appears in the Owner's Portal and Mobile App.</li>
        <li>Confirm order status updates are working correctly.</li>
      </ul>

      <h2 id="customer-flow">Customer Ordering Flow</h2>
      <p>Here's exactly what the customer experiences:</p>
      <ol>
        <li><strong>Scan the QR Code</strong> — Open camera app, point at the table QR code. A link opens automatically.</li>
        <li><strong>Browse the Menu</strong> — Customers see your full menu, organized by category. They can filter by Veg/Non-Veg or search for specific items.</li>
        <li><strong>Add Items</strong> — Tap the <code>+</code> button to add items. A cart icon shows the running total.</li>
        <li><strong>Add Special Instructions</strong> — Customers can add notes per item (e.g., "No onions", "Extra spicy").</li>
        <li><strong>Place Order</strong> — Tap "Place Order". A confirmation screen shows the order summary and estimated wait time.</li>
        <li><strong>Order Tracking</strong> — Customers can refresh the page to see their order status update from <code>Confirmed → Preparing → Ready → Served</code>.</li>
      </ol>

      <div className="docs-callout info">
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p>No login or app download is required for customers. The ordering menu works entirely in the mobile browser.</p>
      </div>

      <h2 id="kitchen-flow">Kitchen & Staff Flow</h2>
      <p>When a customer places an order, here's what happens on the restaurant side:</p>
      <ol>
        <li>A <strong>push notification</strong> is sent to the kitchen app and any logged-in staff devices.</li>
        <li>The order appears in the <strong>Orders</strong> list with the table number, items, and any special instructions.</li>
        <li>Kitchen staff tap <strong>"Acknowledge"</strong> to change the status from <code>Pending → Confirmed</code>.</li>
        <li>Once cooking begins, tap <strong>"Start Preparing"</strong> → status becomes <code>Preparing</code>.</li>
        <li>When the order is plated and ready, tap <strong>"Mark Ready"</strong> → status becomes <code>Ready</code>.</li>
        <li>The assigned waiter is notified via app notification to serve the table.</li>
        <li>Waiter confirms delivery by tapping <strong>"Mark Served"</strong> → status becomes <code>Served</code>.</li>
      </ol>

      <h2 id="order-lifecycle">Order Lifecycle</h2>
      <p>Every order goes through the following state machine:</p>

      <div style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)', padding: '20px 24px', margin: '16px 0', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 2 }}>
        <div><code style={{ background: 'none', border: 'none', padding: 0 }}>PENDING</code> → <code style={{ background: 'none', border: 'none', padding: 0 }}>CONFIRMED</code> → <code style={{ background: 'none', border: 'none', padding: 0 }}>PREPARING</code> → <code style={{ background: 'none', border: 'none', padding: 0 }}>READY</code> → <code style={{ background: 'none', border: 'none', padding: 0 }}>SERVED</code></div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>At any point before SERVED: → CANCELLED</div>
      </div>

      <ul>
        <li><code>PENDING</code>: Order placed by customer, awaiting kitchen acknowledgment</li>
        <li><code>CONFIRMED</code>: Kitchen has seen and acknowledged the order</li>
        <li><code>PREPARING</code>: Items are actively being cooked/prepared</li>
        <li><code>READY</code>: Order is complete and ready to be served</li>
        <li><code>SERVED</code>: Delivered to the customer — order is closed</li>
        <li><code>CANCELLED</code>: Order cancelled by staff with a reason logged</li>
      </ul>

      <h2 id="menu-management">Managing the Digital Menu</h2>
      <p>Your digital menu is always live. Changes made in the Owner's Portal update the customer-facing menu immediately.</p>

      <h3>Available / Unavailable toggle</h3>
      <p>
        If an item runs out mid-service, mark it as <strong>Unavailable</strong> in the menu manager.
        It will be greyed out and unorderable on the customer menu, preventing disappointment.
      </p>

      <h3>Daily Specials</h3>
      <p>
        Create a <strong>"Today's Specials"</strong> category and add/remove items as needed. These can be
        enabled for a day and disabled the next, keeping your menu fresh.
      </p>

      <h3>Pricing Updates</h3>
      <p>
        Price changes take effect immediately on the customer menu. There is no need to reprint QR codes —
        they always link to the live, updated menu.
      </p>

      <h2 id="takeaway">Takeaway & Pickup Mode</h2>
      <p>
        The ordering system also supports takeaway and pre-order scenarios. Instead of a table QR code,
        you can generate a <strong>Counter QR Code</strong> or <strong>Takeaway Link</strong>:
      </p>
      <ul>
        <li>Place the Counter QR code at the front counter for walk-in customers.</li>
        <li>Customers select "Takeaway" on the ordering page — no table number is assigned.</li>
        <li>Orders are displayed in the kitchen as <code>[TAKEAWAY]</code> orders with a reference number.</li>
        <li>Share the takeaway link on WhatsApp or social media for pre-orders.</li>
      </ul>

      <h2 id="troubleshooting">Troubleshooting</h2>

      <h3>QR Code not scanning</h3>
      <ul>
        <li>Ensure the QR code print quality is clear and not damaged.</li>
        <li>Make sure the customer's phone camera is in focus — move closer or further.</li>
        <li>Try increasing screen brightness if a digital QR is being used.</li>
        <li>If the issue persists, regenerate the QR code from the Owner's Portal.</li>
      </ul>

      <h3>Order not appearing in the kitchen app</h3>
      <ul>
        <li>Check that the kitchen device has a stable internet connection.</li>
        <li>Pull-to-refresh the Orders screen in the mobile app.</li>
        <li>Ensure push notifications are enabled for the Retrop app on the kitchen device.</li>
        <li>Log out and log back in to refresh the session.</li>
      </ul>

      <h3>Customer can't access the menu</h3>
      <ul>
        <li>Verify that the table's QR code is still active in the Owner's Portal.</li>
        <li>Check that your restaurant's account is active and not suspended.</li>
        <li>Ensure the menu has at least one <strong>Available</strong> item in at least one category.</li>
      </ul>

      {/* Navigation */}
      <div style={{ marginTop: '48px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/docs/rms/portal" className="btn btn-primary">
          Owner's Portal Guide <ArrowRight size={15} />
        </Link>
        <Link to="/docs/rms/app" className="btn btn-secondary">
          ← Mobile App
        </Link>
      </div>
    </DocsLayout>
  );
}
