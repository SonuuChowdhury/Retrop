// ============================================================================
// API SERVICE
// ============================================================================
// All backend communication goes through here.
// Change VITE_API_URL in .env to point to your backend.
// ============================================================================

const BASE = import.meta.env.VITE_API_URL || '';

// --------------------------------------------------------------------------
// Core request handler — centralised error parsing
// --------------------------------------------------------------------------
async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15 s timeout

  try {
    const res = await fetch(`${BASE}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',  // bypass ngrok HTML interstitial
        'X-Product-Key': import.meta.env.VITE_PRODUCT_KEY || '',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    const json = await res.json();

    if (!res.ok) {
      if (json?.code === 'key_inactive' || json?.code === 'key_invalid') {
        window.dispatchEvent(new CustomEvent('retrop-key-error', { detail: json }));
      }
      // Propagate backend error message + HTTP status code
      const err = new Error(json?.message || 'Request failed');
      err.status = res.status;
      err.data = json;
      throw err;
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please check your connection.');
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    // Network failure (no response)
    if (!err.status) {
      const netErr = new Error('Network error. Please check your connection.');
      netErr.status = 0;
      throw netErr;
    }
    throw err;
  }
}

const get = (url) => request(url, { method: 'GET' });
const post = (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) });

// --------------------------------------------------------------------------
// Customer Order API
// --------------------------------------------------------------------------
export const api = {
  /**
   * Step 1 — QR Scan: create or resume a 20-min order session.
   * POST /api/order/session
   * Body: { tableId }
   * Returns: { status, data: SessionData, existing: boolean }
   *
   * SessionData shape:
   *   sessionToken, tableId, tableNo, status, customerName, customerMobile,
   *   waiterId (boolean in response), waiterName, orderId, dailyOrderNo,
   *   createdAt, expiresAt
   *
   * Session status states:
   *   waiting_customer_info → waiting_waiter → accepted → ordering → ordered
   *
   * Error codes:
   *   403 — restaurant closed
   *   404 — invalid tableId
   */
  createOrderSession: (tableId) =>
    post('/api/order/session', { tableId }),

  /**
   * Step 2 — Customer submits name + mobile.
   * POST /api/order/session/customer-info
   * Body: { tableId, sessionToken, customerName, customerMobile }
   *
   * Error codes:
   *   410 — session expired
   *   403 — invalid token
   *   400 — invalid mobile
   */
  submitCustomerInfo: ({ tableId, sessionToken, customerName, customerMobile }) =>
    post('/api/order/session/customer-info', { tableId, sessionToken, customerName, customerMobile }),

  /**
   * Polling — check session state.
   * GET /api/order/session/:tableId/status
   *
   * Returns the same SessionData shape as createOrderSession.
   * Poll every 3 s on WaitingWaiter, 10 s on Menu, 15 s on OrderPlaced.
   *
   * Error codes:
   *   404 — session expired / not found
   */
  getSessionStatus: (tableId) =>
    get(`/api/order/session/${tableId}/status`),

  /**
   * Menu — get available items (cached 5 min on backend).
   * GET /api/order/menu
   *
   * Returns: [{ dishId, dishName, price, category, description,
   *             imageUrl, preparationTime, spicyLevel, isVegetarian, isAvailable }]
   */
  getMenu: () =>
    get('/api/order/menu'),

  /**
   * Step 3 — Place the order.
   * POST /api/order/place
   * Body: { tableId, sessionToken, items: [{ dishId, quantity, remarks? }] }
   *
   * Error codes:
   *   410 — session expired
   *   403 — invalid token
   *   400 — waiter not accepted / item unavailable
   */
  placeOrder: ({ tableId, sessionToken, items }) =>
    post('/api/order/place', { tableId, sessionToken, items }),

  /**
   * Bill — fetch final bill after payment is completed.
   * GET /api/order/:orderId/bill
   *
   * Returns: { order, restaurantInfo }
   * Error codes:
   *   404 — order not found
   *   400 — payment not yet completed
   */
  getOrderBill: (orderId) =>
    get(`/api/order/${orderId}/bill`),

  /**
   * Public restaurant info — for branding on order pages.
   * GET /api/public/restaurant-info
   */
  getRestaurantInfo: () =>
    get('/api/public/restaurant-info'),

  /**
   * Get active order status for tracking page (customer-side)
   * GET /api/order/:tableId/order-status?token=xxx
   */
  getOrderStatus: (tableId, token) =>
    get(`/api/order/${tableId}/order-status?token=${encodeURIComponent(token)}`),

  /**
   * Customer modifies their order (adds/removes items before kitchen prep starts)
   * POST /api/order/:orderId/customer-modify
   */
  customerModifyOrder: (orderId, token, action, items) =>
    post(`/api/order/${orderId}/customer-modify`, { token, action, items }),

  /**
   * Validate token on re-scan (customer-side)
   * GET /api/order/:tableId/token-check?token=xxx
   */
  checkCustomerToken: (tableId, token) =>
    get(`/api/order/${tableId}/token-check?token=${encodeURIComponent(token)}`),
};
