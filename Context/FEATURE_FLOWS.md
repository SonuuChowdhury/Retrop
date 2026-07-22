# Feature Flows

## Last Updated
2026-07-22 | Updated by: Antigravity AI Agent (Gemini 3.6 Flash)

---

## Feature Index

| Feature Name | Status | Primary Files Involved |
|---|---|---|
| Product Key Authentication (Multi-Tenant Gate) | active | `Server/src/middleware/productKeyAuth.js`, `Server/src/services/productKeyService.js` |
| Supabase Multi-Tenant Proxy (AsyncLocalStorage) | active | `Server/src/config/supabase.js` |
| Redis Tenant-Scoped Keys | active | `Server/src/config/redis.js` |
| Retrop SuperAdmin Auth | active | `Server/src/controllers/retropController.js`, `Server/src/services/retropAuthService.js`, `Server/src/middleware/retropAuth.js` |
| Retrop Dashboard | active | `Server/src/controllers/retropController.js` |
| Retrop Restaurant Onboarding | active | `Server/src/controllers/retropController.js`, `Server/src/services/mailer.js` |
| Retrop Restaurant Admin Management | active | `Server/src/controllers/retropController.js` |
| Retrop Product Key Lifecycle | active | `Server/src/services/productKeyService.js`, `Server/src/controllers/retropController.js` |
| Retrop Pricing Plans CRUD | active | `Server/src/controllers/retropController.js` |
| Retrop Business Config | active | `Server/src/controllers/retropController.js` |
| Retrop Subscription Billing & Cron | active | `Server/src/utils/billingCron.js`, `Server/src/services/invoiceService.js` |
| Retrop Transaction & Invoice Management | active | `Server/src/controllers/retropController.js`, `Server/src/services/invoiceService.js` |
| Email Dispatch System | active | `Server/src/services/mailer.js` |
| Setup QR Code (ECIES Encrypted) | active | `Server/src/utils/crypto.js`, `Server/src/controllers/retropController.js` |
| App Settings Modal (URL + Key + QR Scan) | active | `Retrop_RMS_App/src/components/AppSettingsModal.tsx`, `Retrop_RMS_App/src/config/api.ts` |
| Admin / Manager Login | active | `Server/src/controllers/adminController.js`, `Server/src/services/authService.js`, `Retrop_RMS_App/src/app/login.tsx` |
| Waiter Login | active | `Server/src/controllers/waiterController.js`, `Server/src/services/waiterAuthService.js` |
| Kitchen Login | active | `Server/src/controllers/kitchenController.js`, `Server/src/services/kitchenAuthService.js` |
| JWT Token Refresh | active | `Server/src/routes/routes.js`, `Retrop_RMS_App/src/utils/apiClient.ts` |
| Customer QR Scan → Order Session | active | `Retrop_RMS_Frontend/src/pages/QRLanding/`, `Server/src/services/orderSessionService.js` |
| Customer Info Submission & Privacy Consent | active | `Retrop_RMS_Frontend/src/pages/CustomerInfo/`, `Server/src/services/orderSessionService.js` |
| Waiter Accepts Order Session | active | `Retrop_RMS_App/src/app/waiter/dashboard.tsx`, `Server/src/services/orderSessionService.js` |
| Customer Browses Menu + Cart | active | `Retrop_RMS_Frontend/src/pages/Menu/`, `Retrop_RMS_Frontend/src/pages/Cart/` |
| Customer Places Order | active | `Retrop_RMS_Frontend/src/pages/Cart/`, `Server/src/services/orderSessionService.js` |
| Customer Order Tracking | active | `Retrop_RMS_Frontend/src/pages/OrderTracking/` |
| Customer Modifies Order | active | `Retrop_RMS_Frontend/src/pages/OrderTracking/`, `Server/src/services/orderSessionService.js` |
| Customer Token Re-scan | active | `Retrop_RMS_Frontend/src/pages/QRLanding/`, `Server/src/controllers/customerOrderController.js` |
| Waiter Order Management | active | `Retrop_RMS_App/src/app/waiter/order-detail.tsx` |
| Waiter Concludes Order (Payment) | active | `Retrop_RMS_App/src/app/waiter/order-detail.tsx`, `Server/src/services/orderSessionService.js` |
| Kitchen Dashboard (Kanban) | active | `Retrop_RMS_App/src/app/kitchen/dashboard.tsx` |
| Kitchen Marks Order Ready | active | `Retrop_RMS_App/src/app/kitchen/dashboard.tsx`, `Server/src/services/orderSessionService.js` |
| Kitchen Acknowledges Add-on | active | `Retrop_RMS_App/src/app/kitchen/dashboard.tsx` |
| Push Notifications (FCM) | active | `Server/src/services/notificationService.js` |
| Socket.io Real-time Events | active | `Server/src/services/socketService.js` |
| Manager Dashboard | active | `Retrop_RMS_App/src/app/manager/dashboard.tsx` |
| Restaurant Open / Close Toggle | active | `Retrop_RMS_App/src/app/manager/dashboard.tsx`, `Server/src/controllers/restaurantSettingsController.js` |
| Menu Management | active | `Retrop_RMS_App/src/app/manager/menu.tsx`, `Server/src/services/menuService.js` |
| Menu Image Upload | active | `Server/src/controllers/menuController.js` |
| Waiter Management | active | `Retrop_RMS_App/src/app/manager/waiters.tsx` |
| Kitchen Account Management | active | `Retrop_RMS_App/src/app/manager/kitchen.tsx` |
| Table Management | active | `Retrop_RMS_App/src/app/manager/tables.tsx` |
| Restaurant Info Editor | active | `Retrop_RMS_App/src/app/manager/restaurant-info.tsx` |
| Analytics | active | `Retrop_RMS_App/src/app/manager/analytics.tsx` |
| Bill / Invoice View (Customer) | active | `Retrop_RMS_Frontend/src/pages/ThankYou/` |
| Public Menu Page | active | `Retrop_RMS_Frontend/src/pages/PublicMenu/` |
| Restaurant Website Homepage | active | `Retrop_RMS_Frontend/src/pages/Home/` |
| Restaurant Closed Guard | active | `Retrop_RMS_Frontend/src/App.jsx`, `Server/src/middleware/restaurantOpen.js` |
| Manager Session Inactivity Timeout | active | `Retrop_RMS_App/src/app/manager/_layout.tsx` |
| Discount Application (billing) | active | `Server/src/services/orderSessionService.js` |
| Tax Calculation (inclusive/exclusive) | active | `Server/src/services/orderSessionService.js` |
| Locked Items (malpractice guard) | active | `Server/src/services/orderSessionService.js` |
| Invoice Number Generation | active | `Server/src/services/orderSessionService.js` |
| Frontend Product Key Error Guard | active | `Retrop_RMS_Frontend/src/services/api.js` |
| Owner Portal Auth & Reset Password | active | `Retrop_Website/src/pages/Login.jsx`, `Server/src/controllers/ownerController.js` |
| Unified Staff Aggregation & Registry | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/staffController.js` |
| Inventory & Vendor Profiles CRUD | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/inventoryController.js` |
| BOM Recipe Mapping & Automated COGS | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/services/orderSessionService.js` |
| Expense Logging & Register Day Close | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/expenseController.js` |
| GST Compliance Monthly Exports | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/ownerController.js` |
| Customer Loyalty Points Engine | active | `Server/src/services/orderSessionService.js` |
| Customer Review Feedback | active | `Retrop_RMS_Frontend/src/pages/ThankYou/`, `Server/src/routes/routes.js` |
| Request Validation Layer (Zod) | active | `Server/src/middleware/validate.js` |
| Owner Menu Management | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/menuController.js` |
| Owner Restaurant Settings & Info Config | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/restaurantInfoController.js` |
| Owner Dashboard Analytics | active | `Retrop_Website/src/pages/Dashboard.jsx`, `Server/src/controllers/managerController.js` |
| Self-Service Portal User Signup & OTP Verification | active | `Retrop_Website/src/pages/Signup.jsx`, `Server/src/controllers/portalAuthController.js` |
| Portal User Forgot & Reset Password | active | `Retrop_Website/src/pages/ForgotPassword.jsx`, `Server/src/controllers/portalAuthController.js` |
| Google OAuth Single Sign-On | active | `Retrop_Website/src/pages/Login.jsx`, `Server/src/controllers/portalAuthController.js` |
| Multi-Business Selection & Context Switching | active | `Retrop_Website/src/pages/BusinessSelector.jsx`, `Server/src/controllers/portalAuthController.js` |
| Website Telemetry & Traffic Analytics Engine | active | `Retrop_Website/src/utils/analytics.js`, `Server/src/controllers/analyticsController.js` |
| SuperAdmin Analytics Telemetry Control Panel | active | `Retrop_Admin_Dashboard/src/pages/Analytics.jsx`, `Server/src/controllers/analyticsController.js` |
| Image Upload Security Validation | active | `Server/src/utils/imageSecurity.js` |
| Smart CORS Origin Whitelisting for Vercel | active | `Server/src/index.js` |
| Interactive Documentation & Knowledge Hub | active | `Retrop_Website/src/pages/Docs.jsx`, `Retrop_Website/src/pages/docs/*` |
| Single-Page Application Vercel Deployments | active | `Retrop_Website/vercel.json`, `Retrop_Admin_Dashboard/vercel.json` |

---

## Feature Entries

*(Feature entries 1-53 are documented in V2 and remain active)*

---

### Owner Portal Auth & Reset Password
**Status**: active
**Trigger**: Owner logs in via the Website or performs a first-time password reset.

**Flow**:
1. Owner submits email/mobile and password to `POST /api/owner/auth/login`.
2. `ownerAuthService` loads the record from `retrop_owner`. If `needsPasswordReset = true`, returns code to reset password, redirecting the UI to `/reset-password`.
3. Reset password calls `POST /api/owner/auth/reset-password`, updating the hash, deactivating old sessions, and enabling normal login.
4. Normal login returns access (8h) and refresh (30d) tokens, writing a session row in `retrop_owner_session`.
5. Downstream requests include the `Authorization: Bearer` token verified via `ownerAuthMiddleware`.

**Related Files**:
- `Retrop_Website/src/pages/Login.jsx`
- `Retrop_Website/src/pages/ResetPassword.jsx`
- `Server/src/controllers/ownerController.js`
- `Server/src/services/ownerAuthService.js`
- `Server/src/middleware/ownerAuth.js`

---

### Unified Staff Aggregation & Registry
**Status**: active
**Trigger**: Owner views or modifies staff lists on the dashboard.

**Flow**:
1. Website dashboard requests `GET /api/owner/staff`.
2. `staffController.getAllStaff` queries 4 tables in parallel: `admin` (role: manager), `waiter`, `kitchen` (chefs), and `retrop_other_staff` (Valets, Cleaners, etc.), returning a unified aggregated structure.
3. Adding staff sends `POST /api/owner/staff` with a payload type. The controller hashes the password and writes a record to the corresponding database table.
4. Deletion (`DELETE /api/owner/staff/:type/:id`) and Password Reset (`PUT /api/owner/staff/:type/:id/password`) resolve the target table using URL path params.

**Related Files**:
- `Retrop_Website/src/pages/Dashboard.jsx`
- `Server/src/controllers/staffController.js`

---

### Inventory & Vendor Profiles CRUD
**Status**: active
**Trigger**: Owner tracks vendors, raw materials, and logged purchases.

**Flow**:
1. Owner manages suppliers under `vendor` table (name, mobile, address, payment terms) via `/api/owner/inventory/vendors`.
2. Owner creates/updates ingredients in `inventory_item` table (name, category, unit, reorderLevel, costPerUnit).
3. Owner logs purchases under `purchase_entry` table (invoiceNo, totalAmount, paymentStatus, paymentMethod, purchaseDate, array of items).
4. On purchase submission, the transaction automatically increments the `currentStock` of the target `inventory_item` and updates its `costPerUnit` to the latest price.

**Related Files**:
- `Retrop_Website/src/pages/Dashboard.jsx`
- `Server/src/controllers/inventoryController.js`

---

### BOM Recipe Mapping & Automated COGS/Gross Profit Tracking
**Status**: active
**Trigger**: Owner saves recipe. Customer order is completed.

**Flow**:
1. Owner saves ingredients BOM map for a dish (saved to `recipe` table with `ingredients` JSON array mapping items to portions).
2. When the waiter concludes the order, `concludeOrder` executes `computeAndStoreCOGS` asynchronously.
3. Resolves recipe parameters for each ordered dish, calculates scale factor (`orderedQty / yieldQuantity`), and multiplies ingredient units by their latest inventory item `costPerUnit`.
4. Saves aggregated total cost into `orders.costOfGoods`, and records `orders.grossProfit = finalAmount - costOfGoods` inside the database.

**Related Files**:
- `Retrop_Website/src/pages/Dashboard.jsx`
- `Server/src/controllers/inventoryController.js`
- `Server/src/services/orderSessionService.js`

---

### Expense Logging & Register Day Close
**Status**: active
**Trigger**: Staff/Owner logs operational expenses or closes out the day's cash register.

**Flow**:
1. Expenses are registered using `/api/owner/expenses` (amount, category, description, paymentMode, date), writing to `expense` table.
2. At the end of the day, `/api/owner/day-close` (or `/api/manager/day-close` on staff app) is fetched.
3. The server computes expected cash: `openingCash` + `cashSales` (Cash-payment completed orders completed today) - `cashExpenses` (Cash-payment expenses logged today).
4. Expects manual cash count (`actualCash`). Submitting locks register in `day_close` table and saves calculated `variance` (actualCash - expectedCash).

**Related Files**:
- `Retrop_Website/src/pages/Dashboard.jsx`
- `Server/src/controllers/expenseController.js`

---

### GST Compliance Monthly Exports
**Status**: active
**Trigger**: Owner exports monthly GSTR reports or maps dish HSN codes.

**Flow**:
1. Owner configures `hsnCode` column on menu items to designate tax codes.
2. `getGstr1Report` collects taxable amounts, CGST, SGST, IGST, invoice metadata, and consumer transaction summaries.
3. `getGstr3bReport` groups tax summaries, inward values, and liabilities.
4. Generates standard JSON exports accessible directly from the Owner Panel.

**Related Files**:
- `Retrop_Website/src/pages/Dashboard.jsx`
- `Server/src/controllers/ownerController.js`

---

### Customer Loyalty Points Engine
**Status**: active
**Trigger**: Waiter completes order.

**Flow**:
1. On payment completion, `awardLoyaltyPoints` determines spent value.
2. Awards 1 loyalty point per ₹100 spent (`Math.floor(finalAmount / 100)`).
3. Inserts or updates `loyalty_points` table, tracking `totalPoints` (redeemable balance) and `lifetimeEarned`.

**Related Files**:
- `Server/src/services/orderSessionService.js`

---

### Customer Review Feedback Collection
**Status**: active
**Trigger**: Customer leaves rating on invoice/thank you page.

**Flow**:
1. Customer submits a feedback form (rating 1-5, comment text) after billing.
2. Form posts to `POST /api/order/:orderId/feedback` (or equivalent route handled by customer order endpoints).
3. Writes a row to `customer_feedback` linked to `ordersId` and customer mobile.

**Related Files**:
- `Retrop_RMS_Frontend/src/pages/ThankYou/`
- `Server/src/routes/routes.js`

---

### Request Validation Layer (Zod)
**Status**: active
**Trigger**: Any guarded Express route receives a payload.

**Flow**:
1. Middleware runs `validate(schemas.someAction)`.
2. Zod executes schema parsing on `req.body`.
3. If payload validation fails, stops execution, intercepts route, and returns HTTP 400 with validation errors formatting.

**Related Files**:
- `Server/src/middleware/validate.js`
- `Server/src/routes/routes.js`

---

### Secure Concluded PDF Download Flow (Redis Temporary Tokens)
**Status**: active
**Trigger**: Waiter concludes order in app; customer scans the printed QR code from an external browser.

**Flow**:
1. When the waiter concludes an order, the server generates a random temporary token stored in Redis under the key `temp_bill_token:[orderId]` with a 10-minute expiration time.
2. The server outputs a concluding link format containing this temporary token.
3. When the customer opens the concluding QR code/link from their phone, the request routes to `GET /api/orders/:orderId/bill-pdf?token=xxx`.
4. The server checks the token parameter against the key stored in Redis. If verified, it bypasses the strict `X-Product-Key` header authentication.
5. This allows customers on external personal devices to download or print their A6 thermal invoice PDF seamlessly.

---

### Google Review Redirect Integration
**Status**: active
**Trigger**: Owner populates their Google Page Review Link in Settings; customer submits a high rating.

**Flow**:
1. The Owner saves their business's Google review URL in the Settings Tab of the Owner Dashboard.
2. On checkout, the customer submits feedback for their order.
3. If the submitted rating is >= 3 stars, the Thank You page prompts a button below the success notice: "Rate us on Google" with the redirect link.

---

### Owner Order Management & Reviews Dashboard
**Status**: active
**Trigger**: Owner navigates to "Orders" or "Reviews" tabs on the Website Dashboard.

**Flow**:
1. The Dashboard retrieves paginated lists from `/api/owner/orders` (filtering by Invoice #, Table #, Status, or Date range) or `/api/owner/reviews`.
2. The Orders panel renders a comprehensive database of sales transaction history, with detailed line-item pop-ups showing dish remarks, quantities, tax breakdowns, discounts, and payment statuses.
3. The Reviews panel lists star ratings and comments left by guests, directly linked to their invoice sheets so the owner can review comments alongside the exact food items served.

---

### Owner Menu Management
**Status**: active
**Trigger**: Owner navigates to "Menu" tab on the Website Dashboard.

**Flow**:
1. The Dashboard fetches all dishes and categories via `GET /api/owner/menu-management` and `/api/owner/menu-management/categories`.
2. The Owner can add new dishes (`POST /api/owner/menu-management`), update existing ones (`PUT /api/owner/menu-management/:dishId`), or delete them (`DELETE /api/owner/menu-management/:dishId`).
3. Individual dishes or entire categories can be toggled on/off for availability dynamically using `/api/owner/menu-management/:dishId/availability` and `/api/owner/menu-management/category/:category/availability`.
4. The Owner can upload or delete dish images stored in the backend server assets via `/api/owner/menu-management/:dishId/image`.

---

### Owner Restaurant Settings & Info Config
**Status**: active
**Trigger**: Owner navigates to "Settings" or "Restaurant Info" tab on the Website Dashboard.

**Flow**:
1. The Dashboard retrieves the restaurant settings, tax configurations (inclusive/exclusive), and Google Review redirect link via `GET /api/owner/restaurant-info`.
2. The Owner can update their profile information, tax flags, active discounts, and the Google review redirect URL via `PUT /api/owner/restaurant-info`.
3. The Owner can also upload or update their custom restaurant logo image (`POST /api/owner/restaurant/logo`), which is uploaded to Supabase storage.

---

### Owner Dashboard Analytics
**Status**: active
**Trigger**: Owner views the Main Dashboard landing page.

**Flow**:
1. The dashboard loads summary statistics including total sales, order count, average order value, total cost of goods sold (COGS), gross profit, profit margin, and customer loyalty totals via `GET /api/owner/dashboard/summary`.
2. Detailed sales reports can be exported as a CSV spreadsheet using `GET /api/owner/dashboard/export`.
3. The dashboard retrieves specific operational and tax metrics via `GET /api/owner/analytics?metrics=taxes` to chart tax summaries.

---

### Self-Service Portal User Signup & OTP Verification
**Status**: active
**Trigger**: A new restaurant owner registers on `Retrop_Website`.

**Flow**:
1. User enters name and email on `/signup` (`Signup.jsx`).
2. Frontend posts to `POST /api/portal/auth/signup/request-otp`. The server generates a 6-digit random code, writes to `portal_otp` with 10-min expiry, and dispatches a verification email via Nodemailer.
3. User enters 6-digit OTP (`POST /api/portal/auth/signup/verify-otp`), marking the OTP as used and email as verified.
4. User sets account password (`POST /api/portal/auth/signup/set-password`), writing the hashed password to `portal_user` and creating an active session in `portal_user_session`.

**Related Files**:
- `Retrop_Website/src/pages/Signup.jsx`
- `Server/src/controllers/portalAuthController.js`
- `Server/src/services/mailer.js`
- `Server/src/migrations/010_portal_users.sql`

---

### Portal User Forgot & Reset Password
**Status**: active
**Trigger**: Portal user forgets password on `/login`.

**Flow**:
1. User requests password reset for email (`POST /api/portal/auth/forgot-password/request-otp`).
2. Server dispatches password reset OTP to user email.
3. User inputs code (`POST /api/portal/auth/forgot-password/verify-otp`) and submits new password (`POST /api/portal/auth/forgot-password/reset`).
4. Server hashes password, updates `portal_user`, and invalidates all prior portal sessions.

**Related Files**:
- `Retrop_Website/src/pages/ForgotPassword.jsx`
- `Server/src/controllers/portalAuthController.js`

---

### Google OAuth Single Sign-On
**Status**: active
**Trigger**: Portal user clicks "Sign in with Google" on website login modal.

**Flow**:
1. Website authenticates user via Google OAuth, obtaining ID token.
2. Posts token to `POST /api/portal/auth/google`.
3. Server verifies token, extracts email/name/googleId, inserts or updates `portal_user`, and returns active JWT tokens.

**Related Files**:
- `Retrop_Website/src/pages/Login.jsx`
- `Server/src/controllers/portalAuthController.js`

---

### Multi-Business Selection & Context Switching
**Status**: active
**Trigger**: Portal user logs in with access to multiple restaurants.

**Flow**:
1. Upon login, `/api/portal/auth/me` returns array of linked businesses from `portal_user_business`.
2. If multiple restaurants exist, user is routed to `/select-business` (`BusinessSelector.jsx`).
3. User selects target restaurant, setting active `restaurantId` in `AuthContext` and attaching it to header/request context for subsequent owner calls.

**Related Files**:
- `Retrop_Website/src/pages/BusinessSelector.jsx`
- `Retrop_Website/src/context/AuthContext.jsx`
- `Server/src/controllers/portalAuthController.js`

---

### Website Telemetry & Traffic Analytics Engine
**Status**: active
**Trigger**: Visitor navigates any page on `Retrop_Website`.

**Flow**:
1. `useAnalytics` hook fires `recordPageView` (`analytics.js`) on route changes, assigning/persisting unique `visitorId` and `sessionId`.
2. Browser sends telemetry payload (`visitorId`, `sessionId`, `pathname`, `device`, `traffic`, `referrer`) to `POST /api/analytics/track`.
3. Server resolves geo location from headers/IP, updating or inserting session record in `website_analytics` table.
4. Active tabs maintain an automated heartbeat interval posting active duration to `POST /api/analytics/heartbeat`. Data is saved to Postgres and synced locally to `.data/website_analytics_backup.json`.

**Related Files**:
- `Retrop_Website/src/hooks/useAnalytics.js`
- `Retrop_Website/src/utils/analytics.js`
- `Server/src/controllers/analyticsController.js`
- `Server/src/services/analyticsService.js`
- `Server/src/migrations/011_website_analytics.sql`

---

### SuperAdmin Analytics Telemetry Control Panel
**Status**: active
**Trigger**: SuperAdmin views "Analytics" tab in `Retrop_Admin_Dashboard`.

**Flow**:
1. Admin panel fetches `/api/analytics/summary`.
2. Controller computes active live visitors, session counts, average session duration, bounce rates, traffic source breakdown, browser/OS/device distributions, and conversion funnel metrics.
3. Renders interactive charts and login audit logs for platform monitoring.

**Related Files**:
- `Retrop_Admin_Dashboard/src/pages/Analytics.jsx`
- `Server/src/controllers/analyticsController.js`
- `Server/src/services/analyticsService.js`

---

### Image Upload Security Validation
**Status**: active
**Trigger**: Owner uploads dish image or restaurant logo.

**Flow**:
1. Request payload is intercepted before writing to storage.
2. `imageSecurity.js` validates image file signature (magic bytes check for JPEG, PNG, WEBP) and verifies extension match.
3. Rejects disguised executable payloads or malformed buffers with HTTP 400 before passing clean image buffer to Supabase.

**Related Files**:
- `Server/src/utils/imageSecurity.js`
- `Server/src/controllers/menuController.js`
- `Server/src/controllers/ownerController.js`

---

### Smart CORS Origin Whitelisting for Vercel
**Status**: active
**Trigger**: Incoming HTTP request reaches backend server.

**Flow**:
1. Middleware inspects `Origin` header.
2. In development (`NODE_ENV !== 'production'`), allows `localhost`, `127.0.0.1`, and `.ngrok-free.app` / `.ngrok.io`.
3. In production, checks dynamic whitelist: `retrop.vercel.app`, `retrop-rms.vercel.app`, `retrop-admin.vercel.app`, any domain matching `*.vercel.app`, and explicit `ALLOWED_ORIGINS` environment values.

**Related Files**:
- `Server/src/index.js`

---

### Interactive Documentation & Knowledge Hub
**Status**: active
**Trigger**: User opens `/docs` on `Retrop_Website`.

**Flow**:
1. Displays interactive documentation navigation shell (`DocsLayout.jsx`, `DocsSidebar.jsx`).
2. Renders structured manuals for RMS Overview (`RMSOverview.jsx`), Mobile App Setup (`RMSApp.jsx`), Customer QR Ordering (`RMSOrdering.jsx`), and Owner Portal (`RMSPortal.jsx`).

**Related Files**:
- `Retrop_Website/src/pages/Docs.jsx`
- `Retrop_Website/src/pages/docs/*`
- `Retrop_Website/src/components/DocsLayout.jsx`

---

### Single-Page Application Vercel Deployments
**Status**: active
**Trigger**: Application is deployed to Vercel.

**Flow**:
1. Root `vercel.json` rewrite rule catches all incoming client route paths (`/(.*)`).
2. Rewrites request to `/index.html`, allowing React Router DOM client routing to resolve pages seamlessly without 404 response codes on hard refresh.

**Related Files**:
- `Retrop_Website/vercel.json`
- `Retrop_Admin_Dashboard/vercel.json`
- `Retrop_RMS_Frontend/vercel.json`

---

## How AI agents should update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **Add a new Feature Entry for every new user-facing or system feature added.** Copy the entry template structure.
> 2. **Update the Feature Index table** whenever a new feature entry is added or changed.
> 3. **Update the "Last Updated" line** at the top after any change.
