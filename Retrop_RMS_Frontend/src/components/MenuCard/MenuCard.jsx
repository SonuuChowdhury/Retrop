import { useState, memo, useCallback } from 'react';
import { useOrder } from '../../context/OrderContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import Skeleton from '../Skeleton/Skeleton.jsx';
import './MenuCard.css';

function MenuCard({ dish }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useOrder();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const cartItem = cart.find((i) => i.dishId === dish.dishId);
  const quantity = cartItem?.quantity ?? 0;

  // Callbacks
  const handleAdd      = useCallback(() => addToCart(dish, 1), [dish, addToCart]);
  const handleIncrease = useCallback(() => updateQuantity(dish.dishId, quantity + 1), [dish.dishId, quantity, updateQuantity]);
  const handleDecrease = useCallback(() => {
    if (quantity === 1) removeFromCart(dish.dishId);
    else updateQuantity(dish.dishId, quantity - 1);
  }, [dish.dishId, quantity, updateQuantity, removeFromCart]);

  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <article className={`menu-card ${quantity > 0 ? 'menu-card--selected' : ''}`}>
      {/* Dish Image Banner / Thumbnail */}
      <div className="menu-card__image-container">
        {dish.imageUrl && !imgError ? (
          <div className="menu-card__img-wrap">
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
              style={{ opacity: imgLoaded ? 1 : 0 }}
            />
          </div>
        ) : (
          <div className="menu-card__img-placeholder" aria-hidden="true">
            🍽️
          </div>
        )}

        {/* Floating Badges */}
        <div className="menu-card__floating-badges">
          <span
            className={`menu-card__veg-dot ${dish.isVegetarian ? 'menu-card__veg-dot--veg' : 'menu-card__veg-dot--nonveg'}`}
            title={dish.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
            aria-label={dish.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
          />
        </div>
      </div>

      {/* Dish Body Content */}
      <div className="menu-card__body">
        <div className="menu-card__header">
          <h3 className="menu-card__name">{dish.dishName}</h3>
          {dish.preparationTime && (
            <span className="menu-card__prep-pill">⏱️ {dish.preparationTime}m</span>
          )}
        </div>

        {dish.description && (
          <p className="menu-card__desc" title={dish.description}>
            {dish.description}
          </p>
        )}

        {/* Card Footer: Price & Add Control */}
        <div className="menu-card__footer">
          <div className="menu-card__price-tag">
            {formatCurrency(dish.price)}
          </div>

          {/* Add / Stepper control */}
          {quantity === 0 ? (
            <button
              className="menu-card__add-btn"
              onClick={handleAdd}
              aria-label={`Add ${dish.dishName} to cart`}
            >
              + ADD
            </button>
          ) : (
            <div className="menu-card__stepper" role="group" aria-label={`${dish.dishName} quantity`}>
              <button
                className="menu-card__stepper-btn"
                onClick={handleDecrease}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="menu-card__stepper-num">{quantity}</span>
              <button
                className="menu-card__stepper-btn"
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

export default memo(MenuCard);
