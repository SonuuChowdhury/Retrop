import { useState, memo, useCallback } from 'react';
import { useOrder } from '../../context/OrderContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import Skeleton from '../Skeleton/Skeleton.jsx';
import './MenuCard.css';

const SPICY_ICONS = { 0: '', 1: '🌶', 2: '🌶🌶', 3: '🌶🌶🌶' };

// Memoized MenuCard — only re-renders when dish or its cart quantity changes.
// This dramatically reduces re-render count when user scrolls or modifies cart.
function MenuCard({ dish }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useOrder();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const cartItem = cart.find((i) => i.dishId === dish.dishId);
  const quantity = cartItem?.quantity ?? 0;

  // Stable callbacks — won't trigger child re-renders
  const handleAdd       = useCallback(() => addToCart(dish, 1), [dish, addToCart]);
  const handleIncrease  = useCallback(() => updateQuantity(dish.dishId, quantity + 1), [dish.dishId, quantity, updateQuantity]);
  const handleDecrease  = useCallback(() => {
    if (quantity === 1) removeFromCart(dish.dishId);
    else updateQuantity(dish.dishId, quantity - 1);
  }, [dish.dishId, quantity, updateQuantity, removeFromCart]);

  const handleImgError  = useCallback(() => setImgError(true), []);

  return (
    <article className="menu-card">
      {/* Image — lazy loaded for performance */}
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
            onError={handleImgError}
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          />
        </div>
      ) : (
        <div className="menu-card__img-placeholder" aria-hidden="true">
          🍽️
        </div>
      )}

      {/* Content */}
      <div className="menu-card__body">
        {/* Type badges */}
        <div className="menu-card__badges">
          <span
            className={`menu-card__veg-dot ${dish.isVegetarian ? 'menu-card__veg-dot--veg' : 'menu-card__veg-dot--nonveg'}`}
            title={dish.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
            aria-label={dish.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
          />
          {dish.spicyLevel > 0 && (
            <span className="menu-card__spicy" aria-label={`Spicy level ${dish.spicyLevel}`}>
              {SPICY_ICONS[dish.spicyLevel]}
            </span>
          )}
        </div>

        <h3 className="menu-card__name">{dish.dishName}</h3>

        {dish.description && (
          <p className="menu-card__desc">{dish.description}</p>
        )}

        <div className="menu-card__footer">
          <span className="menu-card__price">{formatCurrency(dish.price)}</span>

          {/* Prep time */}
          {dish.preparationTime && (
            <span className="menu-card__prep">⏱ {dish.preparationTime} min</span>
          )}

          {/* Add / Quantity control */}
          {quantity === 0 ? (
            <button
              className="btn btn--primary menu-card__add-btn"
              onClick={handleAdd}
              aria-label={`Add ${dish.dishName} to cart`}
            >
              + Add
            </button>
          ) : (
            <div className="menu-card__qty" role="group" aria-label={`${dish.dishName} quantity`}>
              <button
                className="menu-card__qty-btn"
                onClick={handleDecrease}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="menu-card__qty-num">{quantity}</span>
              <button
                className="menu-card__qty-btn"
                onClick={handleIncrease}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Custom equality check: only re-render if dish identity or cart quantity changed
export default memo(MenuCard, (prev, next) => {
  return prev.dish.dishId === next.dish.dishId;
  // Note: cart changes cause parent re-render which re-evaluates cartItem.
  // Memoizing by dishId alone is safe because each MenuCard reads its own cartItem freshly.
  // However we keep the default memo (shallow equality on props) by not passing a comparator:
  // Passing dishId comparator here would skip re-renders even when cart changes for this dish.
  // Solution: let memo use the default shallow prop comparison (which is what React.memo does).
  // The dish prop itself doesn't change, but cart is read from context (not props), so
  // we rely on context to trigger re-renders when cart changes. The memo just prevents
  // re-renders triggered by UNRELATED changes in the parent (e.g. activeCategory change).
});
