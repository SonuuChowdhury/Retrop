# Feature Flows

## Last Updated
2026-06-21 | Updated by: Antigravity AI Agent

---

## Feature Index

| Feature Name | Status | Primary Files Involved |
|---|---|---|
| Admin / Manager Login | active | `Backend/src/controllers/adminController.js`, `Backend/src/services/authService.js`, `App/src/app/login.tsx`, `App/src/context/AuthContext.tsx`, `App/src/services/authService.ts` |
| Waiter Login | active | `Backend/src/controllers/waiterController.js`, `Backend/src/services/waiterAuthService.js`, `App/src/app/login.tsx`, `App/src/context/WaiterAuthContext.tsx` |
| Kitchen Login | active | `Backend/src/controllers/kitchenController.js`, `Backend/src/services/kitchenAuthService.js`, `App/src/app/login.tsx`, `App/src/context/KitchenAuthContext.tsx` |
| JWT Token Refresh | active | `Backend/src/routes/routes.js`, `Backend/src/services/authService.js`, `App/src/utils/apiClient.ts` |
| App Server URL Setup | active | `App/src/app/setup.tsx`, `App/src/config/api.ts`, `App/src/utils/serverUrlStorage.ts`, `App/src/app/_layout.tsx` |
| Customer QR Scan → Order Session | active | `Frontend/src/pages/QRLanding/`, `Frontend/src/services/api.js`, `Backend/src/controllers/customerOrderController.js`, `Backend/src/services/orderSessionService.js` |
| Customer Info Submission | active | `Frontend/src/pages/CustomerInfo/`, `Frontend/src/services/api.js`, `Backend/src/services/orderSessionService.js` |
| Waiter Accepts Order Session | active | `App/src/app/waiter/dashboard.tsx`, `Backend/src/controllers/waiterController.js`, `Backend/src/services/orderSessionService.js` |
| Customer Browses Menu + Cart | active | `Frontend/src/pages/Menu/`, `Frontend/src/pages/Cart/`, `Frontend/src/context/OrderContext.jsx` |
| Customer Places Order | active | `Frontend/src/pages/Cart/`, `Frontend/src/services/api.js`, `Backend/src/services/orderSessionService.js` |
| Customer Order Tracking | active | `Frontend/src/pages/OrderTracking/`, `Frontend/src/services/api.js` |
| Customer Modifies Order | active | `Frontend/src/pages/OrderTracking/`, `Backend/src/services/orderSessionService.js` |
| Customer Token Re-scan | active | `Frontend/src/pages/QRLanding/`, `Backend/src/controllers/customerOrderController.js`, `Backend/src/services/orderSessionService.js` |
| Waiter Order Management | active | `App/src/app/waiter/order-detail.tsx`, `App/src/app/waiter/active-orders.tsx`, `Backend/src/controllers/waiterController.js`, `Backend/src/services/orderSessionService.js` |
| Waiter Concludes Order (Payment) | active | `App/src/app/waiter/order-detail.tsx`, `Backend/src/controllers/waiterController.js`, `Backend/src/services/orderSessionService.js` |
| Kitchen Dashboard (Kanban) | active | `App/src/app/kitchen/dashboard.tsx`, `Backend/src/controllers/kitchenController.js` |
| Kitchen Marks Order Ready | active | `App/src/app/kitchen/dashboard.tsx`, `Backend/src/services/orderSessionService.js` |
| Kitchen Acknowledges Add-on | active | `App/src/app/kitchen/dashboard.tsx`, `Backend/src/controllers/kitchenController.js` |
| Push Notifications (FCM) | active | `Backend/src/services/notificationService.js`, `App/src/services/notificationService.ts` |
| Socket.io Real-time Events | active | `Backend/src/services/socketService.js`, `App/src/utils/socket.ts`, `App/src/app/manager/_layout.tsx` |
| Manager Dashboard | active | `App/src/app/manager/dashboard.tsx`, `Backend/src/controllers/managerController.js` |
| Restaurant Open / Close Toggle | active | `App/src/app/manager/dashboard.tsx`, `Backend/src/controllers/restaurantSettingsController.js`, `Backend/src/middleware/restaurantOpen.js` |
| Menu Management | active | `App/src/app/manager/menu.tsx`, `Backend/src/controllers/menuController.js`, `Backend/src/services/menuService.js` |
| Menu Image Upload | active | `App/src/app/manager/menu.tsx`, `Backend/src/controllers/menuController.js`, `Backend/src/config/supabase.js` |
| Waiter Management | active | `App/src/app/manager/waiters.tsx`, `Backend/src/controllers/managerController.js` |
| Kitchen Account Management | active | `App/src/app/manager/kitchen.tsx`, `Backend/src/controllers/kitchenController.js` |
| Table Management | active | `App/src/app/manager/tables.tsx`, `Backend/src/controllers/managerController.js`, `Backend/src/services/tableService.js` |
| Restaurant Info Editor | active | `App/src/app/manager/restaurant-info.tsx`, `Backend/src/controllers/restaurantInfoController.js`, `Backend/src/services/restaurantInfoService.js` |
| Analytics | active | `App/src/app/manager/analytics.tsx`, `Backend/src/controllers/managerController.js`, `Backend/src/services/orderAnalyticsService.js` |
| Bill / Invoice View (Customer) | active | `Frontend/src/pages/ThankYou/`, `Backend/src/controllers/customerOrderController.js` |
| Public Menu Page | active | `Frontend/src/pages/PublicMenu/`, `Backend/src/routes/routes.js` |
| Restaurant Website Homepage | active | `Frontend/src/pages/Home/`, `Frontend/src/hooks/useRestaurantData.js` |
| Restaurant Closed Guard | active | `Frontend/src/App.jsx` (`ClosedGuard`), `Frontend/src/context/OrderContext.jsx`, `Backend/src/middleware/restaurantOpen.js` |
| Manager Session Inactivity Timeout | active | `Backend/src/services/socketService.js`, `App/src/app/manager/_layout.tsx` |
| Discount Application (billing) | active | `Backend/src/services/orderSessionService.js`, `App/src/app/manager/restaurant-info.tsx` |
| Tax Calculation (inclusive/exclusive) | active | `Backend/src/services/orderSessionService.js`, migration `007_tax_type.sql` |
| Locked Items (malpractice guard) | active | `Backend/src/services/orderSessionService.js`, migration `008_order_locked_items.sql` |
| Invoice Number Generation | active | `Backend/src/services/orderSessionService.js`, migration `011_invoice_no_field.sql` |

