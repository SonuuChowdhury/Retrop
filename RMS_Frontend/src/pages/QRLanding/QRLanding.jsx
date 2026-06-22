// ============================================================================
// QRLanding — /order/:tableId
// ============================================================================
// This is the first page a customer sees after scanning the QR code.
// It creates/resumes an order session and routes to the right next step.
// ============================================================================

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useOrder } from '../../context/OrderContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import './QRLanding.css';

export default function QRLanding() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { setSession, setSessionToken, session: savedSession, setRestaurantInfo } = useOrder();

  const [error, setError] = useState(null);
  const [tableBusy, setTableBusy] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | error | busy | done
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!tableId || hasFetched.current) return;
    hasFetched.current = true;

    async function init() {
      try {
        // Check for active token first to resume tracking if ordering/active
        const savedToken = localStorage.getItem(`rms_token_${tableId}`);
        if (savedToken) {
          try {
            const check = await api.checkCustomerToken(tableId, savedToken);
            if (check.status === 'success' && check.valid) {
              const { orderId, isPaymentCompleted } = check.data;
              if (isPaymentCompleted) {
                navigate(`/bill/${orderId}`, { replace: true });
                return;
              } else {
                navigate(`/order/${tableId}/tracking/${orderId}`, { replace: true });
                return;
              }
            }
          } catch (tokErr) {
            console.warn('Saved token validation failed, starting fresh session', tokErr);
          }
        }

        // Always hit the API — we need to verify session is alive in backend Redis.
        // sessionStorage gives us a fallback snapshot but Redis is the source of truth.
        const res = await api.createOrderSession(tableId);
        const sessionData = res.data;

        setSession(sessionData);
        setSessionToken(sessionData.sessionToken);
        if (sessionData.customerToken) {
          localStorage.setItem(`rms_token_${tableId}`, sessionData.customerToken);
        }

        // Fetch restaurant info for branding (best-effort, non-blocking)
        api.getRestaurantInfo()
          .then((r) => setRestaurantInfo(r.data))
          .catch(() => {}); // ignore branding errors

        // Route based on current session status
        routeFromStatus(sessionData.status, tableId, sessionData.orderId, navigate);
        setStatus('done');
      } catch (err) {
        setStatus('error');

        // 403 — restaurant is closed
        if (err.status === 403) {
          setError({
            title: "We're Closed",
            message: err.message || 'The restaurant is currently closed. Please try again later.',
            emoji: '🔒',
          });
          return;
        }

        // ISSUE 1: 423 Locked — table is occupied by another customer
        if (err.status === 423) {
          setTableBusy(true);
          setStatus('busy');
          return;
        }

        // 404 — invalid tableId
        if (err.status === 404) {
          setError({
            title: 'Invalid Table',
            message: 'This QR code is not valid. Please ask the staff for assistance.',
            emoji: '❓',
          });
          return;
        }

        // Network / other errors
        setError({
          title: 'Connection Error',
          message: err.message || 'Could not connect to the server. Please check your internet connection.',
          emoji: '📶',
          retryable: true,
        });
      }
    }

    init();
  }, [tableId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    hasFetched.current = false;
    setStatus('loading');
    setError(null);
    // trigger re-run
    hasFetched.current = false;
  };

  if (status === 'loading') {
    return (
      <div className="app-shell" style={{ padding: 'var(--space-8) var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Skeleton type="circle" width={80} height={80} />
          <Skeleton type="title" style={{ maxWidth: '80%' }} />
          <Skeleton type="line" width="50%" />
          <Skeleton type="line" width="30%" />
        </div>
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <ErrorScreen
        title={error.title}
        message={error.message}
        emoji={error.emoji}
        actionLabel={error.retryable ? 'Try Again' : null}
        onAction={error.retryable ? handleRetry : null}
      />
    );
  }

  // ISSUE 1: Table is occupied by another customer
  if (status === 'busy' || tableBusy) {
    return (
      <div className="app-shell" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '16px', padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '72px', marginBottom: '8px' }}>🪑</div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Table Occupied</h1>
        <p style={{ fontSize: '15px', lineHeight: '1.65', color: 'var(--color-text-muted, #888)', maxWidth: '300px', margin: 0 }}>
          This table is currently occupied by another guest. Please ask the staff for assistance.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #666)', margin: '4px 0 0' }}>
          Thank you for your patience! 🙏
        </p>
      </div>
    );
  }

  return null;
}

// --------------------------------------------------------------------------
// Route based on session status — single place to update if states change
// --------------------------------------------------------------------------
function routeFromStatus(status, tableId, orderId, navigate) {
  switch (status) {
    case 'waiting_customer_info':
      navigate(`/order/${tableId}/info`, { replace: true });
      break;
    case 'waiting_waiter':
      navigate(`/order/${tableId}/waiting`, { replace: true });
      break;
    case 'accepted':
      navigate(`/order/${tableId}/menu`, { replace: true });
      break;
    case 'ordering':
    case 'ordered':
      if (orderId) {
        navigate(`/order/${tableId}/tracking/${orderId}`, { replace: true });
      } else {
        navigate(`/order/${tableId}/menu`, { replace: true });
      }
      break;
    default:
      navigate(`/order/${tableId}/info`, { replace: true });
  }
}
