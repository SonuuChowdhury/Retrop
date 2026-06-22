import { useNavigate, useParams } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import './CartDrawer.css';

/**
 * Sticky bottom bar shown on the Menu page.
 * Tapping it navigates to /order/:tableId/cart.
 */
export default function CartDrawer() {
  const { tableId } = useParams();
  const { cartCount, cartTotal } = useOrder();
  const navigate = useNavigate();

  if (cartCount === 0) return null;

  return (
    <div className="cart-drawer" role="complementary" aria-label="Cart summary">
      <button
        className="cart-drawer__btn"
        onClick={() => navigate(`/order/${tableId}/cart`)}
        aria-label={`View cart — ${cartCount} items, ${formatCurrency(cartTotal)}`}
      >
        <div className="cart-drawer__left">
          <span className="cart-drawer__badge">{cartCount}</span>
          <span className="cart-drawer__label">View Cart</span>
        </div>
        <div className="cart-drawer__right">
          <span className="cart-drawer__total">{formatCurrency(cartTotal)}</span>
          <span className="cart-drawer__arrow">→</span>
        </div>
      </button>
    </div>
  );
}