---

## Feature Entries

---

### App Server URL Setup
**Status**: active
**Trigger**: First launch of the Expo app (or after a reset); `initializeApi()` returns `'setup'` because no URL is saved in AsyncStorage.

**Flow**:
1. `App/src/app/_layout.tsx` → calls `initializeApi()` on mount. If result is `'setup'`, router navigates to `/setup`.
2. `/setup` screen (`App/src/app/setup.tsx`) → user types backend URL (e.g. ngrok URL); on save, calls `updateBaseUrl(url)`.
3. `App/src/config/api.ts` → `updateBaseUrl` persists URL to AsyncStorage under keys `rms_server_url` and `rms_server_url_set`. Also updates in-memory `_baseUrl`.
4. App navigates to the main routing screen. All subsequent `ENDPOINTS.*` getters read the saved `_baseUrl`.

**Edge Cases & Guards**:
- If AsyncStorage read fails, falls back to `EXPO_PUBLIC_API_URL` env var if present.
- If env var is set, app marks itself as ready without showing setup screen.
- Reset via `resetServerUrl()` clears AsyncStorage and sets `_initialized = false`.

**Related Files**:
- `App/src/app/_layout.tsx`
- `App/src/app/setup.tsx`
- `App/src/config/api.ts`
- `App/src/utils/serverUrlStorage.ts`

---

### Admin / Manager Login
**Status**: active
**Trigger**: User opens Expo app → taps "Manager" role tab → enters mobile + password → taps "Sign In as Manager".

**Flow**:
1. `App/src/app/login.tsx` → calls `useAuth().login(mobile, password)`.
2. `App/src/context/AuthContext.tsx` → calls `loginManager({mobile, password})` from `App/src/services/authService.ts`.
3. **API call**: `POST /api/admin/login` with body `{mobile, password}`.
4. `Backend/src/controllers/adminController.js` → delegates to `authService.login(mobile, password, ip, userAgent)`.
5. `Backend/src/services/authService.js` → queries `admin` table, verifies bcrypt password, invalidates prior sessions via `logoutAllSessions`, creates new `admin_session` row, updates `lastLogIn`.
6. Returns `{accessToken, refreshToken, admin: {adminId, name, mobile, role, email}}`. Access token expires in 15 min; refresh token in 7 days.
7. `AuthContext` → saves tokens to `expo-secure-store` via `TokenStorage.saveSession()`. Fetches manager profile from `GET /api/manager/profile`.
8. Router navigates to `/manager/dashboard`.

**Edge Cases & Guards**:
- Rate limit: 5 admin login attempts per 15 min per IP (`adminLoginLimiter`).
- `isActive = false` → returns error `'Admin account is inactive'`.
- Invalid credentials → returns `'Invalid credentials'` (same message for not-found and wrong-password to prevent enumeration).
- Login attempt always logged to `login_attempt` table.
- Previous sessions invalidated on new login (single active session enforced).

**Related Files**:
- `App/src/app/login.tsx`
- `App/src/context/AuthContext.tsx`
- `App/src/services/authService.ts`
- `Backend/src/controllers/adminController.js`
- `Backend/src/services/authService.js`
- `Backend/src/routes/routes.js` (line 117)

---

### Waiter Login
**Status**: active
**Trigger**: User selects "Waiter" tab on login screen → enters mobile + password.

**Flow**:
1. `login.tsx` → calls `useWaiterAuth().login(mobile, password)`.
2. `App/src/context/WaiterAuthContext.tsx` → calls backend.
3. **API call**: `POST /api/waiter/login`.
4. `Backend/src/controllers/waiterController.js` → delegates to `waiterAuthService.login(...)`.
5. `Backend/src/services/waiterAuthService.js` → queries `waiter` table, verifies bcrypt, stores session in Redis (`waiter_session:{waiterId}`), returns JWT pair.
6. On success: context saves tokens to SecureStore via `WaiterStorage`; fetches dashboard; router navigates to `/waiter/dashboard`.
7. FCM token is then sent via `POST /api/waiter/fcm-token` (from `App/src/services/notificationService.ts`).

