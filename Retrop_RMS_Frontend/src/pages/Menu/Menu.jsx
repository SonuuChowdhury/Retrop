// ============================================================================
// Menu — /order/:tableId/menu
// ============================================================================
// Customer browses and selects dishes. Also polls session every 10 s to
// detect session expiry or if order was already placed on another device.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu.js';
import { useSessionPolling } from '../../hooks/useSessionPolling.js';
import { useOrder } from '../../context/OrderContext.jsx';
import { api } from '../../services/api.js';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import MenuCard from '../../components/MenuCard/MenuCard.jsx';
import CartDrawer from '../../components/CartDrawer/CartDrawer.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import './Menu.css';

export default function Menu() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';

  const { restaurantInfo, clearSession, cart, cartCount, setCart, setSession } = useOrder();
  const { menuByCategory, categories, loading: menuLoading, error: menuError } = useMenu();

  // Session polling — 10 s interval on menu page, disabled if editing an active order
  const { session, error: sessionError } = useSessionPolling(tableId, 10_000, !isEditing);

  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});

  // Pre-populate cart if editing an existing order
  useEffect(() => {
    if (isEditing && cart.length === 0) {
      const token = localStorage.getItem(`rms_token_${tableId}`);
      if (token) {
        api.getOrderStatus(tableId, token)
          .then((res) => {
            if (res.status === 'success' && res.data?.order) {
              const orderItems = res.data.order.ordersInfo || [];
              const cartItems = orderItems.map(item => ({
                dishId: item.dishId,
                dishName: item.dishName,
                price: item.price,
                quantity: item.quantity,
                remarks: item.remarks || ''
              }));
              setCart(cartItems);
            }
          })
          .catch((err) => {
            console.error('Failed to pre-populate cart for editing:', err);
          });
      }
    }
  }, [isEditing, tableId, setCart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set default active category
  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session state changes
  useEffect(() => {
    if (!session) return;
    setSession(session);
    if (!isEditing && session.status === 'ordered' && session.orderId) {
      navigate(`/order/${tableId}/tracking/${session.orderId}`, { replace: true });
    }
    if (session.status === 'waiting_customer_info') {
      navigate(`/order/${tableId}/info`, { replace: true });
    }
    if (session.status === 'waiting_waiter') {
      navigate(`/order/${tableId}/waiting`, { replace: true });
    }
  }, [session, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------- Error states ----------
  if (sessionError?.status === 404) {
    return (
      <ErrorScreen
        title="Session Expired"
        message="Your session has expired. Please scan the QR code again."
        emoji="⏱️"
        actionLabel="OK"
        onAction={clearSession}
      />
    );
  }

  if (sessionError?.status === 403) {
    return (
      <ErrorScreen
        title="Restaurant Closed"
        message="The restaurant is currently closed. Please try again later."
        emoji="🔒"
        actionLabel="OK"
        onAction={clearSession}
      />
    );
  }

  if (menuError) {
    return (
      <ErrorScreen
        title="Menu Unavailable"
        message={menuError.message || 'Could not load the menu. Please check your connection.'}
        emoji="🍽️"
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (menuLoading) {
    return (
      <div className="app-shell">
        <StatusBar currentStep="menu" restaurantName={restaurantInfo?.restaurantName} />
        <div className="menu-tabs" style={{ borderBottom: 'none' }}>
          <div className="menu-tabs__scroll" style={{ overflow: 'hidden' }}>
            <Skeleton type="line" width={80} height={36} className="menu-tabs__tab" count={4} />
          </div>
        </div>
        <main className="menu-content g-container">
          <Skeleton type="title" />
          <div className="menu-category__items">
            {[1, 2, 3].map((key) => (
              <div className="skeleton-card-wrapper" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }} key={key}>
                <Skeleton type="circle" width={72} height={72} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton type="line" width="60%" height={18} />
                  <Skeleton type="line" width="90%" height={12} />
                  <Skeleton type="line" width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <StatusBar currentStep="menu" restaurantName={restaurantInfo?.restaurantName} />

      {/* Category tab bar */}
      <nav className="menu-tabs" aria-label="Menu categories">
        <div className="menu-tabs__scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`menu-tabs__tab ${activeCategory === cat ? 'menu-tabs__tab--active' : ''}`}
              onClick={() => scrollToCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Menu sections */}
      <main className="menu-content g-container" style={{ paddingBottom: cartCount > 0 ? '100px' : 'var(--space-8)' }}>
        {categories.map((cat) => (
          <section
            key={cat}
            className="menu-category"
            ref={(el) => { if (el) categoryRefs.current[cat] = el; }}
          >
            <h2 className="menu-category__title">{cat}</h2>
            <div className="menu-category__items">
              {menuByCategory[cat].map((dish) => (
                <MenuCard key={dish.dishId} dish={dish} />
              ))}
            </div>
          </section>
        ))}

        {categories.length === 0 && (
          <div className="menu-empty">
            <p>The menu is currently empty. Please ask our staff.</p>
          </div>
        )}
      </main>

      {/* Floating cart bar */}
      <CartDrawer />
    </div>
  );
}
