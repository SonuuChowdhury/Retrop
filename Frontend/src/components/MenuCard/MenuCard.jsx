import { useState } from 'react';
import { useOrder } from '../../context/OrderContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import './MenuCard.css';

const SPICY_ICONS = { 0: '', 1: '🌶', 2: '🌶🌶', 3: '🌶🌶🌶' };

export default function MenuCard({ dish }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useOrder();
  const [imgError, setImgError] = useState(false);

  const cartItem = cart.find((i) => i.dishId === dish.dishId);
  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = () => addToCart(dish, 1);
  const handleIncrease = () => updateQuantity(dish.dishId, quantity + 1);
  const handleDecrease = () => {
    if (quantity === 1) removeFromCart(dish.dishId);
    else updateQuantity(dish.dishId, quantity - 1);
  };

  return (
    <article className="menu-card">
      {/* Image */}
      {dish.imageUrl && !imgError ? (
        <div className="menu-card__img-wrap">
          <img
            src={dish.imageUrl}
            alt={dish.dishName}
            className="menu-card__img"
            loading="lazy"
            onError={() => setImgError(true)}
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
