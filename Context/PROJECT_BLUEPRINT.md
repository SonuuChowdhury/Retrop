# Project Blueprint

## Last Updated
2026-07-10 | Updated by: Antigravity AI Agent (Gemini 3.5 Flash)

---

## Project Overview

This is **Retrop** — a **Multi-Tenant Restaurant Automation SaaS Platform** that digitises the dine-in experience for **multiple restaurants concurrently** from a **single shared server**. Each restaurant is identified by a `restaurantId` and is issued a unique **Product Key** (`RETROP-XXXX-XXXX-XXXX`) which must be sent via `X-Product-Key` header on every restaurant-facing API call. The server uses an **AsyncLocalStorage-based Supabase Proxy** and **tenant-scoped Redis keys** to automatically isolate all data per restaurant.

The ecosystem has **five surfaces**:

1. **Retrop_RMS_Frontend** — Customer-facing React Vite SPA (customers scan QR → order → track).
2. **Retrop_RMS_App** — Cross-platform Expo / React Native mobile app for restaurant staff (Manager, Waiter, Kitchen roles).
3. **Retrop_Admin_Dashboard** — Retrop SuperAdmin React Vite SPA for client onboarding, subscription management, billing, and product key generation.
4. **Retrop_Website** — Restaurant Owner Portal & Homepage. Provides public landing homepage, login & reset-password flow, and owner dashboard panel.
5. **Server** — Unified Node.js / Express backend with Socket.io powering all surfaces.

The platform includes a **Retrop SuperAdmin control plane** (`/api/retrop/*`) for restaurant onboarding, admin CRUD, product key lifecycle, pricing plans, subscription billing (with automated cron-based renewal/grace/suspension), PDF invoice generation, and email dispatch (welcome, credentials, invoices, renewal reminders, suspension notices).

The platform also includes a **Restaurant Owner control plane** (`/api/owner/*`) for back-office business management (BOM inventory, supplier tracking, purchases, unified staff custom roles, expense tracking, daily cash closeout registry, GST compliance GSTR-1/3B reporting, and customer loyalty/feedback tracking).

---

## Tech Stack

