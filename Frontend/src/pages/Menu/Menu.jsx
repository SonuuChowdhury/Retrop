// ============================================================================
// Menu — /order/:tableId/menu
// ============================================================================
// Customer browses and selects dishes. Also polls session every 10 s to
// detect session expiry or if order was already placed on another device.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu.js';
import { useSessionPolling } from '../../hooks/useSessionPolling.js';
import { useOrder } from '../../context/OrderContext.jsx';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import MenuCard from '../../components/MenuCard/MenuCard.jsx';
import CartDrawer from '../../components/CartDrawer/CartDrawer.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import './Menu.css';

export default function Menu() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { restaurantInfo, clearSession, cartCount } = useOrder();
  const { menuByCategory, categories, loading: menuLoading, error: menuError } = useMenu();

  // Session polling — 10 s interval on menu page
  const { session, error: sessionError } = useSessionPolling(tableId, 10_000, true);

  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});

  // Set default active category
  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session state changes
  useEffect(() => {
    if (!session) return;
    if (session.status === 'ordered' && session.orderId) {
      navigate(`/order/${tableId}/placed/${session.orderId}`, { replace: true });
    }
    if (session.status === 'waiting_customer_info') {
      navigate(`/order/${tableId}/info`, { replace: true });
    }
    if (session.status === 'waiting_waiter') {
      navigate(`/order/${tableId}/waiting`, { replace: true });
    }
  }, [session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <LoadingSpinner message="Loading menu…" fullScreen />
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
