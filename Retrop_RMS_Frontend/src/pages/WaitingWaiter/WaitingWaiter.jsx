// ============================================================================
// WaitingWaiter — /order/:tableId/waiting
// ============================================================================
// Customer waits for a waiter to accept the table.
// Polls GET /api/order/session/:tableId/status every 3 seconds.
// Auto-navigates to Menu when status becomes 'accepted' or 'ordering'.
// ============================================================================

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { useSessionPolling } from '../../hooks/useSessionPolling.js';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import './WaitingWaiter.css';

export default function WaitingWaiter() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { customerName, restaurantInfo, clearSession, setSession } = useOrder();
  const { session, error } = useSessionPolling(tableId, 3000, true);

  // ---------- Route on status change ----------
  // NOTE: Depend on the full `session` object (not just session?.status) so the
  // effect fires on every successful poll response. If we only watch the status
  // string, React can skip the effect when the reference changes but the
  // primitive value is considered identical (e.g. null → undefined edge cases).
  useEffect(() => {
    if (!session) return;

    setSession(session);
    if (session.customerToken) {
      localStorage.setItem(`rms_token_${tableId}`, session.customerToken);
    }

    const status = session.status;

    switch (status) {
      case 'waiting_customer_info':
        navigate(`/order/${tableId}/info`, { replace: true });
        break;
      case 'accepted':
      case 'ordering':
        // Waiter confirmed — go straight to menu
        navigate(`/order/${tableId}/menu`, { replace: true });
        break;
      case 'ordered':
        if (session.orderId) {
          navigate(`/order/${tableId}/placed/${session.orderId}`, { replace: true });
        }
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // watch full session object — fires on every poll update

  // ---------- Session expired ----------
  if (error?.status === 404) {
    return (
      <ErrorScreen
        title="Session Expired"
        message="Your session has expired. Please scan the QR code again to start a new order."
        emoji="⏱️"
        actionLabel="Scan QR Again"
        onAction={() => {
          clearSession();
          // Nothing to navigate to — user must physically scan QR
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <StatusBar currentStep="wait" restaurantName={restaurantInfo?.restaurantName} />

      <main className="waiting g-container">
        {/* Animation */}
        <div className="waiting__animation" aria-hidden="true">
          <div className="waiting__ring waiting__ring--1" />
          <div className="waiting__ring waiting__ring--2" />
          <div className="waiting__ring waiting__ring--3" />
          <span className="waiting__emoji">🛎️</span>
        </div>

        <div className="waiting__content">
          <h1 className="waiting__title">
            {customerName ? `Hi, ${customerName}!` : 'Please wait…'}
          </h1>
          <p className="waiting__subtitle">
            A waiter has been notified and will come to your table shortly. This page will
            update automatically when your table is accepted.
          </p>

          {/* Table info */}
          {session?.tableNo && (
            <div className="waiting__table-badge">
              Table {session.tableNo}
            </div>
          )}

          <p className="waiting__hint">
            No need to refresh — we'll take you to the menu automatically.
          </p>
        </div>

        {/* Waiter name once accepted — usually navigated away before showing */}
        {session?.waiterName && (
          <div className="waiting__waiter-tag">
            Your waiter: <strong>{session.waiterName}</strong>
          </div>
        )}
      </main>
    </div>
  );
}
