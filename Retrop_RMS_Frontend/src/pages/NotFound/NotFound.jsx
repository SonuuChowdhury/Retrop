// ============================================================================
// NotFound — catch-all route
// ============================================================================

import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <div className="not-found__emoji">🍽️</div>
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page Not Found</h2>
        <p className="not-found__msg">
          This page doesn't exist. Please scan the QR code at your table to start your order.
        </p>
      </div>
    </div>
  );
}