| Layer | Technology | Version (from package.json) | Notes |
|---|---|---|---|
| **Backend runtime** | Node.js | unspecified (ESM modules) | `"type": "module"` in package.json |
| **Backend framework** | Express | ^5.2.1 | Express 5 (RC) |
| **Backend language** | JavaScript (ES Modules) | — | No TypeScript on backend |
| **Database** | Supabase (PostgreSQL) | @supabase/supabase-js ^2.106.1 | Hosted Postgres via Supabase |
| **Cache / session store** | Redis | redis ^6.0.0 | Session cache, FCM tokens, daily counters |
| **Real-time** | Socket.io | socket.io ^4.8.3 | Server-side |
| **Authentication** | JWT (jsonwebtoken) | ^9.0.3 | Access/refresh tokens for admins, waiters, kitchen, and owners |
| **Validation** | Zod | ^4.4.3 | Data schema validation middleware |
| **Password hashing** | bcryptjs | ^3.0.3 | Salt rounds: 10 |
| **Push notifications** | Firebase Admin SDK | firebase-admin ^13.10.0 | FCM for waiter + kitchen devices |
| **Security** | Helmet | ^8.2.0 | HTTP headers hardening |
| **Rate limiting** | express-rate-limit | ^8.5.2 | Per-route limits defined in constants.js |
| **PDF generation** | PDFKit | ^0.19.1 | Retrop subscription invoices |
| **QR code generation** | qrcode | ^1.5.4 | Setup QR codes for app config |
| **ECIES encryption** | eciesjs | ^0.5.0 | Encrypts server URL + product key for app setup QR |
| **Email** | Nodemailer | ^9.0.1 | Gmail SMTP |
| **Cron scheduler** | node-cron | ^4.5.0 | Daily billing cycle checks at midnight |
| **Dev server** | nodemon | ^3.1.14 | Watch mode for backend |
| **Mobile app framework** | Expo | ~56.0.12 | Managed workflow |
| **Mobile routing** | expo-router | ~56.2.11 | File-based routing |
| **Mobile language** | TypeScript | ~6.0.3 | App only |
| **Mobile UI** | React Native | 0.85.3 | — |
| **Mobile animations** | react-native-reanimated | 4.3.1 | — |
| **Mobile storage (secure)** | expo-secure-store | ~56.0.4 | JWT token storage |
| **Mobile storage (async)** | @react-native-async-storage/async-storage | 2.2.0 | Server URL + product key config |
| **Mobile notifications** | expo-notifications | ~56.0.18 | Expo push + FCM token |
| **Mobile socket client** | socket.io-client | ^4.8.3 | Waiter, kitchen, manager real-time |
| **Mobile camera** | expo-camera | ~56.0.8 | QR code scanning for app setup |
| **Mobile PDF/sharing** | expo-print + expo-sharing | ~56.0.4 / ~56.0.18 | Bill PDF generation and sharing |
| **Mobile ECIES** | eciesjs | ^0.5.0 | Decrypts setup QR payload on device |
| **Customer frontend** | React | ^18.3.1 | Vite SPA |
| **Customer bundler** | Vite | ^5.4.1 | Port 5173 |
| **Customer routing** | react-router-dom | ^6.26.0 | Client-side SPA routing |
| **Customer animations** | framer-motion | ^11.3.31 | — |
| **Customer icons** | lucide-react | ^0.441.0 | — |
| **Customer socket client** | socket.io-client | ^4.8.3 | Customer order tracking |
| **Admin Dashboard** | React | ^19.2.6 | Vite SPA |
| **Admin Dashboard bundler** | Vite | ^8.0.12 | — |
| **Admin Dashboard routing** | react-router-dom | ^7.18.0 | — |
| **Admin Dashboard icons** | lucide-react | ^1.21.0 | — |
| **Owner Website** | React | ^19.2.7 | Vite SPA |
| **Owner Website bundler** | Vite | ^8.1.1 | Port 5180 |
| **Owner Website routing** | react-router-dom | ^7.18.1 | — |
| **Owner Website icons** | lucide-react | ^1.23.0 | — |
| **EAS (Expo build)** | EAS | projectId in app.json | Retrop_RMS_App/eas.json |

---

## Repository Structure

