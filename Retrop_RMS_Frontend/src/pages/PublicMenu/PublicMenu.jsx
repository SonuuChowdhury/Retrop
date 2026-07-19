// ============================================================================
// PublicMenu — View-Only Digital Menu (/menu)
// ============================================================================
// Public view of the restaurant menu for website visitors. Features search,
// dietary filters, category tabs, and world-class card layout for PC & Mobile.
// ============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { useMenu } from '../../hooks/useMenu.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen.jsx';
import Skeleton from '../../components/Skeleton/Skeleton.jsx';
import './PublicMenu.css';

function PublicMenuCard({ dish }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article className="public-dish-card">
      {/* Food Image Banner / Placeholder */}
      <div className="public-dish-card__image-wrap">
        {dish.imageUrl && !imgError ? (
          <>
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
              className="public-dish-card__img"
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ opacity: imgLoaded ? 1 : 0 }}
            />
          </>
        ) : (
          <div className="public-dish-card__placeholder">
            <span className="placeholder-emoji">🍽️</span>
            <span className="placeholder-bg-pattern"></span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="public-dish-card__badges">
          <span
            className={`public-veg-dot ${dish.isVegetarian ? 'public-veg-dot--veg' : 'public-veg-dot--nonveg'}`}
            title={dish.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
          />
        </div>
      </div>

      {/* Dish Body */}
      <div className="public-dish-card__body">
        <div className="public-dish-card__header">
          <h3 className="public-dish-card__name">{dish.dishName}</h3>
          {dish.preparationTime && (
            <span className="public-prep-pill">⏱️ {dish.preparationTime}m</span>
          )}
        </div>

        <p className="public-dish-card__desc">
          {dish.description || 'Finely prepared using fresh ingredients.'}
        </p>

        {/* Card Footer: Price */}
        <div className="public-dish-card__footer">
          <span className="public-dish-card__price">{formatCurrency(dish.price)}</span>
        </div>
      </div>
    </article>
  );
}

export default function PublicMenu() {
  const { menuByCategory, categories, loading: menuLoading, error: menuError } = useMenu();
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all');

  const categoryRefs = useRef({});

  useEffect(() => {
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

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Search & Filter Logic
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
        <LoadingSpinner message="Crafting menu presentation…" fullScreen />
      </div>
    );
  }

  return (
    <div className="app-shell public-menu-shell">
      {/* ── Luxury Header Banner ── */}
      <header className="public-menu-header">
        <div className="g-container header-inner">
          <div className="brand">
            <h1 className="restaurant-name">{restaurantInfo?.restaurantName || 'The Culinary Haven'}</h1>
            <p className="restaurant-tagline">Experience The Finest Culinary Creations</p>
          </div>

          <div className="qr-info-banner">
            <div className="qr-icon-wrap">
              <span className="qr-emoji">📱</span>
            </div>
            <div className="qr-text-wrap">
              <p className="qr-title">Ordering from a Table?</p>
              <p className="qr-desc">Scan the QR code at your dining table to place orders directly from your smartphone.</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search & Filter Controls ── */}
      <div className="public-search-filter">
        <div className="public-search-box">
          <span className="public-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="public-search-input"
            placeholder="Search menu by dish or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="public-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="public-dietary-pills">
          <button
            className={`public-dietary-pill ${dietaryFilter === 'all' ? 'public-dietary-pill--active' : ''}`}
            onClick={() => setDietaryFilter('all')}
          >
            All Items
          </button>
          <button
            className={`public-dietary-pill public-dietary-pill--veg ${dietaryFilter === 'veg' ? 'public-dietary-pill--active' : ''}`}
            onClick={() => setDietaryFilter('veg')}
          >
            <span className="veg-dot-icon"></span> Veg
          </button>
          <button
            className={`public-dietary-pill public-dietary-pill--nonveg ${dietaryFilter === 'nonveg' ? 'public-dietary-pill--active' : ''}`}
            onClick={() => setDietaryFilter('nonveg')}
          >
            <span className="nonveg-dot-icon"></span> Non-Veg
          </button>
        </div>
      </div>

      {/* ── Sticky Category Navigation ── */}
      <nav className="public-menu-tabs" aria-label="Menu categories">
        <div className="public-menu-tabs__scroll">
          {categories.map((cat) => {
            const count = (menuByCategory[cat] || []).length;
            const isAvailable = filteredCategories.includes(cat);
            return (
              <button
                key={cat}
                className={`public-menu-tab ${activeCategory === cat ? 'public-menu-tab--active' : ''} ${!isAvailable ? 'public-menu-tab--disabled' : ''}`}
                onClick={() => scrollToCategory(cat)}
              >
                {cat} <span className="public-menu-count">{count}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main Menu Content ── */}
      <main className="public-menu-content g-container">
        {filteredCategories.map((cat) => (
          <section
            key={cat}
            className="public-menu-category"
            ref={(el) => { if (el) categoryRefs.current[cat] = el; }}
          >
            <div className="public-category-header">
              <h2 className="public-category-title">{cat}</h2>
              <span className="public-category-count">{filteredMenuByCategory[cat].length} items</span>
            </div>

            <div className="public-dishes-grid">
              {filteredMenuByCategory[cat].map((dish) => (
                <PublicMenuCard key={dish.dishId} dish={dish} />
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
          <div className="public-menu-empty">
            <div className="empty-icon">🍽️</div>
            <h3>No menu items found</h3>
            <p>Try adjusting your search query or clearing active dietary filters.</p>
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

      {/* ── Footer ── */}
      <footer className="public-menu-footer">
        <p>© {new Date().getFullYear()} {restaurantInfo?.restaurantName || 'Restaurant'}. Digital Menu Experience.</p>
      </footer>
    </div>
  );
}
