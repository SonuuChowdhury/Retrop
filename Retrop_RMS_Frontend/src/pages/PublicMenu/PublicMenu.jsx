import { useState, useEffect, useRef } from 'react';
import { useMenu } from '../../hooks/useMenu.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import './PublicMenu.css';

const SPICY_ICONS = { 0: '', 1: '🌶', 2: '🌶🌶', 3: '🌶🌶🌶' };

function PublicMenuCard({ dish }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article className="menu-card public-menu-card">
      {/* Dish Image */}
      {dish.imageUrl && !imgError ? (
        <div className="menu-card__img-wrap" style={{ position: 'relative' }}>
          {!imgLoaded && (
            <Skeleton
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0, borderRadius: 'var(--radius-md)' }}
            />
          )}
          <img
            src={dish.imageUrl}
            alt={dish.dishName}
            className="menu-card__img"
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          />
        </div>
      ) : (
        <div className="menu-card__img-placeholder">
          <span>🍽️</span>
        </div>
      )}

      {/* Dish Details */}
      <div className="menu-card__info">
        <div className="menu-card__header">
          <div className="menu-card__title-row">
            <h3 className="menu-card__name">{dish.dishName}</h3>
            {dish.isVegetarian !== null && (
              <span className={`dish-badge ${dish.isVegetarian ? 'veg' : 'non-veg'}`}>
                {dish.isVegetarian ? '●' : '▲'}
              </span>
            )}
          </div>
          <span className="menu-card__price">{formatCurrency(dish.price)}</span>
        </div>

        <p className="menu-card__desc">{dish.description || 'No description available.'}</p>

        <div className="menu-card__footer">
          <div className="menu-card__meta">
            {dish.preparationTime && (
              <span className="menu-card__prep">⏱️ {dish.preparationTime} mins</span>
            )}
            {dish.spicyLevel > 0 && (
              <span className="menu-card__spicy" title={`Spicy Level: ${dish.spicyLevel}`}>
                {SPICY_ICONS[dish.spicyLevel]}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PublicMenu() {
  const { menuByCategory, categories, loading: menuLoading, error: menuError } = useMenu();
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});

  useEffect(() => {
    // Fetch public restaurant info for title & details
    api.getRestaurantInfo()
      .then((res) => {
        if (res.status === 'success') {
          setRestaurantInfo(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load restaurant info', err);
      });
  }, []);

  // Set default active category
  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      <div className="public-menu-shell">
        <LoadingSpinner message="Loading menu…" fullScreen />
      </div>
    );
  }

  return (
    <div className="app-shell public-menu-shell">
      {/* Premium Header */}
      <header className="public-menu-header">
        <div className="g-container header-inner">
          <div className="brand">
            <h1 className="restaurant-name">{restaurantInfo?.restaurantName || 'Our Restaurant'}</h1>
            <p className="restaurant-tagline">Experience the finest culinary creations</p>
          </div>
          <div className="qr-info-banner">
            <div className="qr-icon-wrap">
              <span className="qr-emoji">📱</span>
            </div>
            <div className="qr-text-wrap">
              <p className="qr-title">Ordering from a Table?</p>
              <p className="qr-desc">Scan the QR code at your table to start ordering immediately.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="menu-tabs public-menu-tabs" aria-label="Menu categories">
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

      {/* Menu Content */}
      <main className="menu-content public-menu-content g-container">
        {categories.map((cat) => (
          <section
            key={cat}
            className="menu-category"
            ref={(el) => { if (el) categoryRefs.current[cat] = el; }}
          >
            <h2 className="menu-category__title">{cat}</h2>
            <div className="menu-category__items">
              {menuByCategory[cat].map((dish) => (
                <PublicMenuCard key={dish.dishId} dish={dish} />
              ))}
            </div>
          </section>
        ))}

        {categories.length === 0 && (
          <div className="menu-empty">
            <p>Our digital menu is temporarily empty. Please contact our staff.</p>
          </div>
        )}
      </main>

      {/* Elegant sticky footer for public menu */}
      <footer className="public-menu-footer">
        <p>© {new Date().getFullYear()} {restaurantInfo?.restaurantName || 'Restaurant'}. View-only menu.</p>
      </footer>
    </div>
  );
}