```
Resturant-Automation/
├── Context/                          ← Authoritative AI context files
│   ├── PROJECT_BLUEPRINT.md
│   ├── FEATURE_FLOWS.md
│   └── AGENT_MEMORY_LOG.md
│
├── Assets/                           ← Shared assets (logos, etc.)
│
├── Retrop_RMS_App/                   ← Cross-platform Expo / React Native mobile app
│   ├── app.json                      ← Expo config (name, slug, plugins, EAS projectId)
│   ├── eas.json                      ← EAS build profiles
│   ├── package.json                  ← App dependencies
│   ├── tsconfig.json                 ← TypeScript config
│   ├── eslint.config.js              ← ESLint config
│   ├── src/
│   │   ├── app/                      ← expo-router file-based screens
│   │   │   ├── _layout.tsx           ← Root layout: initialises API URL, wraps context providers
│   │   │   ├── index.tsx             ← Landing / role-select / auto-redirect / setup
│   │   │   ├── login.tsx             ← Unified login screen (Manager / Waiter / Kitchen tabs)
│   │   │   ├── manager/             ← Manager screens
│   │   │   │   ├── _layout.tsx       ← Manager tab bar + socket + inactivity timeout
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── waiters.tsx
│   │   │   │   ├── kitchen.tsx
│   │   │   │   ├── menu.tsx
│   │   │   │   ├── tables.tsx
│   │   │   │   ├── analytics.tsx
│   │   │   │   └── restaurant-info.tsx
│   │   │   ├── waiter/              ← Waiter screens
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── active-orders.tsx
│   │   │   │   └── order-detail.tsx
│   │   │   └── kitchen/             ← Kitchen screens
│   │   │       ├── _layout.tsx
│   │   │       └── dashboard.tsx     ← Horizontal Kanban (Queue → Preparing → Ready → Serving)
│   │   ├── components/              ← Shared UI components
│   │   ├── config/
│   │   │   └── api.ts               ← Endpoint definitions + dynamic server URL + product key logic
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       ← Manager JWT state
│   │   │   ├── WaiterAuthContext.tsx
│   │   │   ├── KitchenAuthContext.tsx
│   │   │   ├── DialogContext.tsx     ← Global dialog/alert state
│   │   │   └── ThemeContext.tsx      ← Light/dark theme
│   │   └── services/
│   │       ├── authService.ts       ← Manager login/refresh API calls
│   │       └── notificationService.ts ← Expo FCM token + notification listeners
│   
├── Retrop_RMS_Frontend/             ← Customer-facing React Vite SPA
│   ├── index.html                   ← Vite HTML entry
│   ├── vite.config.js               ← Vite config + QR-code-on-start plugin
│   ├── package.json
│   └── src/
│       ├── main.jsx                 ← React DOM entry
│       ├── App.jsx                  ← Root router
│       ├── context/
│       │   └── OrderContext.jsx     ← Global cart + session state
│       ├── pages/
│       │   ├── Home/               ← Main restaurant website homepage
│       │   ├── QRLanding/          ← QR scan entry; creates order session
│       │   ├── CustomerInfo/       ← Customer enters name + mobile
│       │   ├── WaitingWaiter/      ← Polls until waiter accepts
│       │   ├── Menu/               ← Browse and add items
│       │   ├── Cart/               ← Review cart before placing
│       │   ├── OrderTracking/      ← Live order status after placing
│       │   ├── ThankYou/           ← Final bill page (/bill/:orderId)
│       │   ├── PublicMenu/         ← Read-only public menu at /menu
│       │   └── NotFound/           ← 404 page
│       └── services/
│           └── api.js              ← Customer-facing API calls (sends X-Product-Key header)
│
├── Retrop_Admin_Dashboard/          ← Retrop SuperAdmin React Vite SPA
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  ← Root router
│       ├── components/
│       │   └── Layout.jsx           ← Sidebar layout with nav
│       └── pages/
│           ├── Login.jsx            ← Retrop admin login
│           ├── Dashboard.jsx        ← Stats overview (restaurants, revenue, subscriptions)
│           ├── Restaurants.jsx      ← Restaurant CRUD listing
│           ├── RestaurantDetails.jsx← Single restaurant management (admins, keys, subscription, billing)
│           ├── Settings.jsx         ← Business config + pricing plans management
│           └── Transactions.jsx     ← Global transaction ledger
│
├── Retrop_Website/                  ← Restaurant Owner Portal & General Homepage
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  ← Router & Entry
│       ├── components/
│       │   └── ProtectedRoute.jsx   ← Route guard for owner authentication
│       ├── context/
│       │   └── AuthContext.jsx      ← JWT auth state & theme manager
│       ├── pages/
│       │   ├── Home.jsx             ← General landing page / product showcase
│       │   ├── Login.jsx            ← Owner login screen
│       │   ├── ResetPassword.jsx    ← Forced password reset for new owners
│       │   └── Dashboard.jsx        ← Unified dashboard (overview, inventory, expenses, staff, gst)
│       └── services/
│           └── api.js               ← Owner API wrapper (sends Bearer token)
│
└── Server/                          ← Node.js / Express API server
    ├── package.json
    └── src/
        ├── index.js                 ← Server entry: Express + Socket.io, billing cron, graceful shutdown
        ├── config/
        │   ├── constants.js         ← Server constants, limits, headers
        │   ├── env.js               ← dotenv config
        │   ├── redis.js             ← Redis client + keys (tenant-scoped)
        │   └── supabase.js          ← Supabase AsyncLocalStorage multi-tenant Proxy
        ├── controllers/
        │   ├── adminController.js
        │   ├── customerOrderController.js
        │   ├── expenseController.js  ← Expense entries, day close operations
        │   ├── healthController.js
        │   ├── inventoryController.js← Vendors, items, purchases, recipe mappings
        │   ├── kitchenController.js
        │   ├── managerController.js
        │   ├── menuController.js
        │   ├── ownerController.js    ← Owner portal auth, dashboard analytics, GST reporting, logo upload
        │   ├── restaurantInfoController.js
        │   ├── restaurantSettingsController.js
        │   ├── retropController.js  ← SuperAdmin actions
        │   ├── staffController.js   ← Aggregated staff registry management
        │   └── waiterController.js
        ├── middleware/
        │   ├── auth.js              ← Restaurant Admin JWT validation & role enforcement
        │   ├── ownerAuth.js         ← Owner Portal JWT verification & tenant binding
        │   ├── productKeyAuth.js    ← X-Product-Key validation & tenant context binding
        │   ├── restaurantOpen.js    ← Open status checker
        │   ├── retropAuth.js        ← SuperAdmin auth
        │   ├── security.js          ← Rate limiting, Helmet
        │   ├── validate.js          ← Zod-based request body validation middleware
        │   └── waiterKitchenAuth.js ← Waiter/Kitchen JWT validation
        ├── migrations/
        │   ├── 001_drop_all.sql
        │   ├── 002_fresh_schema.sql
        │   ├── 003_billing_system.sql
        │   ├── 004_custom_billing.sql
        │   ├── 005_taxation_flag.sql
        │   ├── 006_owner_system.sql ← Owner portal tables (retrop_owner, retrop_owner_session)
        │   ├── 007_inventory.sql    ← BOM & Inventory tables (vendor, item, recipe, purchase, adjustment)
        │   └── 008_expense_staff_loyalty_schema.sql ← Expenses, Day close, staff roles, loyalty, customer feedback
        ├── routes/
        │   └── routes.js            ← Unified backend routes map
        ├── services/
        │   ├── authService.js
        │   ├── database.js
        │   ├── invoiceService.js    ← PDFKit invoicing (incorporates isTaxEnabled flag)
        │   ├── kitchenAuthService.js
        │   ├── mailer.js            ← Nodemailer email service
        │   ├── managerService.js
        │   ├── menuService.js
        │   ├── notificationService.js
        │   ├── orderAnalyticsService.js
        │   ├── orderSessionService.js ← ephemereal session logs, lockedItems logic, loyalty rewards
        │   ├── ownerAuthService.js  ← JWT logic for owners
        │   ├── productKeyService.js
        │   ├── restaurantInfoService.js
        │   ├── restaurantSettingsService.js
        │   ├── retropAuthService.js
        │   ├── socketService.js
        │   ├── staffController.js
        │   ├── tableService.js
        │   ├── waiterAuthService.js
        │   └── waiterService.js
        └── utils/
            ├── billingCron.js       ← Subscription checks cron
            ├── crypto.js            ← ECIES logic
            ├── logger.js            ← Winston logger
            └── time.js              ← IST time zones helpers
```

