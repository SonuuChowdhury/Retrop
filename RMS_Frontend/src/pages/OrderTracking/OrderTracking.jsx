import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../../services/api.js';
import { useOrder } from '../../context/OrderContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import './OrderTracking.css';

const STEPS = [
  { status: 'ordering', label: 'Order Received', emoji: '📋', desc: 'Sent to the kitchen' },
  { status: 'preparing', label: 'Preparing', emoji: '👨‍🍳', desc: 'Chef is cooking' },
  { status: 'ready', label: 'Ready to Serve', emoji: '🛎️', desc: 'Food is ready' },
  { status: 'serving', label: 'Served', emoji: '🍽️', desc: 'Enjoy your meal' },
];

export default function OrderTracking() {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const { restaurantInfo, clearSession, setSession, session } = useOrder();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modifying, setModifying] = useState(false);

  const socketRef = useRef(null);

  // ── Robust token resolution ─────────────────────────────────────────────
  // Try localStorage first. If missing (race condition right after navigation),
  // fall back to the in-memory session context. Write to localStorage if found
  // via context so all subsequent reads work correctly.
  const getToken = () => {
    const lsToken = localStorage.getItem(`rms_token_${tableId}`);
    if (lsToken) return lsToken;
    const ctxToken = session?.customerToken;
    if (ctxToken) {
      localStorage.setItem(`rms_token_${tableId}`, ctxToken);
      return ctxToken;
    }
    return null;
  };

  // Fetch initial order status
  const fetchOrder = async () => {
    const token = getToken();
    if (!token) {
      setError({
        title: 'Session Expired',
        message: 'No active order session found. Please scan the QR code to start a new order.',
        emoji: '⏱️',
      });
      setLoading(false);
      return;
    }
    try {
      const res = await api.getOrderStatus(tableId, token);
      if (res.status === 'success' && res.data?.order) {
        const orderData = res.data.order;
        if (orderData.orderStatus === 'cancelled') {
          setError({
            title: 'Order Cancelled',
            message: 'This order has been cancelled by the staff. If not intended, please contact the staff around you.',
            emoji: '🚫',
            retryable: false,
          });
          clearSession();
          setLoading(false);
          return;
        }
        setOrder(orderData);
        // Sync context so future operations have the token and orderId
        setSession((prev) => ({
          ...prev,
          status: 'ordered',
          orderId: orderData.ordersId,
          tableId,
          tableNo: orderData.tableNo,
          customerToken: token,
        }));
      } else {
        throw new Error('Failed to load order');
      }
    } catch (err) {
      if (err.status === 403) {
        setError({
          title: 'Session Expired',
          message: 'Your tracking session has expired. Please scan the QR code again.',
          emoji: '⏱️',
        });
      } else {
        setError({
          title: 'Error loading order',
          message: err.message || 'Could not load your order details.',
          emoji: '❌',
          retryable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [tableId, orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect to WebSocket for real-time status & bill redirect
  useEffect(() => {
    const token = getToken();
    if (!token || !orderId) return;

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      auth: { token, role: 'customer' },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Customer connected successfully');
    });

    socket.on('order:status_change', (data) => {
      if (data.orderId === orderId) {
        if (data.orderStatus === 'cancelled') {
          setError({
            title: 'Order Cancelled',
            message: 'This order has been cancelled by the staff. If not intended, please contact the staff around you.',
            emoji: '🚫',
            retryable: false,
          });
          clearSession();
        } else {
          setOrder((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              orderStatus: data.orderStatus,
              ...(data.ordersInfo && { ordersInfo: data.ordersInfo }),
              ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
            };
          });
        }
      }
    });

    socket.on('customer:bill_ready', (data) => {
      if (data.orderId === orderId) {
        navigate(`/bill/${orderId}`, { replace: true });
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, tableId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll fallback in case sockets fail — every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      if (order && !['completed', 'cancelled'].includes(order.orderStatus)) {
        fetchOrderStatusBackground();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrderStatusBackground = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.getOrderStatus(tableId, token);
      if (res.status === 'success' && res.data?.order) {
        const orderData = res.data.order;
        if (orderData.isPaymentCompleted || orderData.orderStatus === 'completed') {
          navigate(`/bill/${orderId}`, { replace: true });
          return;
        }
        if (orderData.orderStatus === 'cancelled') {
          setError({
            title: 'Order Cancelled',
            message: 'This order has been cancelled by the staff. If not intended, please contact the staff around you.',
            emoji: '🚫',
            retryable: false,
          });
          clearSession();
          return;
        }
        setOrder(orderData);
        setSession((prev) => ({
          ...prev,
          status: 'ordered',
          orderId: orderData.ordersId,
          tableId,
          tableNo: orderData.tableNo,
          customerToken: token,
        }));
      }
    } catch (_) {}
  };

  // Handle Modify Quantity (Add/Remove items before prep starts)
  const handleModifyQuantity = async (dishId, currentQty, targetQty) => {
    const token = getToken();
    if (modifying || !order || order.orderStatus !== 'ordering' || !token) return;

    setModifying(true);
    const action = targetQty > currentQty ? 'add' : 'remove';
    const diff = Math.abs(targetQty - currentQty);

    try {
      const res = await api.customerModifyOrder(orderId, token, action, [{ dishId, quantity: diff }]);
      if (res.status === 'success' && res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to modify order item.');
    } finally {
      setModifying(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <StatusBar currentStep="order" restaurantName={restaurantInfo?.restaurantName} />
        <main className="order-tracking g-container">
          <div className="tracking-timeline-box" style={{ gap: '20px' }}>
            <div className="order-header-row">
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '8px' }}><Skeleton type="line" width="30%" height={12} /></div>
                <Skeleton type="line" width="50%" height={24} />
              </div>
              <Skeleton type="line" width={60} height={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '16px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Skeleton type="circle" width={36} height={36} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
                  <Skeleton type="line" width="40%" height={16} />
                  <Skeleton type="line" width="60%" height={12} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Skeleton type="circle" width={36} height={36} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
                  <Skeleton type="line" width="30%" height={16} />
                  <Skeleton type="line" width="50%" height={12} />
                </div>
              </div>
            </div>
          </div>
          <div className="tracking-items-box">
            <div style={{ marginBottom: '16px' }}><Skeleton type="line" width="30%" height={16} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton type="line" width="50%" height={16} />
                <Skeleton type="line" width="15%" height={16} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton type="line" width="40%" height={16} />
                <Skeleton type="line" width="15%" height={16} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        title={error.title}
        message={error.message}
        emoji={error.emoji}
        actionLabel={error.retryable ? 'Try Again' : 'OK'}
        onAction={error.retryable ? fetchOrder : clearSession}
      />
    );
  }

  const currentStatus = order?.orderStatus || 'ordering';
  const isCancellable = currentStatus === 'ordering';

  const activeStepIdx = STEPS.findIndex(s => s.status === currentStatus);
  const activeIdx = activeStepIdx === -1 ? 0 : activeStepIdx;

  return (
    <div className="app-shell">
      <StatusBar currentStep="order" restaurantName={restaurantInfo?.restaurantName} />

      <main className="order-tracking g-container">
        {/* Status timeline */}
        <div className="tracking-timeline-box">
          <div className="order-header-row">
            <div>
              <span className="order-no-label">Order Reference</span>
              <h1 className="order-no-val">#{order?.dailyOrderNo || '---'}</h1>
              {order?.invoiceNo && (
                <span className="order-invoice-badge">{order.invoiceNo}</span>
              )}
            </div>
            <span className="tracking-live-dot">Live</span>
          </div>

          <div className="timeline-steps">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < activeIdx;
              const isActive = idx === activeIdx;
              return (
                <div
                  key={step.status}
                  className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="step-bullet">
                    <span className="step-emoji">{step.emoji}</span>
                  </div>
                  <div className="step-details">
                    <h3 className="step-title">{step.label}</h3>
                    <p className="step-desc">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details List */}
        <div className="tracking-items-box">
          <h2 className="items-box-title">Order Items</h2>
          <div className="tracking-items-list">
            {(order?.ordersInfo || []).map((item) => {
              // ISSUE 3: Check if this item is locked (already served — cannot be removed)
              const isLocked = (order.lockedItems || []).some(li => li.dishId === item.dishId);
              return (
                <div key={item.dishId} className="tracking-item-row">
                  <div className="tracking-item-name-col">
                    <span className="tracking-item-name">{item.dishName}</span>
                    <span className="tracking-item-price">{formatCurrency(item.price)} each</span>
                  </div>

                  {isLocked ? (
                    // Locked item — show qty + lock badge, no controls
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="tracking-qty-badge">× {item.quantity}</span>
                      <span title="Already served — cannot be removed" style={{
                        fontSize: '14px', cursor: 'default', opacity: 0.7,
                      }}>🔒</span>
                    </div>
                  ) : isCancellable ? (
                    <div className="tracking-qty-controls">
                      <button
                        className="qty-ctrl-btn"
                        disabled={modifying}
                        onClick={() => handleModifyQuantity(item.dishId, item.quantity, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-ctrl-num">{item.quantity}</span>
                      <button
                        className="qty-ctrl-btn"
                        disabled={modifying}
                        onClick={() => handleModifyQuantity(item.dishId, item.quantity, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="tracking-qty-badge">× {item.quantity}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="tracking-totals">
            <div className="tracking-totals-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order?.totalAmount || 0)}</span>
            </div>

            {(order?.discountBreakdown || []).map((disc, i) => (
              <div key={i} className="tracking-totals-row discount">
                <span>🏷️ {disc.name} ({disc.percent}% off)</span>
                <span>-{formatCurrency(disc.amount)}</span>
              </div>
            ))}

            {(order?.taxBreakdown || []).map((tax, i) => (
              <div key={i} className="tracking-totals-row">
                <span>{tax.name} ({tax.percent}%{tax.inclusive ? ' Incl.' : ' Excl.'})</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}

            <div className="tracking-totals-row grand">
              <span>Total Amount</span>
              <span className="total-val">{formatCurrency(order?.finalAmount ?? order?.totalAmount ?? 0)}</span>
            </div>
          </div>

          {isCancellable && (
            <p className="tracking-modify-notice">
              💡 You can adjust item quantities directly above. Once preparation starts, items cannot be changed.
            </p>
          )}
        </div>

        {/* Info Box */}
        <div className="tracking-waiter-box">
          <div className="waiter-avatar">🪑</div>
          <div className="waiter-details">
            <p className="waiter-name-lbl">Table Number</p>
            <p className="waiter-name-val">Table {order?.tableNo}</p>
          </div>
          {order?.waiter?.waiterName && (
            <>
              <div className="waiter-divider" />
              <div className="waiter-details">
                <p className="waiter-name-lbl">Assigned Waiter</p>
                <p className="waiter-name-val">{order.waiter.waiterName}</p>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="tracking-actions">
          {order && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
            <button
              className="btn btn--ghost btn--full"
              onClick={() => navigate(`/order/${tableId}/menu?edit=true`)}
            >
              Add/Edit Items
            </button>
          )}
          {order?.isPaymentCompleted && (
            <button
              className="btn btn--primary btn--full"
              onClick={() => navigate(`/bill/${orderId}`)}
            >
              📄 View Bill & Receipt
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
