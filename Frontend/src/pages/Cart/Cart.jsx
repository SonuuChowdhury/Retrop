// ============================================================================
// Cart — /order/:tableId/cart
// ============================================================================
// Customer reviews their cart and places the order.
// POST /api/order/place → navigate to /order/:tableId/placed/:orderId
// ============================================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useOrder } from '../../context/OrderContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import './Cart.css';

export default function Cart() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const {
    cart, cartTotal, cartCount,
    updateQuantity, removeFromCart,
    sessionToken, restaurantInfo, clearSession,
  } = useOrder();

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // ---------- Place order ----------
  async function handlePlaceOrder() {
    if (cartCount === 0 || submitting) return;

    setSubmitting(true);
    setServerError(null);

    const items = cart.map((i) => ({
      dishId: i.dishId,
      quantity: i.quantity,
      remarks: i.remarks || undefined,
    }));

    try {
      const res = await api.placeOrder({ tableId, sessionToken, items });
      // Backend returns { data: { order, session } } — ordersId is inside order
      const orderId = res.data?.order?.ordersId ?? res.data?.ordersId;
      navigate(`/order/${tableId}/placed/${orderId}`, { replace: true });
    } catch (err) {
      // Session expired
      if (err.status === 410) {
        setServerError('Your session has expired. Please scan the QR code again to start a new order.');
        return;
      }
      // Waiter not accepted yet (edge case if waiter un-accepts)
      if (err.status === 400 && err.message?.includes('waiter')) {
        setServerError('A waiter has not accepted your table yet. Please wait a moment and try again.');
        return;
      }
      // Item unavailable
      if (err.status === 400) {
        setServerError(err.message || 'One or more items are unavailable. Please update your cart.');
        return;
      }
      setServerError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Empty cart ----------
  if (cartCount === 0) {
    return (
      <div className="app-shell">
        <StatusBar currentStep="menu" restaurantName={restaurantInfo?.restaurantName} />
        <main className="cart-empty g-container">
          <div className="cart-empty__icon" aria-hidden="true">🛒</div>
          <h2 className="cart-empty__title">Your cart is empty</h2>
          <p className="cart-empty__msg">Add some delicious items from the menu.</p>
          <button
            className="btn btn--ghost"
            onClick={() => navigate(-1)}
          >
            ← Back to Menu
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <StatusBar currentStep="menu" restaurantName={restaurantInfo?.restaurantName} />

      <main className="cart g-container">
        {/* Header */}
        <div className="cart__header">
          <button className="cart__back-btn" onClick={() => navigate(-1)} aria-label="Back to menu">
            ← Menu
          </button>
          <h1 className="cart__title">Your Order</h1>
        </div>

        {/* Items */}
        <div className="cart__items">
          {cart.map((item) => (
            <div key={item.dishId} className="cart-item">
              <div className="cart-item__info">
                <h3 className="cart-item__name">{item.dishName}</h3>
                <span className="cart-item__price">{formatCurrency(item.price)} each</span>
                {item.remarks && (
                  <span className="cart-item__remarks">Note: {item.remarks}</span>
                )}
              </div>

              <div className="cart-item__controls">
                <div className="cart-item__qty">
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="cart-item__qty-num">{item.quantity}</span>
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <span className="cart-item__subtotal">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <button
                  className="cart-item__remove"
                  onClick={() => removeFromCart(item.dishId)}
                  aria-label={`Remove ${item.dishName}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="cart__summary">
          <div className="cart__summary-row">
            <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <div className="cart__summary-row cart__summary-row--note">
            <span>Taxes & charges may apply</span>
          </div>
        </div>

        {/* Error */}
        {serverError && (
          <div className="cart__error" role="alert">{serverError}</div>
        )}

        {/* CTA */}
        <div className="cart__actions">
          <button
            className="btn btn--primary btn--full cart__place-btn"
            onClick={handlePlaceOrder}
            disabled={submitting}
          >
            {submitting ? 'Placing Order…' : `Place Order · ${formatCurrency(cartTotal)}`}
          </button>
          <p className="cart__disclaimer">
            By placing your order you confirm the items above. Payment will be collected by the waiter.
          </p>
        </div>
      </main>
    </div>
  );
}
