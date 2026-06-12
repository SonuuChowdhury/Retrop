// ============================================================================
// ThankYou — /bill/:orderId
// ============================================================================
// Shows the final bill after the waiter has marked payment complete.
// GET /api/order/:orderId/bill
// If payment not done yet → shows "Payment not completed" message.
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import BillView from '../../components/BillView/BillView.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import './ThankYou.css';

export default function ThankYou() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    api.getOrderBill(orderId)
      .then((res) => {
        setOrder(res.data.order);
        setRestaurantInfo(res.data.restaurantInfo);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <LoadingSpinner message="Loading your bill…" fullScreen />;
  }

  // Payment not done yet
  if (error?.status === 400) {
    return (
      <div className="thankyou-pending">
        <div className="thankyou-pending__content">
          <div className="thankyou-pending__icon">⏳</div>
          <h2>Payment Pending</h2>
          <p>The waiter will process your payment shortly. Your bill will appear here once complete.</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="thankyou-pending">
        <div className="thankyou-pending__content">
          <div className="thankyou-pending__icon">❓</div>
          <h2>Bill Not Found</h2>
          <p>We could not find this bill. Please ask the staff for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="thankyou g-container">
        {/* Thank you header */}
        <div className="thankyou__header">
          <div className="thankyou__emoji">🙏</div>
          <h1 className="thankyou__title">Thank You!</h1>
          <p className="thankyou__subtitle">
            Thank you for dining at {restaurantInfo?.restaurantName || 'our restaurant'}.
            We hope to see you again!
          </p>
        </div>

        {/* Bill */}
        <BillView order={order} restaurantInfo={restaurantInfo} />

        {/* Save / Print */}
        <div className="thankyou__actions">
          <button
            className="btn btn--ghost"
            onClick={() => window.print()}
          >
            📄 Save / Print Bill
          </button>
        </div>
      </main>
    </div>
  );
}