---

## Multi-Tenant Architecture

### How Tenant Isolation Works

1. **Product Key Resolution (Restaurant surfaces)**: Every restaurant-facing request (admin, waiter, kitchen, customer) must include an `X-Product-Key` header. The `productKeyAuth` middleware resolves the key to a `restaurantId` via the `product_key` table (joined with `retrop_restaurant`).

2. **Owner Session Resolution (Owner Portal)**: The Owner Portal does not send a Product Key. Instead, the owner logs in using email or mobile, which retrieves their profile and their linked `restaurantId` from `retrop_restaurant`. The `ownerAuthMiddleware` verifies the owner JWT, determines their `restaurantId`, and automatically attaches it to the request context.

3. **AsyncLocalStorage Context**: Both middlewares call `tenantContext.enterWith({ restaurantId })` where `tenantContext` is a Node.js `AsyncLocalStorage` instance exported from `supabase.js`.

4. **Supabase Proxy Auto-Scoping**: The exported `supabase` client is a **JavaScript Proxy** over the raw Supabase client. For any table in the `tenantTables` list (`admin`, `admin_session`, `waiter`, `waiter_session`, `waiter_daily_stats`, `kitchen`, `kitchen_session`, `manager_session`, `login_attempt`, `restaurant_settings`, `restaurant_info`, `menu`, `restaurant_table`, `customer`, `orders`, `vendor`, `inventory_item`, `purchase_entry`, `recipe`, `stock_adjustment`, `expense`, `day_close`, `retrop_other_staff`, `loyalty_points`, `customer_feedback`), the Proxy:
   - Automatically appends `.eq('restaurantId', store.restaurantId)` to all query methods.
   - Automatically injects `restaurantId` into all `insert()` and `upsert()` payloads.

