# Feature Flows

## Last Updated
2026-06-27 | Updated by: Antigravity AI Agent (Claude Opus 4.6 Thinking)

---

## Feature Index

| Feature Name | Status | Primary Files Involved |
|---|---|---|
| Product Key Authentication (Multi-Tenant Gate) | active | `Server/src/middleware/productKeyAuth.js`, `Server/src/services/productKeyService.js`, `Server/src/config/supabase.js` |
| Supabase Multi-Tenant Proxy (AsyncLocalStorage) | active | `Server/src/config/supabase.js`, `Server/src/middleware/productKeyAuth.js` |
| Redis Tenant-Scoped Keys | active | `Server/src/config/redis.js` |
| Retrop SuperAdmin Auth | active | `Server/src/controllers/retropController.js`, `Server/src/services/retropAuthService.js`, `Server/src/middleware/retropAuth.js`, `Retrop_Admin_Dashboard/src/pages/Login.jsx` |
| Retrop Dashboard | active | `Server/src/controllers/retropController.js`, `Retrop_Admin_Dashboard/src/pages/Dashboard.jsx` |
| Retrop Restaurant Onboarding | active | `Server/src/controllers/retropController.js`, `Retrop_Admin_Dashboard/src/pages/Restaurants.jsx` |
| Retrop Restaurant Admin Management | active | `Server/src/controllers/retropController.js`, `Retrop_Admin_Dashboard/src/pages/RestaurantDetails.jsx` |
| Retrop Product Key Lifecycle | active | `Server/src/services/productKeyService.js`, `Server/src/controllers/retropController.js`, `Retrop_Admin_Dashboard/src/pages/RestaurantDetails.jsx` |
| Retrop Pricing Plans CRUD | active | `Server/src/controllers/retropController.js`, `Retrop_Admin_Dashboard/src/pages/Settings.jsx` |
| Retrop Business Config | active | `Server/src/controllers/retropController.js`, `Retrop_Admin_Dashboard/src/pages/Settings.jsx` |
| Retrop Subscription Billing & Cron | active | `Server/src/utils/billingCron.js`, `Server/src/controllers/retropController.js`, `Server/src/services/invoiceService.js` |
| Retrop Transaction & Invoice Management | active | `Server/src/controllers/retropController.js`, `Server/src/services/invoiceService.js`, `Retrop_Admin_Dashboard/src/pages/Transactions.jsx` |
| Email Dispatch System | active | `Server/src/services/mailer.js` |
| Setup QR Code (ECIES Encrypted) | active | `Server/src/utils/crypto.js`, `Server/src/controllers/retropController.js`, `Server/src/services/mailer.js`, `Retrop_RMS_App/src/components/AppSettingsModal.tsx` |
| App Settings Modal (URL + Key + QR Scan) | active | `Retrop_RMS_App/src/components/AppSettingsModal.tsx`, `Retrop_RMS_App/src/config/api.ts` |
| Admin / Manager Login | active | `Server/src/controllers/adminController.js`, `Server/src/services/authService.js`, `Retrop_RMS_App/src/app/login.tsx`, `Retrop_RMS_App/src/context/AuthContext.tsx` |
| Waiter Login | active | `Server/src/controllers/waiterController.js`, `Server/src/services/waiterAuthService.js`, `Retrop_RMS_App/src/app/login.tsx`, `Retrop_RMS_App/src/context/WaiterAuthContext.tsx` |
| Kitchen Login | active | `Server/src/controllers/kitchenController.js`, `Server/src/services/kitchenAuthService.js`, `Retrop_RMS_App/src/app/login.tsx`, `Retrop_RMS_App/src/context/KitchenAuthContext.tsx` |
| JWT Token Refresh | active | `Server/src/routes/routes.js`, `Retrop_RMS_App/src/utils/apiClient.ts` |
| Customer QR Scan → Order Session | active | `Retrop_RMS_Frontend/src/pages/QRLanding/`, `Retrop_RMS_Frontend/src/services/api.js`, `Server/src/services/orderSessionService.js` |
| Customer Info Submission | active | `Retrop_RMS_Frontend/src/pages/CustomerInfo/`, `Server/src/services/orderSessionService.js` |
| Waiter Accepts Order Session | active | `Retrop_RMS_App/src/app/waiter/dashboard.tsx`, `Server/src/services/orderSessionService.js` |
| Customer Browses Menu + Cart | active | `Retrop_RMS_Frontend/src/pages/Menu/`, `Retrop_RMS_Frontend/src/pages/Cart/`, `Retrop_RMS_Frontend/src/context/OrderContext.jsx` |
| Customer Places Order | active | `Retrop_RMS_Frontend/src/pages/Cart/`, `Server/src/services/orderSessionService.js` |
| Customer Order Tracking | active | `Retrop_RMS_Frontend/src/pages/OrderTracking/`, `Retrop_RMS_Frontend/src/services/api.js` |
| Customer Modifies Order | active | `Retrop_RMS_Frontend/src/pages/OrderTracking/`, `Server/src/services/orderSessionService.js` |
| Customer Token Re-scan | active | `Retrop_RMS_Frontend/src/pages/QRLanding/`, `Server/src/controllers/customerOrderController.js` |
| Waiter Order Management | active | `Retrop_RMS_App/src/app/waiter/order-detail.tsx`, `Retrop_RMS_App/src/app/waiter/active-orders.tsx` |
| Waiter Concludes Order (Payment) | active | `Retrop_RMS_App/src/app/waiter/order-detail.tsx`, `Server/src/services/orderSessionService.js` |
| Kitchen Dashboard (Kanban) | active | `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`, `Server/src/controllers/kitchenController.js` |
| Kitchen Marks Order Ready | active | `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`, `Server/src/services/orderSessionService.js` |
| Kitchen Acknowledges Add-on | active | `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`, `Server/src/controllers/kitchenController.js` |
| Push Notifications (FCM) | active | `Server/src/services/notificationService.js`, `Retrop_RMS_App/src/services/notificationService.ts` |
| Socket.io Real-time Events | active | `Server/src/services/socketService.js`, `Retrop_RMS_App/src/utils/socket.ts` |
| Manager Dashboard | active | `Retrop_RMS_App/src/app/manager/dashboard.tsx`, `Server/src/controllers/managerController.js` |
| Restaurant Open / Close Toggle | active | `Retrop_RMS_App/src/app/manager/dashboard.tsx`, `Server/src/controllers/restaurantSettingsController.js` |
| Menu Management | active | `Retrop_RMS_App/src/app/manager/menu.tsx`, `Server/src/services/menuService.js` |
| Menu Image Upload | active | `Retrop_RMS_App/src/app/manager/menu.tsx`, `Server/src/controllers/menuController.js` |
| Waiter Management | active | `Retrop_RMS_App/src/app/manager/waiters.tsx`, `Server/src/controllers/managerController.js` |
| Kitchen Account Management | active | `Retrop_RMS_App/src/app/manager/kitchen.tsx`, `Server/src/controllers/kitchenController.js` |
| Table Management | active | `Retrop_RMS_App/src/app/manager/tables.tsx`, `Server/src/services/tableService.js` |
| Restaurant Info Editor | active | `Retrop_RMS_App/src/app/manager/restaurant-info.tsx`, `Server/src/services/restaurantInfoService.js` |
| Analytics | active | `Retrop_RMS_App/src/app/manager/analytics.tsx`, `Server/src/services/orderAnalyticsService.js` |
| Bill / Invoice View (Customer) | active | `Retrop_RMS_Frontend/src/pages/ThankYou/`, `Server/src/controllers/customerOrderController.js` |
| Public Menu Page | active | `Retrop_RMS_Frontend/src/pages/PublicMenu/` |
| Restaurant Website Homepage | active | `Retrop_RMS_Frontend/src/pages/Home/` |
| Restaurant Closed Guard | active | `Retrop_RMS_Frontend/src/App.jsx`, `Server/src/middleware/restaurantOpen.js` |
| Manager Session Inactivity Timeout | active | `Server/src/services/socketService.js`, `Retrop_RMS_App/src/app/manager/_layout.tsx` |
| Discount Application (billing) | active | `Server/src/services/orderSessionService.js` |
| Tax Calculation (inclusive/exclusive) | active | `Server/src/services/orderSessionService.js` |
| Locked Items (malpractice guard) | active | `Server/src/services/orderSessionService.js` |
| Invoice Number Generation | active | `Server/src/services/orderSessionService.js` |
| Frontend Product Key Error Guard | active | `Retrop_RMS_Frontend/src/services/api.js`, `Retrop_RMS_Frontend/src/App.jsx` |