**Edge Cases & Guards**:
- Rate limit: 10 waiter login attempts per 15 min.
- `isActive = false` → middleware returns `{status: 'error', message: '...', disabled: true}`. App shows "Account Disabled" alert.
- `waiterAuthMiddleware` on protected routes returns 403 + `disabled: true` if account deactivated after login.

**Related Files**:
- `App/src/app/login.tsx`
- `App/src/context/WaiterAuthContext.tsx`
- `Backend/src/controllers/waiterController.js`
- `Backend/src/services/waiterAuthService.js`
- `Backend/src/middleware/waiterKitchenAuth.js`

---

### Kitchen Login
**Status**: active
**Trigger**: User selects "Kitchen" tab on login screen → enters mobile + password.

**Flow**:
Identical pattern to Waiter Login, using `KitchenAuthContext`, `kitchenAuthService`, `POST /api/kitchen/login`, `kitchen_session:{kitchenId}` Redis key, and `KitchenStorage`. On success navigates to `/kitchen/dashboard`.

**Edge Cases & Guards**:
- Rate limit: 10 kitchen login attempts per 15 min.
- Same `disabled` flag handling as waiter.

**Related Files**:
- `App/src/context/KitchenAuthContext.tsx`
- `Backend/src/controllers/kitchenController.js`
- `Backend/src/services/kitchenAuthService.js`
- `Backend/src/middleware/waiterKitchenAuth.js`

---

### JWT Token Refresh
**Status**: active
**Trigger**: Any API call returns HTTP 401.

**Flow**:
1. `App/src/utils/apiClient.ts` → on 401 response, calls `onRefresh()` (provided by the relevant auth context as `refreshToken()`).
2. Auth context → calls refresh endpoint with stored refresh token.
3. **API call**: `POST /api/admin/refresh` or `POST /api/waiter/refresh` or `POST /api/kitchen/refresh`.
4. Backend verifies the refresh token JWT, finds active session in DB, issues new access token, updates session record.
5. New access token saved to SecureStore. Original request retried once.
6. On 403 + `disabled: true`: `onDisabled()` callback called → shows alert → logs out user.

**Edge Cases & Guards**:
- Refresh token expires after 7 days.
- If refresh fails, user is logged out and redirected to login.

**Related Files**:
- `App/src/utils/apiClient.ts`
- `Backend/src/services/authService.js` (`refreshAccessToken`)
- `Backend/src/services/waiterAuthService.js`
- `Backend/src/services/kitchenAuthService.js`

---

### Customer QR Scan → Order Session
**Status**: active
**Trigger**: Customer scans the QR code printed on a restaurant table. QR URL format: `http://{frontend-host}/order/{tableId}`.

**Flow**:
1. Browser opens `Frontend/src/pages/QRLanding/QRLanding.jsx` with `tableId` from URL params.
2. `QRLanding` first calls `GET /api/order/{tableId}/token-check?token={storedToken}` if a `rms_token_{tableId}` exists in localStorage — to resume an existing session.
3. If no valid token, calls `api.createOrderSession(tableId)` → `POST /api/order/session` with body `{tableId}`.
4. `Backend/src/controllers/customerOrderController.js` → `orderSessionService.createOrderSession(tableId)`.
5. `Backend/src/services/orderSessionService.js`:
   - Checks `restaurant_settings.isRestaurantOpen` (also enforced by `requireRestaurantOpen` middleware).
   - Validates `tableId` exists in `restaurant_table`.
   - Checks Redis for existing session. If session is beyond `waiting_customer_info` stage → returns 423 (Table Busy).
   - Creates session object in Redis with 20-min TTL: `{sessionToken, tableId, tableNo, status: 'waiting_customer_info', ...}`.
6. Response: `{status: 'success', data: sessionData, existing: boolean}`.
7. `QRLanding` stores `sessionToken` in `OrderContext` (sessionStorage-persisted), navigates to `/order/{tableId}/info`.

**Edge Cases & Guards**:
- 403 → Restaurant is closed (`requireRestaurantOpen` middleware).
- 404 → Invalid `tableId`.
- 423 → Table occupied by another customer (session past info stage).
- Existing session at `waiting_customer_info` stage → returned as-is (customer can re-fill info).

**Related Files**:
- `Frontend/src/pages/QRLanding/QRLanding.jsx`
- `Frontend/src/services/api.js`
- `Frontend/src/context/OrderContext.jsx`
- `Backend/src/controllers/customerOrderController.js`
- `Backend/src/services/orderSessionService.js`
- `Backend/src/middleware/restaurantOpen.js`

---

### Customer Info Submission
**Status**: active
**Trigger**: Customer on `CustomerInfo` page after successful session creation.

