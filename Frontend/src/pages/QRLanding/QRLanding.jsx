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
import './QRLanding.css';

export default function QRLanding() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { setSession, setSessionToken, session: savedSession, setRestaurantInfo } = useOrder();

  const [error, setError] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | error | done
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!tableId || hasFetched.current) return;
    hasFetched.current = true;

    async function init() {
      try {
        // Always hit the API — we need to verify session is alive in backend Redis.
        // sessionStorage gives us a fallback snapshot but Redis is the source of truth.
        const res = await api.createOrderSession(tableId);
        const sessionData = res.data;

        setSession(sessionData);
        setSessionToken(sessionData.sessionToken);

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
    return <LoadingSpinner message="Connecting to table…" fullScreen />;
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
        navigate(`/order/${tableId}/placed/${orderId}`, { replace: true });
      } else {
        navigate(`/order/${tableId}/menu`, { replace: true });
      }
      break;
    default:
      navigate(`/order/${tableId}/info`, { replace: true });
  }
}