---

## Feature Entries

---

### Product Key Authentication (Multi-Tenant Gate)
**Status**: active
**Trigger**: Every restaurant-facing API request (admin, waiter, kitchen, customer order routes).

**Flow**:
1. Client sends `X-Product-Key` header with every request.
2. `Server/src/middleware/productKeyAuth.js` extracts the header value.
3. Calls `productKeyService.resolveKey(keyValue)` which queries `product_key` joined with `retrop_restaurant`.
4. If key is valid and active, and restaurant is active:
   - Calls `tenantContext.enterWith({ restaurantId })` to set the async context.
   - Attaches `req.restaurantId`, `req.productKeyId`, `req.businessName` to the request.
5. All downstream Supabase queries and Redis key lookups are automatically scoped by the proxy/helper.

**Edge Cases & Guards**:
- 401 `key_missing` → No X-Product-Key header.
- 401 `key_invalid` → Key not found in DB.
- 403 `key_inactive` → Key exists but `isActive = false`.
- 403 `restaurant_inactive` → Restaurant's `isActive = false`.

**Related Files**:
- `Server/src/middleware/productKeyAuth.js`
- `Server/src/services/productKeyService.js`
- `Server/src/config/supabase.js`

---

### Supabase Multi-Tenant Proxy (AsyncLocalStorage)
**Status**: active
**Trigger**: Any Supabase query on a tenant-scoped table while `tenantContext` has an active store.