5. **Redis Key Namespacing**: All `REDIS_KEYS.*` functions include `restaurantId` in the key pattern (e.g., `order_session:{restaurantId}:{tableId}`), preventing cross-restaurant data pollution in the shared Redis instance.

6. **Retrop Control Plane**: Routes under `/api/retrop/*` do NOT use `productKeyAuth`. They use `retropAuth` middleware. These routes access global/control tables (`retrop_restaurant`, `retrop_admin`, `product_key`, etc.) that are not tenant-scoped.

---

## Data Models & Schemas

### SECTION 1: Retrop SaaS Control Tables

#### `retrop_restaurant`
| Field | Type | Notes |
|---|---|---|
| restaurantId | UUID PK | gen_random_uuid() |
| businessName | VARCHAR(255) NOT NULL | — |
| ownerName | VARCHAR(255) NOT NULL | — |
| gender | VARCHAR(20) | CHECK: 'Male', 'Female', 'Other' |
| ownerMobile | VARCHAR(20) NOT NULL | — |
| businessTypeId | VARCHAR(50) FK → business_type | Default: 'restaurant' |
| hasGst | BOOLEAN | Default false |
| gstin | VARCHAR(15) | Restaurant's GSTIN |
| ownerId | UUID FK → retrop_owner | Links restaurant to owner entity (added in 006) |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `product_key`
*(No changes from V2)*

#### `retrop_admin`
*(No changes from V2)*

#### `retrop_admin_session`
*(No changes from V2)*

#### `retrop_business_config`
*(No changes from V2)*

#### `pricing_plan`
*(No changes from V2)*

#### `subscription`
*(No changes from V2)*

#### `transaction`
*(No changes from V2)*

---

### SECTION 2: Restaurant Owner Portal Tables

#### `retrop_owner`
*(Source: `006_owner_system.sql`)*
| Field | Type | Notes |
|---|---|---|
| ownerId | UUID PK | gen_random_uuid() |
| name | VARCHAR(255) NOT NULL | — |
| email | VARCHAR(255) UNIQUE NOT NULL | Login credential |
| mobile | VARCHAR(20) UNIQUE NOT NULL | Login credential |
| password | VARCHAR(255) NOT NULL | Hashed password |
| needsPasswordReset | BOOLEAN | Default true (forces reset on first login) |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `retrop_owner_session`
*(Source: `006_owner_system.sql`)*
| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | gen_random_uuid() |
| ownerId | UUID FK → retrop_owner | ON DELETE CASCADE |
| accessToken | VARCHAR(500) NOT NULL | — |
| refreshToken | VARCHAR(500) | — |
| tokenExpiresAt | TIMESTAMPTZ NOT NULL | 8 hours expiry |
| refreshTokenExpiresAt | TIMESTAMPTZ | 30 days expiry |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

---

### SECTION 3: BOM & Inventory Tables