**Flow**:
1. `Frontend/src/pages/CustomerInfo/CustomerInfo.jsx` → collects `customerName` and `customerMobile`.
2. Calls `api.submitCustomerInfo({tableId, sessionToken, customerName, customerMobile})` → `POST /api/order/session/customer-info`.
3. `orderSessionService.submitCustomerInfo(...)`:
   - Validates session token and that status is `waiting_customer_info`.
   - Upserts row in `customer` table (mobile as PK; name + lastLogIn updated).
   - Updates Redis session: status → `'waiting_waiter'`.
   - Sends FCM push notification to **all logged-in waiters** via `notificationService.notifyAllWaiters(...)`.
4. Customer navigates to `WaitingWaiter` page.

**Edge Cases & Guards**:
- 410 → Session expired (Redis TTL elapsed).
- 403 → Invalid session token.
- If status already past `waiting_customer_info` → returns existing session state (idempotent).

**Related Files**:
- `Frontend/src/pages/CustomerInfo/CustomerInfo.jsx`
- `Frontend/src/services/api.js`
- `Backend/src/services/orderSessionService.js`
- `Backend/src/services/notificationService.js`

---

### Waiter Accepts Order Session
**Status**: active
**Trigger**: Waiter receives FCM push notification `new_order_request` or sees pending session on dashboard. Taps "Accept".

**Flow**:
1. `App/src/app/waiter/dashboard.tsx` → shows pending sessions from `GET /api/waiter/pending-sessions`.
2. Waiter taps accept → `POST /api/waiter/orders/{tableId}/accept`.
3. `Backend/src/controllers/waiterController.js` → `orderSessionService.waiterAcceptsOrder(tableId, waiterId)`.
4. `orderSessionService.waiterAcceptsOrder`:
   - Validates session exists and is `waiting_waiter` (or same waiter re-accepting `accepted`).
   - Verifies waiter `isActive`.
   - Generates `customerToken` (opaque string, `tok_...`) and `tokenValidUntil` (now + 5 hours).
   - Updates Redis session: `status → 'accepted'`, sets `waiterId`, `waiterName`, `customerToken`, `tokenValidUntil`.
5. Customer's `WaitingWaiter` page polling `GET /api/order/session/{tableId}/status` every 3 s detects `status === 'accepted'` → navigates to Menu.

**Edge Cases & Guards**:
- 409 → Already accepted by a different waiter.
- 410 → Session expired.
- 400 → Session not in an acceptable state.
- 403 → Waiter account inactive.

**Related Files**:
- `App/src/app/waiter/dashboard.tsx`
- `Backend/src/controllers/waiterController.js`
- `Backend/src/services/orderSessionService.js`
- `Frontend/src/pages/WaitingWaiter/WaitingWaiter.jsx`

---

### Customer Browses Menu + Cart
**Status**: active
**Trigger**: Session status transitions to `'accepted'`; customer navigated to `/order/{tableId}/menu`.

**Flow**:
1. `Frontend/src/pages/Menu/Menu.jsx` → fetches menu via `api.getMenu()` → `GET /api/order/menu`.
2. Backend returns all `isAvailable = true` items from `menu` table (Redis-cached for 5 min under `menu_cache`).
3. Customer taps items → `OrderContext.addToCart(dish, quantity, remarks)` updates in-memory + sessionStorage cart.
4. Cart icon/drawer shows item count. Cart state persisted in `sessionStorage` under `rms_order_state`.
5. Customer navigates to `/order/{tableId}/cart` to review before placing.

**Edge Cases & Guards**:
- Menu fetch is open (no auth, no `requireRestaurantOpen` guard — customers can browse menu even if closed).
- Cart is managed entirely client-side until order is placed.
- `lockedItems` concept does not apply at browse time — only after order is placed and kitchen marks ready.

**Related Files**:
- `Frontend/src/pages/Menu/Menu.jsx`
- `Frontend/src/pages/Cart/Cart.jsx`
- `Frontend/src/context/OrderContext.jsx`
- `Frontend/src/services/api.js`
- `Backend/src/controllers/customerOrderController.js` (`getPublicMenu`)

---

### Customer Places Order
**Status**: active
**Trigger**: Customer taps "Place Order" on Cart page.

**Flow**:
1. `Frontend/src/pages/Cart/Cart.jsx` → calls `api.placeOrder({tableId, sessionToken, items})` → `POST /api/order/place`.
2. `orderSessionService.placeOrder(tableId, sessionToken, items)`:
   - Validates session status is `'accepted'`.
   - Fetches all `dishId`s from `menu` table, validates availability.
   - Calculates `totalAmount` (subtotal only; taxes applied at bill-close time).
   - Generates `dailyOrderNo` via Redis `INCR daily_order_counter:{today}` (auto-expires in 48 h).
   - Generates `invoiceNo` = `INV{YYYYMMDD}{4-digit-seq}`.
   - Inserts row into `orders` table with `orderStatus = 'ordering'`, `customerToken`, `tokenValidUntil`.
   - Updates `restaurant_table` → `isAvailable = false`, `currentOrder = ordersId`.
   - Updates Redis session → `status = 'ordered'`, `orderId`.
   - Sends FCM push notification to all kitchen devices via `notificationService.notifyKitchen(...)`.
   - Emits Socket.io event `order:new` to all connected clients.
