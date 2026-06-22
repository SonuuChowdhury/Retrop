// ============================================================================
// OrderPlaced — /order/:tableId/placed/:orderId
// ============================================================================
// Shown after the order is placed. Polls session every 15 s.
// When orderStatus becomes 'completed' and payment is done → /bill/:orderId
// ============================================================================

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionPolling } from '../../hooks/useSessionPolling.js';
import { useOrder } from '../../context/OrderContext.jsx';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import './OrderPlaced.css';

const STATUS_LABELS = {
  ordering:   { label: 'Order Received',      emoji: '📋', desc: 'Your order has been placed successfully.' },
  preparing:  { label: 'Being Prepared',       emoji: '👨‍🍳', desc: 'The kitchen is preparing your food now!' },
  ready:      { label: 'Ready to Serve',       emoji: '🍽️', desc: 'Your food is ready! The waiter is on the way.' },
  served:     { label: 'Served',               emoji: '✅', desc: 'Enjoy your meal! Let us know if you need anything.' },
  completed:  { label: 'Completed',            emoji: '🎉', desc: 'Your order is complete. Thank you for dining with us!' },
};

export default function OrderPlaced() {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const { restaurantInfo, cart } = useOrder();

  // Poll session status every 15 s
  const { session } = useSessionPolling(tableId, 15_000, true);

  // If the backend marks order complete + payment done → navigate to bill
  useEffect(() => {
    // We detect this by polling the session.
    // When session.status === 'ordered' it means it's in DB.
    // The waiter will 'conclude' → paymentCompleted → bill available.
    // We'll navigate to the bill when we detect orderId exists + a 'completed' signal.
    // For now, poll the session; the ThankYou page itself fetches the bill.
    // The waiter app sends the customer to /bill/:orderId via notification in a real flow.
    // Here we just show order status nicely.
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = session?.status ?? 'ordering';
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS['ordering'];

  return (
    <div className="app-shell">
      <StatusBar currentStep="order" restaurantName={restaurantInfo?.restaurantName} />

      <main className="order-placed g-container">
        {/* Big status display */}
        <div className="order-placed__status">
          <div className="order-placed__emoji" role="img" aria-label={statusInfo.label}>
            {statusInfo.emoji}
          </div>
          <h1 className="order-placed__status-label">{statusInfo.label}</h1>
          <p className="order-placed__status-desc">{statusInfo.desc}</p>
        </div>

        {/* Order number */}
        {session?.dailyOrderNo && (
          <div className="order-placed__badge">
            <span className="order-placed__badge-label">Order No.</span>
            <span className="order-placed__badge-num">#{session.dailyOrderNo}</span>
          </div>
        )}

        {/* Table + Waiter */}
        <div className="order-placed__meta">
          {session?.tableNo && (
            <div className="order-placed__meta-item">
              <span>🪑</span>
              <span>Table {session.tableNo}</span>
            </div>
          )}
          {session?.waiterName && (
            <div className="order-placed__meta-item">
              <span>👤</span>
              <span>Waiter: {session.waiterName}</span>
            </div>
          )}
        </div>

        {/* Ordered items recap */}
        {cart.length > 0 && (
          <div className="order-placed__items">
            <h2 className="order-placed__items-title">Your order</h2>
            {cart.map((item) => (
              <div key={item.dishId} className="order-placed__item">
                <span className="order-placed__item-name">{item.dishName}</span>
                <span className="order-placed__item-qty">×{item.quantity}</span>
              </div>
            ))}
          </div>
        )}

        <p className="order-placed__refresh-hint">
          This page updates automatically every 15 seconds.
        </p>

        {/* Bill access — available after payment */}
        {orderId && (
          <button
            className="btn btn--ghost order-placed__bill-btn"
            onClick={() => navigate(`/bill/${orderId}`)}
          >
            📄 View Bill
          </button>
        )}
      </main>
    </div>
  );
}