**Flow**:
1. `supabase.js` exports a `Proxy` over the raw Supabase client.
2. When `.from(tableName)` is called for any table in `tenantTables` (admin, waiter, kitchen, orders, menu, etc.):
   - The returned query builder is wrapped in a second Proxy.
   - For `select`, `update`, `delete`, etc.: `.eq('restaurantId', store.restaurantId)` is automatically appended.
   - For `insert` / `upsert`: `restaurantId` is injected into the payload if not already present.
3. Tables NOT in the `tenantTables` list (e.g., `retrop_restaurant`, `product_key`, `retrop_admin`) are NOT scoped — these are global control tables.

**Edge Cases & Guards**:
- If `tenantContext.getStore()` is null (no product key middleware ran), queries proceed without scoping. This is by design for Retrop control plane routes.

**Related Files**:
- `Server/src/config/supabase.js`

---

### Retrop SuperAdmin Auth
**Status**: active
**Trigger**: Retrop admin logs in via the Admin Dashboard (`/api/retrop/auth/login`).

**Flow**:
1. `Retrop_Admin_Dashboard/src/pages/Login.jsx` → sends `{email, password}` to `POST /api/retrop/auth/login`.
2. `retropAuthService.login()` → queries `retrop_admin` table by email, verifies bcrypt password, deactivates prior sessions, creates new `retrop_admin_session`.
3. Returns `{accessToken, refreshToken, admin: {adminId, name, email}}`. Access token: 8h expiry, refresh: 30 days.
4. Dashboard stores tokens in localStorage. All subsequent requests use `Authorization: Bearer {accessToken}`.
5. `retropAuth` middleware validates the JWT against `RETROP_JWT_SECRET` and verifies the session is active in DB.

**Edge Cases & Guards**:
- Rate limit: 10 login attempts per 15 min per IP.
- `isActive = false` → 403 "Account is deactivated".
- Separate JWT secrets from restaurant admin tokens (`RETROP_JWT_SECRET` / `RETROP_JWT_REFRESH_SECRET`).

