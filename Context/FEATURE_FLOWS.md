# Feature Flows

## Last Updated
2026-07-10 | Updated by: Antigravity AI Agent (Gemini 3.5 Flash)

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
| Customer Info Submission | active | `Retrop_RMS_Frontend/src/pages/CustomerInfo/`, `Server/src/services/orderSessionService.js` |
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

---

## Feature Entries

*(Feature entries 1-53 are documented in V2 and remain active. The primary V3 additions are below)*

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

## How AI agents should update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **Add a new Feature Entry for every new user-facing or system feature added.** Copy the entry template structure.
> 2. **Update the Feature Index table** whenever a new feature entry is added or changed.
> 3. **Update the "Last Updated" line** at the top after any change.