3. Response includes `{order, session}`.
4. Customer navigates to `/order/{tableId}/placed/{orderId}` → `OrderTracking` page.

**Edge Cases & Guards**:
- 410 → Session expired.
- 403 → Invalid session token.
- 400 → Waiter not yet accepted, or item unavailable, or empty items.
- Menu items re-validated against DB at order time (not trusting client price).

**Related Files**:
- `Frontend/src/pages/Cart/Cart.jsx`
- `Frontend/src/services/api.js`
- `Backend/src/services/orderSessionService.js`
- `Backend/src/services/notificationService.js`
- `Backend/src/services/socketService.js`

---

### Customer Order Tracking
**Status**: active
**Trigger**: After order placed; customer on `OrderTracking` page.

**Flow**:
1. `Frontend/src/pages/OrderTracking/OrderTracking.jsx` → polls `api.getOrderStatus(tableId, token)` → `GET /api/order/{tableId}/order-status?token={customerToken}`.
2. Backend validates `customerToken` against `orders.customerToken` and checks `tokenValidUntil`.
3. Returns current `orderStatus`, `ordersInfo`, `totalAmount`, etc.
4. Page displays live status: `ordering` → `preparing` → `ready` → `serving` → `completed`.
5. When `orderStatus === 'completed'` → page transitions to bill view or redirects to `/bill/{orderId}`.
6. Socket.io event `order:status_change` can also trigger immediate UI refresh.

**Edge Cases & Guards**:
- Customer token valid for 5 hours from waiter acceptance.
- `rms_token_{tableId}` stored in localStorage so tracking survives page refresh.
- `requireRestaurantOpen` applies to this endpoint.

**Related Files**:
- `Frontend/src/pages/OrderTracking/OrderTracking.jsx`
- `Frontend/src/services/api.js`
- `Backend/src/controllers/customerOrderController.js`

---

### Customer Modifies Order
**Status**: active
**Trigger**: Customer on `OrderTracking` page adds or modifies items before kitchen marks order ready.

**Flow**:
1. Customer taps modify → `api.customerModifyOrder(orderId, token, action, items)` → `POST /api/order/{orderId}/customer-modify`.
2. `orderSessionService.customerModifyOrder(orderId, token, action, items)`:
   - Validates `customerToken` and `tokenValidUntil`.
   - Checks `orderStatus` is one of `['ordering', 'preparing', 'ready', 'serving']`.
   - **ISSUE 3 FIX**: If `action === 'replace'`, locked items (set when kitchen marks `ready`) are always preserved at minimum locked quantity. Customer cannot reduce quantity below locked amount or remove locked items.
   - **ISSUE 2 FIX**: Newly added items are captured as an `addonBatch` object (`{type: 'addon', addonId, addonItems, kitchenAcknowledged: false, ...}`) and appended to `ordersUpdateInfo`.
   - Updates `orders` table with new `ordersInfo` and `ordersUpdateInfo`.
   - Emits `order:modified` Socket.io event.
   - Sends FCM push to kitchen.
3. Kitchen dashboard shows addon batches as separate cards for acknowledgement.

**Edge Cases & Guards**:
- 404 → Order not found or wrong token.
- 403 → Token expired.
- 400 → Order finalized (completed/cancelled).
- Quantity reduction / removal of locked items silently clamped to locked quantity.

**Related Files**:
- `Frontend/src/pages/OrderTracking/OrderTracking.jsx`
- `Backend/src/services/orderSessionService.js`

---

### Customer Token Re-scan (Resume Session)
**Status**: active
**Trigger**: Customer re-scans QR code at table after session is already active.

**Flow**:
1. `Frontend/src/pages/QRLanding/QRLanding.jsx` → reads `rms_token_{tableId}` from localStorage.
2. If token found, calls `api.checkCustomerToken(tableId, token)` → `GET /api/order/{tableId}/token-check?token={token}`.
3. Backend validates token against `orders.customerToken` and `tokenValidUntil`. Returns `{valid: true, orderId, orderStatus}`.
4. If valid, customer is redirected directly to the `OrderTracking` page for their existing order.
5. If invalid/expired, normal new session creation flow begins.

**Related Files**:
- `Frontend/src/pages/QRLanding/QRLanding.jsx`
- `Frontend/src/services/api.js`
- `Backend/src/controllers/customerOrderController.js`
- `Backend/src/routes/routes.js` (line 242–243)

---

### Waiter Order Management
**Status**: active
**Trigger**: Waiter views active orders on `active-orders.tsx` or drills into `order-detail.tsx`.

**Flow**:
1. `App/src/app/waiter/active-orders.tsx` → polls `GET /api/waiter/active-orders`.
2. Backend returns all orders where `waiterId = req.waiter.waiterId` and status not in `['completed', 'cancelled']`.
3. Waiter taps an order → `GET /api/waiter/orders/{orderId}` for full detail.
4. Waiter can:
   - **Add items**: `PATCH /api/waiter/orders/{orderId}/modify` with `{action: 'add', items}`.
   - **Remove items**: `PATCH /api/waiter/orders/{orderId}/modify` with `{action: 'remove', items}`.
   - **Update order status**: `PATCH /api/waiter/orders/{orderId}/status` (e.g. `serving`).
   - **Get bill preview**: `GET /api/waiter/orders/{orderId}/bill-preview`.