**Related Files**:
- `Retrop_Admin_Dashboard/src/pages/Login.jsx`
- `Retrop_Admin_Dashboard/src/services/api.js`
- `Server/src/controllers/retropController.js`
- `Server/src/services/retropAuthService.js`
- `Server/src/middleware/retropAuth.js`

---

### Retrop Restaurant Onboarding
**Status**: active
**Trigger**: Retrop admin creates a new restaurant from the Admin Dashboard.

**Flow**:
1. `POST /api/retrop/restaurants` with body `{businessName, ownerName, ownerMobile, gender, ownerEmail}`.
2. `retropController.createRestaurant()`:
   - Inserts row into `retrop_restaurant`.
   - Calls `bootstrapRestaurant(restaurantId, businessName)` → creates `restaurant_settings` (closed by default) and `restaurant_info` rows.
   - Calls `createDefaultManager(restaurantId, ownerName, ownerMobile, ownerEmail)` → creates `admin` row with role='owner', default password: `{first5DigitsOfMobile}@password`.
   - Sends welcome email via `sendWelcomeEmail()`.
3. Returns the created restaurant record.

**Edge Cases & Guards**:
- Rate limited: 30 operations per 15 min.
- Welcome email fails silently (logged but does not block response).

**Related Files**:
- `Server/src/controllers/retropController.js`
- `Server/src/services/mailer.js`
- `Retrop_Admin_Dashboard/src/pages/Restaurants.jsx`

---

### Retrop Product Key Lifecycle
**Status**: active
**Trigger**: Retrop admin generates/toggles/deletes keys from RestaurantDetails page.

**Flow**:
1. **Generate**: `POST /api/retrop/keys/generate/:restaurantId` → `productKeyService.generateKey()`:
   - Only one key per restaurant allowed (400 if one exists).
   - Generates `RETROP-XXXX-XXXX-XXXX` format (hex segments).
   - Retries up to 5 times for uniqueness.
2. **Toggle**: `PATCH /api/retrop/keys/:keyId/toggle` → flips `isActive`.
3. **Delete**: `DELETE /api/retrop/keys/:keyId`.
4. **Mail credentials**: `POST /api/retrop/restaurants/:restaurantId/mail-credentials` → sends email with product key, admin credentials, and ECIES-encrypted setup QR code.
5. **Get Setup QR**: `GET /api/retrop/restaurants/:restaurantId/setup-qrcode` → returns QR image as base64 PNG.

**Edge Cases & Guards**:
- Key deactivation immediately blocks all restaurant operations (productKeyAuth returns 403).
- Billing cron also deactivates keys on subscription suspension.

**Related Files**:
- `Server/src/services/productKeyService.js`
- `Server/src/controllers/retropController.js`
- `Server/src/services/mailer.js`
- `Server/src/utils/crypto.js`
- `Retrop_Admin_Dashboard/src/pages/RestaurantDetails.jsx`

---

### Setup QR Code (ECIES Encrypted)
**Status**: active
**Trigger**: Retrop admin mails credentials or requests setup QR for a restaurant.

**Flow**:
1. Server reads `SERVER_URL` env var (or constructs from request) and the restaurant's product key.
2. `encryptSetupPayload(serverUrl, productKey)` in `Server/src/utils/crypto.js`:
   - Creates JSON payload: `[serverUrl, productKey]`.
   - Encrypts with ECIES (secp256k1) using `ECC_PUBLIC_KEY`.
   - Returns Base64-encoded ciphertext.
3. QR code is generated from the ciphertext using the `qrcode` library.
4. On the mobile app, `AppSettingsModal.tsx` scans the QR → decrypts with the **private key** embedded in the app → auto-fills server URL and product key.

**Related Files**:
- `Server/src/utils/crypto.js`
- `Server/src/controllers/retropController.js`
- `Server/src/services/mailer.js`
- `Retrop_RMS_App/src/components/AppSettingsModal.tsx`
- `Retrop_RMS_App/src/config/api.ts`

---

### Retrop Subscription Billing & Cron
**Status**: active
**Trigger**: Daily at midnight (00:00) via `node-cron`.