#### `vendor`
*(Source: `007_inventory.sql`)*
| Field | Type | Notes |
|---|---|---|
| vendorId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| name | VARCHAR(255) NOT NULL | — |
| mobile | VARCHAR(20) | UNIQUE with restaurantId |
| email | VARCHAR(255) | — |
| gstin | VARCHAR(15) | Supplier GSTIN |
| address | TEXT | — |
| paymentTerms | VARCHAR(100) | e.g. "Net 30" |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `inventory_item`
*(Source: `007_inventory.sql`)*
| Field | Type | Notes |
|---|---|---|
| itemId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| name | VARCHAR(255) NOT NULL | UNIQUE with restaurantId |
| unit | VARCHAR(50) NOT NULL | kg, litre, piece, packet, dozen |
| category | VARCHAR(100) | Vegetables, Dairy, Meat, Spices, etc. |
| currentStock | DECIMAL(10,3) | Default 0.000 |
| reorderLevel | DECIMAL(10,3) | Default 0.000 |
| costPerUnit | DECIMAL(10,2) | Default 0.00 (last purchase price) |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `purchase_entry`
*(Source: `007_inventory.sql`)*
| Field | Type | Notes |
|---|---|---|
| purchaseId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| vendorId | UUID FK → vendor | ON DELETE SET NULL |
| invoiceNo | VARCHAR(100) | Vendor invoice identifier |
| items | JSONB NOT NULL | `[{itemId, quantity, unitPrice, totalPrice}]` |
| totalAmount | DECIMAL(10,2) NOT NULL | — |
| paymentStatus | VARCHAR(30) | CHECK: 'paid', 'unpaid', 'partial' |
| paymentMethod | VARCHAR(30) | UPI, Cash, Card, Bank Transfer |
| purchaseDate | DATE NOT NULL | — |
| notes | TEXT | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `recipe`
*(Source: `007_inventory.sql`)*
| Field | Type | Notes |
|---|---|---|
| recipeId | UUID PK | gen_random_uuid() |
| dishId | UUID FK → menu | UNIQUE with restaurantId |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| ingredients | JSONB NOT NULL | `[{itemId, itemName, quantity, unit}]` |
| yieldQuantity | DECIMAL(10,2) | Portions yield per recipe run |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `stock_adjustment`
*(Source: `007_inventory.sql`)*
| Field | Type | Notes |
|---|---|---|
| adjustmentId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| itemId | UUID FK → inventory_item | ON DELETE CASCADE |
| type | VARCHAR(30) NOT NULL | CHECK: 'wastage', 'theft', 'damage', 'correction', 'opening_stock' |
| quantity | DECIMAL(10,3) NOT NULL | Positive to add, negative to deduct |
| reason | TEXT | — |
| adjustedBy | UUID | adminId who executed the adjustment |
| createdAt | TIMESTAMPTZ | — |

---

### SECTION 4: Expense & Cash Register Tables

#### `expense`
*(Source: `008_expense_staff_loyalty_schema.sql`)*
| Field | Type | Notes |
|---|---|---|
| expenseId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| amount | DECIMAL(10,2) NOT NULL | — |
| category | VARCHAR(100) NOT NULL | Rent, Utilities, Ingredients, Salaries, Maintenance, Other |
| description | TEXT | — |
| paymentMode | VARCHAR(50) | Cash, UPI, Card, Bank Transfer |
| receiptUrl | VARCHAR(500) | — |
| expenseDate | DATE NOT NULL | — |
| createdBy | UUID FK → admin | ON DELETE SET NULL |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `day_close`
*(Source: `008_expense_staff_loyalty_schema.sql`)*
| Field | Type | Notes |
|---|---|---|
| closeId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| closeDate | DATE NOT NULL | UNIQUE with restaurantId |
| openingCash | DECIMAL(10,2) NOT NULL | Cash in drawer at start of day |
| cashSales | DECIMAL(10,2) NOT NULL | Aggregated from completed Cash orders |
| cashExpenses | DECIMAL(10,2) NOT NULL | Aggregated from cash expenses of the day |
| expectedCash | DECIMAL(10,2) NOT NULL | openingCash + cashSales - cashExpenses |
| actualCash | DECIMAL(10,2) NOT NULL | Cash counted manually by staff |
| variance | DECIMAL(10,2) NOT NULL | actualCash - expectedCash |
| notes | TEXT | — |
| closedBy | UUID FK → admin | ON DELETE SET NULL |
| createdAt | TIMESTAMPTZ | — |

---

### SECTION 5: Unified Staff, Loyalty & Reviews Tables