5. All modify actions call `orderSessionService.modifyOrder()` which re-calculates `totalAmount`, appends to `ordersUpdateInfo`, notifies kitchen via FCM + Socket.io `order:modified`.

**Edge Cases & Guards**:
- Waiter can only modify/view orders assigned to themselves (`order.waiterId === req.waiter.waiterId`).
- Cannot modify completed or cancelled orders.

**Related Files**:
- `App/src/app/waiter/active-orders.tsx`
- `App/src/app/waiter/order-detail.tsx`
- `Backend/src/controllers/waiterController.js`
- `Backend/src/services/orderSessionService.js`

---

### Waiter Concludes Order (Payment)
**Status**: active
**Trigger**: Customer requests bill; waiter taps "Conclude" in `order-detail.tsx`.

**Flow**:
1. Waiter selects payment method (cash / online / upi) → `POST /api/waiter/orders/{orderId}/conclude` with `{paymentMethod}`.
2. `orderSessionService.concludeOrder(orderId, waiterId, paymentMethod)`:
   - **ISSUE 3 FIX**: Uses `lockedItems` as minimum bill baseline. Final billable items = locked items (at locked or higher quantity) + any newly added unlocked items.
   - Fetches `restaurant_info` for tax config (`isGST`, `GSTIN`, `taxes`, `taxType`, `discounts`).
   - **ISSUE 9 FIX**: Applies active discounts to subtotal first: `discountedSubtotal = subtotal - sum(activeDiscounts)`.
   - Calculates taxes based on `taxType`:
     - `'exclusive'`: taxes added on top → `finalAmount = discountedSubtotal + sum(taxes)`.
     - `'inclusive'`: taxes extracted from discountedSubtotal → `finalAmount = discountedSubtotal`.
   - Updates `orders` row: `orderStatus = 'completed'`, `isPaymentCompleted = true`, `finalAmount`, `taxBreakdown`, `discountAmount`, `discountBreakdown`, `completedAt`.
   - Frees `restaurant_table` → `isAvailable = true`, `currentOrder = null`.
   - Deletes Redis order session.
   - Emits Socket.io `order:status_change` (status: completed) and `customer:bill_ready` events.
   - Calls `updateWaiterDailyStats(waiterId, finalAmount)` to update `waiter_daily_stats`.
   - Increments `customer.totalorders`.
3. Customer's tracking page receives `customer:bill_ready` event → redirects to `/bill/{orderId}`.

**Edge Cases & Guards**:
- 403 → Not waiter's order.
- 400 → Payment already completed.
- Discount + tax calculation is performed entirely server-side (never trusted from client).

**Related Files**:
- `App/src/app/waiter/order-detail.tsx`
- `Backend/src/controllers/waiterController.js`
- `Backend/src/services/orderSessionService.js`

---

### Kitchen Dashboard (Kanban)
**Status**: active
**Trigger**: Kitchen device opens app → logs in → navigates to `/kitchen/dashboard`.

**Flow**:
1. `App/src/app/kitchen/dashboard.tsx` → fetches `GET /api/kitchen/dashboard` on mount and polls periodically.
2. Backend returns all active orders (not completed/cancelled) sorted by status.
3. Dashboard displays a horizontal Kanban board: `Queue → Preparing → Ready → Serving`.
4. Socket.io events `order:new` and `order:modified` trigger immediate refresh.
5. FCM push notifications (`new_order` and `order_modified`) also wake the kitchen device.

**Related Files**:
- `App/src/app/kitchen/dashboard.tsx`
- `App/src/app/kitchen/_layout.tsx`
- `Backend/src/controllers/kitchenController.js`

---

### Kitchen Marks Order Ready
**Status**: active
**Trigger**: Kitchen has prepared all dishes; kitchen staff taps "Ready" on an order card.

**Flow**:
1. `PATCH /api/kitchen/orders/{orderId}/ready`.
2. `orderSessionService.kitchenOrderReady(orderId, kitchenId)`:
   - **ISSUE 3 FIX**: Snapshots `ordersInfo` into `lockedItems` (only once — does not overwrite if already locked). This prevents customers from removing items after food is served.
   - Updates `orders`: `orderStatus = 'ready'`, `lockedItems`, `readyAt`.
   - Sends FCM push to assigned waiter via `notificationService.notifyWaiter(order.waiterId, ...)`.
   - Emits `order:status_change` Socket.io event.

**Related Files**:
- `App/src/app/kitchen/dashboard.tsx`
- `Backend/src/services/orderSessionService.js`
- `Backend/src/services/notificationService.js`

---

### Kitchen Acknowledges Add-on
**Status**: active
**Trigger**: Customer or waiter adds items after original order; kitchen sees addon card.

**Flow**:
1. Kitchen taps "Done" on an addon batch card → `PATCH /api/kitchen/orders/{orderId}/addon/{addonId}/done`.
2. Backend finds the addon batch in `orders.ordersUpdateInfo` by `addonId`, sets `kitchenAcknowledged = true`.
3. Updates `orders` table.