**Flow**:
1. `initBillingScheduler()` called at server startup → schedules `runSubscriptionChecks()` daily.
2. **Step 1 — Expired active subscriptions** (status='active', endDate past today):
   - Monthly plans: transition to `grace_period`, set `gracePeriodEndsAt` = endDate + gracePeriodDays (default 10).
   - Generates a pending `transaction` with invoice number format `RETROP/YYYY-MM/XXXX`.
   - Generates PDF invoice via `invoiceService.generateInvoicePDF()`.
   - Sends renewal reminder + pending invoice email to owner.
3. **Step 2 — Expired grace period** (status='grace_period', gracePeriodEndsAt past today):
   - Updates subscription to `suspended`.
   - Deactivates restaurant (`retrop_restaurant.isActive = false`).
   - Deactivates all product keys for that restaurant.
   - Sends suspension notice email.
4. **Step 3 — Upcoming renewals** (7-day reminder for active subscriptions near endDate):
   - Sends renewal reminder email.

**Edge Cases & Guards**:
- Owner email fetched from `admin` table (role='owner') for each restaurant.
- If email is null, no email is sent (degrades gracefully).
- Tax calculation on invoices respects `retrop_business_config.isTaxEnabled`.

**Related Files**:
- `Server/src/utils/billingCron.js`
- `Server/src/services/invoiceService.js`
- `Server/src/services/mailer.js`

---

### Email Dispatch System
**Status**: active
**Trigger**: Various business events (onboarding, credential delivery, payment confirmation, renewal, suspension).