#### `retrop_other_staff`
*(Source: `008_expense_staff_loyalty_schema.sql`)*
| Field | Type | Notes |
|---|---|---|
| staffId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| name | VARCHAR(255) NOT NULL | — |
| mobile | VARCHAR(20) NOT NULL | UNIQUE with restaurantId |
| password | VARCHAR(255) NOT NULL | Hashed password |
| role | VARCHAR(100) NOT NULL | e.g. Cashier, Storekeeper, Cleaner, Valet |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `loyalty_points`
*(Source: `008_expense_staff_loyalty_schema.sql`)*
| Field | Type | Notes |
|---|---|---|
| pointId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| mobile | VARCHAR(20) NOT NULL | UNIQUE with restaurantId |
| totalPoints | INTEGER | Current points available for redemption |
| lifetimeEarned | INTEGER | Total points earned historically |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `customer_feedback`
*(Source: `008_expense_staff_loyalty_schema.sql`)*
| Field | Type | Notes |
|---|---|---|
| feedbackId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| orderId | UUID FK → orders | ON DELETE SET NULL |
| mobile | VARCHAR(20) NOT NULL | Customer mobile identifier |
| rating | SMALLINT NOT NULL | rating CHECK: between 1 and 5 |
| comment | TEXT | Customer feedback text |
| createdAt | TIMESTAMPTZ | — |

---

### SECTION 6: Modified Tenant Tables

#### `orders` (Enhanced with COGS & Profitability columns)
- `costOfGoods`: `DECIMAL(10,2)` (calculated from recipe mappings on completion)
- `grossProfit`: `DECIMAL(10,2)` (`finalAmount - costOfGoods`)

#### `menu` (Enhanced with HSN code column)
- `hsnCode`: `VARCHAR(20)` (Harmonized System Nomenclature code for tax compliance)

#### `restaurant_info` (Enhanced with settings columns)
- `gstChangedAt`: `TIMESTAMP WITH TIME ZONE`
- `logoUrl`: `VARCHAR(500)` (restaurant logo stored in Supabase)

---

## API Surface

### Owner Portal Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/owner/auth/login` | Open (Zod-validated) | Body: `{loginIdentifier, password}` |
| POST | `/api/owner/auth/reset-password` | Open (Zod-validated) | Body: `{ownerId, newPassword}` |
| POST | `/api/owner/auth/refresh` | Open | Body: `{refreshToken}` |
| POST | `/api/owner/auth/logout` | JWT-Owner | Invalidates owner session |
| GET | `/api/owner/auth/me` | JWT-Owner | Returns owner profile + restaurant mapping |

### Owner Portal Dashboard & General Operations

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/owner/dashboard/summary` | JWT-Owner | Sales, profit margin, top dishes, loyalty points stats |
| GET | `/api/owner/dashboard/export` | JWT-Owner | Export sales ledger report |
| POST | `/api/owner/restaurant/logo` | JWT-Owner | Upload restaurant logo (saves in Supabase) |

### Owner Portal Manager control

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/owner/managers` | JWT-Owner | Lists managers and owners |
| POST | `/api/owner/managers` | JWT-Owner (Zod-validated) | Create manager profile |
| DELETE | `/api/owner/managers/:adminId` | JWT-Owner | Remove manager profile |
| PUT | `/api/owner/managers/:adminId/password` | JWT-Owner (Zod-validated) | Update manager password |