**Related Files**:
- `App/src/app/kitchen/dashboard.tsx`
- `Backend/src/controllers/kitchenController.js`

---

### Push Notifications (FCM)
**Status**: active
**Trigger**: Various order lifecycle events (new customer request, order placed, order modified, order ready).

**Flow**:
1. Waiter/kitchen logs in → app calls `POST /api/waiter/fcm-token` or `POST /api/kitchen/fcm-token` with `{fcmToken}`.
2. Backend (`notificationService.js`) stores token in Redis: individual key + adds to SET of all active tokens.
3. On lifecycle events:
   - Customer submits info → `notifyAllWaiters('🔔 New Table Request', ...)`.
   - Order placed → `notifyKitchen('🍳 New Order #N', ...)`.
   - Waiter modifies → `notifyKitchen('⚠️ Order Modified', ...)`.
   - Kitchen marks ready → `notifyWaiter(waiterId, '✅ Order Ready!', ...)`.
4. FCM delivers to device via Firebase Admin SDK `sendEachForMulticast` (multi) or `send` (single).
5. App notification listeners (`App/src/services/notificationService.ts`) handle foreground/background events.

**Edge Cases & Guards**:
- `FIREBASE_SERVICE_ACCOUNT_JSON` not set → push notifications silently disabled; system degrades gracefully.
- Token not in Redis → notification skipped (waiter/kitchen not currently logged in).

**Related Files**:
- `Backend/src/services/notificationService.js`
- `App/src/services/notificationService.ts`
- `Backend/src/config/redis.js` (REDIS_KEYS)

---

### Socket.io Real-time Events
**Status**: active
**Trigger**: Client connects to backend WebSocket on layout mount (manager, waiter, kitchen).

**Flow**:
1. Client sends `socket.handshake.auth.token` + `socket.handshake.auth.role`.
2. `Backend/src/services/socketService.js` verifies token using role-specific secrets:
   - Admin JWT → manager session created in `manager_session` DB table.
   - Waiter/Kitchen JWT → minimal in-memory session entry.
   - Customer token → looked up in `orders.customerToken` + `tokenValidUntil`.
3. On successful connect, server emits `'connected'` event.
4. Manager socket sends `'manager:activity'` heartbeat every 60 s (from `_layout.tsx`). Backend updates `manager_session.lastActivityAt` and resets 30-min inactivity timeout.
5. Global events emitted via `socketService.emitToAll()`:
   - `order:new` → Kitchen dashboard refreshes.
   - `order:modified` → Kitchen + waiter dashboards refresh.
   - `order:status_change` → All clients (customer tracking updates status).
   - `customer:bill_ready` → Customer redirected to bill page.
6. On disconnect: manager session closed in DB; in-memory session map cleaned up.

**Edge Cases & Guards**:
- No token → immediately disconnected.
- Invalid/expired token → immediately disconnected.
- Manager inactive for 30 min → `manager:error` event emitted and socket disconnected.
- Graceful shutdown: `socketService.closeService()` called on `SIGTERM`.

**Related Files**:
- `Backend/src/services/socketService.js`
- `App/src/app/manager/_layout.tsx`
- `App/src/utils/socket.ts`

---

### Restaurant Open / Close Toggle
**Status**: active
**Trigger**: Manager taps open/close toggle on `manager/dashboard.tsx`.

**Flow**:
1. `App/src/app/manager/dashboard.tsx` → `PATCH /api/manager/settings/toggle`.
2. `Backend/src/controllers/restaurantSettingsController.js` → flips `restaurant_settings.isRestaurantOpen`.
3. When closing (`isRestaurantOpen → false`): also bulk-sets all `waiter.isActive = false`.
4. `requireRestaurantOpen` middleware on all customer order routes checks this flag on every request.
5. `ClosedGuard` component in `Frontend/src/App.jsx` checks `api.getRestaurantInfo()` on mount; if `isRestaurantOpen === false`, renders "We're Closed" screen for all `/order/*` routes.

**Edge Cases & Guards**:
- Middleware checks DB on every customer request (not cached at middleware level) — ensures immediate effect.

**Related Files**:
- `App/src/app/manager/dashboard.tsx`
- `Backend/src/controllers/restaurantSettingsController.js`
- `Backend/src/middleware/restaurantOpen.js`
- `Frontend/src/App.jsx` (ClosedGuard)
- `Frontend/src/context/OrderContext.jsx`

---

### Menu Management
**Status**: active
**Trigger**: Manager navigates to Menu tab in the app.

**Flow**:
1. `App/src/app/manager/menu.tsx` → fetches `GET /api/manager/menu` on mount.
2. Manager can:
   - **Add item**: `POST /api/manager/menu` with `{dishName, price, category, description, preparationTime, spicyLevel, isVegetarian}`.
   - **Update item**: `PUT /api/manager/menu/{dishId}`.
   - **Delete item**: `DELETE /api/manager/menu/{dishId}` (also deletes Supabase Storage images).
   - **Toggle availability**: `PATCH /api/manager/menu/{dishId}/availability`.
   - **Toggle category availability**: `PATCH /api/manager/menu/category/{category}/availability`.
   - **Upload image**: `POST /api/manager/menu/{dishId}/image` with raw image binary body (up to 6 MB).
   - **Delete image**: `DELETE /api/manager/menu/{dishId}/image`.