**Flow**:
1. `Server/src/services/mailer.js` configures Nodemailer with Gmail SMTP (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
2. Email types:
   - `sendWelcomeEmail()` — New restaurant onboarding.
   - `sendCredentialsEmail()` — Product key + admin credentials + setup QR code.
   - `sendInvoiceEmail()` — Payment confirmation with PDF attachment.
   - `sendRenewalReminderEmail()` — Subscription renewal notice (7-day warning or grace period alert).
   - `sendPendingInvoiceEmail()` — Renewal invoice with PDF attachment.
   - `sendSuspensionEmail()` — Service suspension notice.
3. All emails are HTML-formatted with Retrop branding.
4. If SMTP credentials are missing, emails are mocked (logged but not sent).

**Related Files**:
- `Server/src/services/mailer.js`
- `Server/src/services/invoiceService.js`

---

### App Settings Modal (URL + Key + QR Scan)
**Status**: active
**Trigger**: User taps settings icon (cog) on the app's index/login screen or from within the app.

**Flow**:
1. `AppSettingsModal.tsx` opens with current config (Server URL, Product Key, Restaurant Name).
2. User can:
   - **Manually enter** server URL and product key.
   - **Scan QR code** using `expo-camera` → decrypts ECIES payload → auto-fills URL and key.
   - **Test connection** → validates URL by making a health check request.
   - **Change theme** (light/dark).
   - **Reset all config** → clears AsyncStorage and restarts setup.
3. On save, `updateApiConfig(url, key)` persists to AsyncStorage and updates in-memory `_baseUrl` and `_productKey`.
4. All subsequent API calls include `X-Product-Key` header and use the configured base URL.

**Edge Cases & Guards**:
- Backup/restore on cancel (original values saved to refs).
- QR scan uses error correction level 'H' (high).
- ECIES decryption uses the private key stored in the app's config.

**Related Files**:
- `Retrop_RMS_App/src/components/AppSettingsModal.tsx`
- `Retrop_RMS_App/src/config/api.ts`
- `Retrop_RMS_App/src/utils/serverUrlStorage.ts`

---

### Frontend Product Key Error Guard
**Status**: active
**Trigger**: Any API response with `code: 'key_inactive'` or `code: 'key_invalid'`.

**Flow**:
1. `Retrop_RMS_Frontend/src/services/api.js` request wrapper checks for key error codes on non-OK responses.
2. Dispatches `CustomEvent('retrop-key-error', { detail: json })` on `window`.
3. `App.jsx` listens for this event and renders a full-screen offline/blocked screen.

**Related Files**:
- `Retrop_RMS_Frontend/src/services/api.js`
- `Retrop_RMS_Frontend/src/App.jsx`

---

### Admin / Manager Login
**Status**: active
**Trigger**: User opens Expo app → taps "Manager" role tab → enters mobile + password → taps "Sign In as Manager".

**Flow**:
1. `Retrop_RMS_App/src/app/login.tsx` → calls `useAuth().login(mobile, password)`.
2. `AuthContext.tsx` → calls `loginManager({mobile, password})` from `authService.ts`.
3. **API call**: `POST /api/admin/login` with body `{mobile, password}` + `X-Product-Key` header.
4. `Server/src/services/authService.js` → queries `admin` table (auto-scoped by restaurantId via proxy), verifies bcrypt password, invalidates prior sessions, creates new `admin_session` row.
5. Returns `{accessToken, refreshToken, admin}`. Access token: 15 min, refresh: 7 days.
6. `AuthContext` → saves tokens to SecureStore. Router navigates to `/manager/dashboard`.

**Edge Cases & Guards**:
- Rate limit: 5 admin login attempts per 15 min per IP.
- `isActive = false` → error.
- Product key validation runs first (via `productKeyAuth` middleware).
- Mobile uniqueness is per-restaurant (`UNIQUE (restaurantId, mobile)`).

**Related Files**:
- `Retrop_RMS_App/src/app/login.tsx`
- `Retrop_RMS_App/src/context/AuthContext.tsx`
- `Retrop_RMS_App/src/services/authService.ts`
- `Server/src/controllers/adminController.js`
- `Server/src/services/authService.js`

---

### Waiter Login
**Status**: active
**Trigger**: User selects "Waiter" tab on login screen → enters mobile + password.

**Flow**:
Same pattern as Admin Login, using `WaiterAuthContext`, `waiterAuthService`, `POST /api/waiter/login`, and Redis session `waiter_session:{restaurantId}:{waiterId}`.

**Edge Cases & Guards**:
- Rate limit: 10/15min. `isActive = false` → disabled flag. Product key required.

**Related Files**:
- `Retrop_RMS_App/src/context/WaiterAuthContext.tsx`
- `Server/src/services/waiterAuthService.js`

---

### Kitchen Login
**Status**: active
**Trigger**: User selects "Kitchen" tab → enters mobile + password.

**Flow**:
Identical to Waiter Login using `KitchenAuthContext`, `kitchenAuthService`, `POST /api/kitchen/login`.

**Related Files**:
- `Retrop_RMS_App/src/context/KitchenAuthContext.tsx`
- `Server/src/services/kitchenAuthService.js`

---

### Customer QR Scan → Order Session
**Status**: active
**Trigger**: Customer scans QR code printed on a restaurant table.

**Flow**:
1. QR URL opens `Retrop_RMS_Frontend` at `/order/{tableId}`.
2. `QRLanding` page → checks for existing token in localStorage → if found, calls `GET /api/order/{tableId}/token-check?token=...`.
3. If no valid token, calls `POST /api/order/session` with body `{tableId}` + `X-Product-Key` header.
4. Backend validates table, creates Redis session with tenant-scoped key `order_session:{restaurantId}:{tableId}`.
5. Customer navigates to CustomerInfo page.

**Edge Cases & Guards**:
- Product key validation happens first → blocks if key invalid/inactive.
- 403 → Restaurant closed. 404 → Invalid tableId. 423 → Table busy.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/QRLanding/`
- `Retrop_RMS_Frontend/src/services/api.js`
- `Server/src/services/orderSessionService.js`

---

### Customer Info Submission
**Status**: active — no change from original flow. Now scoped by tenant.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/CustomerInfo/`
- `Server/src/services/orderSessionService.js`

---

### Waiter Accepts Order Session
**Status**: active — no change from original flow. Now scoped by tenant.

**Related Files**:
- `Retrop_RMS_App/src/app/waiter/dashboard.tsx`
- `Server/src/services/orderSessionService.js`

---

### Customer Browses Menu + Cart
**Status**: active — no change from original flow. Menu fetch now requires product key.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/Menu/`
- `Retrop_RMS_Frontend/src/context/OrderContext.jsx`

---

### Customer Places Order
**Status**: active — no change from original flow. Now scoped by tenant.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/Cart/`
- `Server/src/services/orderSessionService.js`

---

### Customer Order Tracking
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/OrderTracking/`
- `Server/src/controllers/customerOrderController.js`

---

### Customer Modifies Order
**Status**: active — no change from original flow. Locked items guard still active.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/OrderTracking/`
- `Server/src/services/orderSessionService.js`

---

### Customer Token Re-scan (Resume Session)
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/QRLanding/`
- `Server/src/controllers/customerOrderController.js`

---

### Waiter Order Management
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/waiter/active-orders.tsx`
- `Retrop_RMS_App/src/app/waiter/order-detail.tsx`
- `Server/src/services/orderSessionService.js`

---

### Waiter Concludes Order (Payment)
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/waiter/order-detail.tsx`
- `Server/src/services/orderSessionService.js`

---

### Kitchen Dashboard (Kanban)
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`
- `Server/src/controllers/kitchenController.js`

---

### Kitchen Marks Order Ready
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`
- `Server/src/services/orderSessionService.js`

---

### Kitchen Acknowledges Add-on
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`
- `Server/src/controllers/kitchenController.js`

---

### Push Notifications (FCM)
**Status**: active — same lifecycle. FCM tokens now stored in tenant-scoped Redis keys.

**Related Files**:
- `Server/src/services/notificationService.js`
- `Retrop_RMS_App/src/services/notificationService.ts`

---

### Socket.io Real-time Events
**Status**: active — same lifecycle.

**Related Files**:
- `Server/src/services/socketService.js`
- `Retrop_RMS_App/src/utils/socket.ts`
- `Retrop_RMS_App/src/app/manager/_layout.tsx`

---

### Restaurant Open / Close Toggle
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/manager/dashboard.tsx`
- `Server/src/controllers/restaurantSettingsController.js`
- `Server/src/middleware/restaurantOpen.js`
- `Retrop_RMS_Frontend/src/App.jsx`

---

### Menu Management
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/manager/menu.tsx`
- `Server/src/services/menuService.js`

---

### Restaurant Info Editor
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/manager/restaurant-info.tsx`
- `Server/src/services/restaurantInfoService.js`

---

### Analytics
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_App/src/app/manager/analytics.tsx`
- `Server/src/services/orderAnalyticsService.js`

---

### Bill / Invoice View (Customer)
**Status**: active — no change from original flow.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/ThankYou/`
- `Server/src/controllers/customerOrderController.js`

---

### Locked Items (Anti-malpractice Guard)
**Status**: active — no change from original flow.

**Related Files**:
- `Server/src/services/orderSessionService.js`

---

### Invoice Number Generation
**Status**: active — no change from original flow. Daily counter is now tenant-scoped: `daily_order_counter:{restaurantId}:{date}`.

**Related Files**:
- `Server/src/services/orderSessionService.js`
- `Server/src/utils/time.js`

---

## How AI agents should update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **Add a new Feature Entry for every new user-facing or system feature added.** Copy the entry template structure (Status, Trigger, Flow, Edge Cases, Related Files).
> 2. **Update the Feature Index table** whenever a new feature entry is added or an existing one changes status.
> 3. **Status values**: use `active` (working and used), `partial` (implemented but incomplete), `placeholder` (scaffolded but not functional), `unknown` (cannot be determined from code alone).
> 4. **Every file path in Related Files must exist** in the repository. Verify before adding. Use the NEW directory names: `Server/`, `Retrop_RMS_App/`, `Retrop_RMS_Frontend/`, `Retrop_Admin_Dashboard/`.
> 5. **When a feature is removed or replaced**, change its status to the appropriate value and add a note. Do not delete the entry — mark it deprecated with a date.
> 6. **When fixing a bug in a feature**, update the Edge Cases section with the fix and cross-reference AGENT_MEMORY_LOG.md.
> 7. **Update the "Last Updated" line** at the top after any change.
> 8. **Do not invent flow steps** — every step must trace to actual code read from the repository.