### Owner Portal Inventory & BOM CRUD

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/owner/menu` | JWT-Owner | Get all menu items with category/price |
| GET | `/api/owner/inventory/vendors` | JWT-Owner | List all suppliers |
| POST | `/api/owner/inventory/vendors` | JWT-Owner (Zod-validated) | Create vendor profile |
| PUT | `/api/owner/inventory/vendors/:vendorId` | JWT-Owner (Zod-validated) | Edit vendor info |
| DELETE | `/api/owner/inventory/vendors/:vendorId` | JWT-Owner | Delete supplier profile |
| GET | `/api/owner/inventory/items` | JWT-Owner | List ingredients (unit, stock levels) |
| POST | `/api/owner/inventory/items` | JWT-Owner (Zod-validated) | Create stock item |
| PUT | `/api/owner/inventory/items/:itemId` | JWT-Owner (Zod-validated) | Edit stock item |
| DELETE | `/api/owner/inventory/items/:itemId` | JWT-Owner | Delete stock item |
| GET | `/api/owner/inventory/recipes` | JWT-Owner | Retrieve BOM recipes |
| POST | `/api/owner/inventory/recipes` | JWT-Owner (Zod-validated) | Save/Update BOM mapping |
| DELETE | `/api/owner/inventory/recipes/:dishId` | JWT-Owner | Delete recipe |
| GET | `/api/owner/inventory/purchases` | JWT-Owner | List logged purchases |
| POST | `/api/owner/inventory/purchases` | JWT-Owner (Zod-validated) | Log new purchase invoice (adds stock) |

### GST Compliance Reports

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/owner/gst/gstr1` | JWT-Owner | Fetch GSTR-1 compliance JSON |
| GET | `/api/owner/gst/gstr3b` | JWT-Owner | Fetch GSTR-3B compliance JSON |
| PUT | `/api/owner/menu/:dishId/hsn` | JWT-Owner | Update HSN/SAC code of a dish |

### Unified Staff Aggregator

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/owner/staff` | JWT-Owner | Returns aggregated lists: managers, waiters, chefs, others |
| POST | `/api/owner/staff` | JWT-Owner (Zod-validated) | Add staff (creates rows in admin, waiter, kitchen, or other_staff) |
| DELETE | `/api/owner/staff/:type/:id` | JWT-Owner | Remove staff from appropriate table |
| PUT | `/api/owner/staff/:type/:id/password` | JWT-Owner (Zod-validated) | Reset password for any staff |

### Expenses & Register Close (Owner Portal)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/owner/expenses` | JWT-Owner | List logged expenses |
| POST | `/api/owner/expenses` | JWT-Owner (Zod-validated) | Log expense item |
| DELETE | `/api/owner/expenses/:expenseId` | JWT-Owner | Delete expense item |
| GET | `/api/owner/day-close` | JWT-Owner | Get day close details (variance, cash calculations) |
| POST | `/api/owner/day-close` | JWT-Owner (Zod-validated) | Log day close register (locks Cash Drawer) |

### Expenses & Register Close (Manager/Staff Portal)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/expenses` | PK + JWT-Admin | View logged expenses |
| POST | `/api/manager/expenses` | PK + JWT-Admin (Zod-validated) | Log daily expense item |
| DELETE | `/api/manager/expenses/:expenseId` | PK + JWT-Admin | Delete expense |
| GET | `/api/manager/day-close` | PK + JWT-Admin | View cash registers close state |
| POST | `/api/manager/day-close` | PK + JWT-Admin (Zod-validated) | Submit daily cash close register |

---

## Environment & Infrastructure

### Backend Environment Variables

The backend relies on the following environment variables (defined in `Server/.env`):

| Variable | Purpose |
|---|---|
| `OWNER_JWT_SECRET` | Secret for owner portal access tokens |
| `OWNER_JWT_REFRESH_SECRET` | Secret for owner portal refresh tokens |

*(All other environment variables from Retrop V2 are active)*

### Website Frontend Environment Variables

Configure `Retrop_Website/.env` with:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Live backend URL (updated dynamically by `dev.py`) |

---

## Known Constraints & Technical Debt

- **Invoice storage bucket reuse**: PDF Invoices share the `menu-images` public bucket. In a production SaaS setup, invoices should be moved to a private bucket (`invoices`) with restricted read policies.
- **Unified Staff Deletion**: Deleting staff profiles from `retrop_other_staff`, `waiter`, `kitchen`, or `admin` tables is immediate. Active sessions should be cleaned up alongside staff deletion.
- **Export Formats**: GSTR-1 and GSTR-3B are generated as JSON payloads. Exporters for Excel (XLSX) or Government Utility spreadsheets would improve utility.