3. Backend (`menuService.js`) handles DB + Supabase Storage operations.

**Related Files**:
- `App/src/app/manager/menu.tsx`
- `Backend/src/controllers/menuController.js`
- `Backend/src/services/menuService.js`

---

### Restaurant Info Editor
**Status**: active
**Trigger**: Manager navigates to Info tab.

**Flow**:
1. `App/src/app/manager/restaurant-info.tsx` → `GET /api/manager/restaurant-info`.
2. Manager edits: restaurant name, address, mobile, GST settings (`isGST`, `GSTIN`, `taxes[]`), `taxType` (inclusive/exclusive), and `discounts[]`.
3. `PUT /api/manager/restaurant-info` saves changes to `restaurant_info` (single-row table).
4. Tax and discount config is applied at order conclusion time by `orderSessionService.concludeOrder`.

**Related Files**:
- `App/src/app/manager/restaurant-info.tsx`
- `Backend/src/controllers/restaurantInfoController.js`
- `Backend/src/services/restaurantInfoService.js`

---

### Analytics
**Status**: active
**Trigger**: Manager navigates to Analytics tab.

**Flow**:
1. `App/src/app/manager/analytics.tsx` → calls `GET /api/admins/analytics` and `GET /api/manager/analytics/orders`.
2. `Backend/src/services/orderAnalyticsService.js` aggregates order data (totals, revenue, per-waiter stats, etc.).
3. Manager can drill into individual orders via `GET /api/manager/analytics/orders/{orderId}`.

**Related Files**:
- `App/src/app/manager/analytics.tsx`
- `Backend/src/controllers/managerController.js`
- `Backend/src/services/orderAnalyticsService.js`

---

### Bill / Invoice View (Customer)
**Status**: active
**Trigger**: Customer reaches `/bill/{orderId}` after payment is completed.

**Flow**:
1. `Frontend/src/pages/ThankYou/ThankYou.jsx` → calls `api.getOrderBill(orderId)` → `GET /api/order/{orderId}/bill`.
2. Backend returns `{order, restaurantInfo}`. `order.isPaymentCompleted` must be `true` (400 if not).
3. Page displays full itemised bill with tax breakdown, discounts, `invoiceNo`, restaurant branding.

**Related Files**:
- `Frontend/src/pages/ThankYou/ThankYou.jsx`
- `Frontend/src/services/api.js`
- `Backend/src/controllers/customerOrderController.js`

---

### Locked Items (Anti-malpractice Guard)
**Status**: active
**Trigger**: Kitchen marks order as `ready` → `lockedItems` snapshot is taken.

**Flow**:
1. On `kitchenOrderReady`, backend sets `orders.lockedItems = [...orders.ordersInfo]` (only if not already set).
2. Thereafter, customer `customerModifyOrder` with `action = 'replace'` cannot reduce below locked quantities or remove locked items — server enforces merge with locked set.
3. `concludeOrder` uses `lockedItems` as minimum bill baseline — waiter cannot bill less than what was served.

**Related Files**:
- `Backend/src/services/orderSessionService.js`
- `Backend/src/migrations/008_order_locked_items.sql`

---

### Invoice Number Generation
**Status**: active
**Trigger**: Customer places an order.

**Flow**:
1. `generateDailyOrderNumber()` → Redis `INCR daily_order_counter:{YYYY-MM-DD}` (IST date). Counter auto-expires in 48 h.
2. `generateInvoiceNo(dailyOrderNo)` → `'INV' + todayDateIST().replace(/-/g, '') + String(dailyOrderNo).padStart(4, '0')`.
3. Stored in `orders.invoiceNo` at insert time. Immutable after creation.
4. Example: `INV202606200001`.

**Related Files**:
- `Backend/src/services/orderSessionService.js` (`generateDailyOrderNumber`, `generateInvoiceNo`)
- `Backend/src/migrations/011_invoice_no_field.sql`
- `Backend/src/utils/time.js`

---

## How AI agents should update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **Add a new Feature Entry for every new user-facing or system feature added.** Copy the entry template structure (Status, Trigger, Flow, Edge Cases, Related Files).
> 2. **Update the Feature Index table** whenever a new feature entry is added or an existing one changes status. The Feature Index MUST always match the entries below it — verify both before saving.
> 3. **Status values**: use `active` (working and used), `partial` (implemented but incomplete), `placeholder` (scaffolded but not functional), `unknown` (cannot be determined from code alone).
> 4. **Every file path in Related Files must exist** in the repository. Verify before adding.
> 5. **When a feature is removed or replaced**, change its status to the appropriate value and add a note. Do not delete the entry — mark it deprecated with a date.
> 6. **When fixing a bug in a feature**, update the Edge Cases section with the fix and cross-reference AGENT_MEMORY_LOG.md.
> 7. **Update the "Last Updated" line** at the top after any change.
> 8. **Do not invent flow steps** — every step must trace to actual code read from the repository.
