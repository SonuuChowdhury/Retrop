// ============================================================================
// ThankYou — /bill/:orderId
// ============================================================================
// Shows the final bill after the waiter has marked payment complete.
// GET /api/order/:orderId/bill
// If payment not done yet → shows "Payment not completed" message.
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../../services/api.js';
import BillView from '../../components/BillView/BillView.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import './ThankYou.css';

const handleDownloadPDF = () => {
  // Use window.print() — universally supported on all browsers/devices.
  // The @media print CSS in BillView.css hides UI chrome and applies clean white bg.
  window.print();
};

const handleShareBill = async (order, restaurantInfo) => {
  if (!navigator.share) return;
  try {
    await navigator.share({
      title: `Bill — Order #${order.dailyOrderNo}`,
      text: `${restaurantInfo?.restaurantName || 'Restaurant'} — Order No #${order.dailyOrderNo} | Table ${order.tableNo} | Total: ₹${(order.finalAmount ?? order.totalAmount)?.toFixed(2)}`,
    });
  } catch (_) { /* user dismissed share sheet */ }
};

export default function ThankYou() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    api.getOrderBill(orderId)
      .then((res) => {
        setOrder(res.data.order);
        setRestaurantInfo(res.data.restaurantInfo);
        if (res.data.hasFeedback) {
          setFeedbackSubmitted(true);
        }
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(orderId, {
        rating,
        comment,
        mobile: order?.mobile,
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ padding: 'var(--space-6) var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ marginBottom: '8px' }}><Skeleton type="circle" width={60} height={60} /></div>
            <Skeleton type="title" />
            <Skeleton type="line" width="60%" />
          </div>
          <div style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-surface-1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ marginBottom: '8px' }}><Skeleton type="line" width="30%" height={16} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><Skeleton type="line" width="40%" /><Skeleton type="line" width="10%" /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><Skeleton type="line" width="50%" /><Skeleton type="line" width="10%" /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px dashed var(--color-border-strong)', paddingTop: '16px' }}>
              <Skeleton type="line" width="30%" height={18} />
              <Skeleton type="line" width="20%" height={18} />
            </div>
          </div>
        </div>
      </div>
    );
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

        {/* Feedback Section */}
        <div className="card" style={{ padding: '20px', marginBlock: '20px', background: 'var(--color-surface-1)', border: '1.5px solid var(--color-border)', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', textAlign: 'center', marginBottom: '12px' }}>Rate Your Experience</h3>
          
          {feedbackSubmitted ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-success)', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
                Thank you for your valuable feedback!
              </p>
              {rating >= 3 && restaurantInfo?.googleReviewLink && (
                <a
                  href={restaurantInfo.googleReviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', marginInline: 'auto', marginTop: '4px' }}
                >
                  ⭐ Rate us on Google
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <Star
                      size={28}
                      fill={star <= rating ? '#FFD700' : '#FFFFFF'}
                      color={star <= rating ? '#FFD700' : '#CCCCCC'}
                    />
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <textarea
                  style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px', border: '1.5px solid var(--color-border)', outline: 'none' }}
                  rows="2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Bill */}
        <BillView order={order} restaurantInfo={restaurantInfo} />

        {/* Save / Print */}
        <div className="thankyou__actions" style={{ marginTop: '20px' }}>
          <button
            className="btn btn--primary"
            onClick={handleDownloadPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', maxWidth: '360px', marginInline: 'auto' }}
          >
            🖨️ Save / Print Bill
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              className="btn btn--ghost"
              onClick={() => handleShareBill(order, restaurantInfo)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', maxWidth: '360px', marginInline: 'auto', marginTop: '10px' }}
            >
              📤 Share Bill
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
