// ============================================================================
// Menu — /order/:tableId/menu
// ============================================================================
// Customer browses and selects dishes with real-time search, dietary filters,
// sticky category navigation, and world-class responsive layout for PC & Mobile.
// ============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu.js';
import { useSessionPolling } from '../../hooks/useSessionPolling.js';
import { useOrder } from '../../context/OrderContext.jsx';
import { api } from '../../services/api.js';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import MenuCard from '../../components/MenuCard/MenuCard.jsx';
import CartDrawer from '../../components/CartDrawer/CartDrawer.jsx';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'nonveg' | 'spicy'

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
  }, [isEditing, tableId, setCart]);

  // Set default active category
  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

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
  }, [session, isEditing]);

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Filter dishes by search query and dietary preferences
  const filteredMenuByCategory = useMemo(() => {
    if (!menuByCategory) return {};

    const query = searchQuery.toLowerCase().trim();
    const result = {};

    categories.forEach((cat) => {
      const dishes = menuByCategory[cat] || [];
      const matching = dishes.filter((dish) => {
        const matchesSearch =
          !query ||
          dish.dishName.toLowerCase().includes(query) ||
          (dish.description && dish.description.toLowerCase().includes(query));

        const matchesDietary =
          dietaryFilter === 'all'
            ? true
            : dietaryFilter === 'veg'
            ? dish.isVegetarian === true
            : dietaryFilter === 'nonveg'
            ? dish.isVegetarian === false
            : dietaryFilter === 'spicy'
            ? dish.spicyLevel > 0
            : true;

        return matchesSearch && matchesDietary;
      });

      if (matching.length > 0) {
        result[cat] = matching;
      }
    });

    return result;
  }, [menuByCategory, categories, searchQuery, dietaryFilter]);

  const filteredCategories = Object.keys(filteredMenuByCategory);
  const totalDishesCount = useMemo(() => {
    return Object.values(filteredMenuByCategory).reduce((acc, list) => acc + list.length, 0);
  }, [filteredMenuByCategory]);

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
      <div className="app-shell menu-app-shell">
        <StatusBar currentStep="menu" restaurantName={restaurantInfo?.restaurantName} />
        <div className="menu-tabs" style={{ borderBottom: 'none' }}>
          <div className="menu-tabs__scroll" style={{ overflow: 'hidden' }}>
            <Skeleton type="line" width={90} height={38} className="menu-tabs__tab" count={4} />
          </div>
        </div>
        <main className="menu-content g-container">
          <div className="menu-grid">
            {[1, 2, 3, 4, 5, 6].map((key) => (
              <div className="skeleton-card-wrapper" style={{ padding: '16px', borderRadius: '16px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', display: 'flex', gap: '16px' }} key={key}>
                <Skeleton type="circle" width={90} height={90} style={{ borderRadius: '12px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton type="line" width="65%" height={20} />
                  <Skeleton type="line" width="90%" height={14} />
                  <Skeleton type="line" width="40%" height={16} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell menu-app-shell">
      <StatusBar currentStep="menu" restaurantName={restaurantInfo?.restaurantName} />

      {/* ── Search & Filter Controls Header ── */}
      <div className="menu-search-filter">
        <div className="menu-search-box">
          <span className="menu-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="menu-search-input"
            placeholder="Search dishes or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="menu-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dietary preference chips */}
        <div className="menu-dietary-pills" role="radiogroup" aria-label="Dietary preference filter">
          <button
            className={`menu-dietary-pill ${dietaryFilter === 'all' ? 'menu-dietary-pill--active' : ''}`}
            onClick={() => setDietaryFilter('all')}
          >
            All
          </button>
          <button
            className={`menu-dietary-pill menu-dietary-pill--veg ${dietaryFilter === 'veg' ? 'menu-dietary-pill--active' : ''}`}
            onClick={() => setDietaryFilter('veg')}
          >
            <span className="veg-icon-dot"></span> Veg
          </button>
          <button
            className={`menu-dietary-pill menu-dietary-pill--nonveg ${dietaryFilter === 'nonveg' ? 'menu-dietary-pill--active' : ''}`}
            onClick={() => setDietaryFilter('nonveg')}
          >
            <span className="nonveg-icon-dot"></span> Non-Veg
          </button>
        </div>
      </div>

      {/* ── Sticky Category Tab Bar ── */}
      <nav className="menu-tabs" aria-label="Menu categories">
        <div className="menu-tabs__scroll">
          {categories.map((cat) => {
            const count = (menuByCategory[cat] || []).length;
            const isAvailable = filteredCategories.includes(cat);
            return (
              <button
                key={cat}
                className={`menu-tabs__tab ${activeCategory === cat ? 'menu-tabs__tab--active' : ''} ${!isAvailable ? 'menu-tabs__tab--disabled' : ''}`}
                onClick={() => scrollToCategory(cat)}
              >
                {cat} <span className="menu-tabs__count">{count}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main Menu Dish Items Sections ── */}
      <main className="menu-content g-container" style={{ paddingBottom: cartCount > 0 ? '120px' : 'var(--space-8)' }}>
        
        {filteredCategories.map((cat) => (
          <section
            key={cat}
            className="menu-category"
            ref={(el) => { if (el) categoryRefs.current[cat] = el; }}
          >
            <div className="menu-category__header">
              <h2 className="menu-category__title">{cat}</h2>
              <span className="menu-category__badge">{filteredMenuByCategory[cat].length} items</span>
            </div>

            <div className="menu-grid">
              {filteredMenuByCategory[cat].map((dish) => (
                <MenuCard key={dish.dishId} dish={dish} />
              ))}
            </div>
          </section>
        ))}

        {/* Empty Search / Filter State */}
        {filteredCategories.length === 0 && (
          <div className="menu-empty">
            <div className="menu-empty__icon">🍽️</div>
            <h3>No dishes found</h3>
            <p>No items matched your search query or selected dietary filter.</p>
            <button
              className="btn btn--primary"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSearchQuery('');
                setDietaryFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
