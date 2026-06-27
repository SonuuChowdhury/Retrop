# Project Blueprint

## Last Updated
2026-06-27 | Updated by: Antigravity AI Agent (Claude Opus 4.6 Thinking)

---

## Project Overview

This is **Retrop** — a **Multi-Tenant Restaurant Automation SaaS Platform** that digitises the dine-in experience for **multiple restaurants concurrently** from a **single shared server**. Each restaurant is identified by a `restaurantId` and is issued a unique **Product Key** (`RETROP-XXXX-XXXX-XXXX`) which must be sent via `X-Product-Key` header on every restaurant-facing API call. The server uses an **AsyncLocalStorage-based Supabase Proxy** and **tenant-scoped Redis keys** to automatically isolate all data per restaurant.

The ecosystem has **four surfaces**:

1. **Retrop_RMS_Frontend** — Customer-facing React Vite SPA (customers scan QR → order → track).
2. **Retrop_RMS_App** — Cross-platform Expo / React Native mobile app for restaurant staff (Manager, Waiter, Kitchen roles).
3. **Retrop_Admin_Dashboard** — Retrop SuperAdmin React Vite SPA for client onboarding, subscription management, billing, and product key generation.
4. **Server** — Unified Node.js / Express backend with Socket.io powering all surfaces.

The platform includes a **Retrop SuperAdmin control plane** (`/api/retrop/*`) for restaurant onboarding, admin CRUD, product key lifecycle, pricing plans, subscription billing (with automated cron-based renewal/grace/suspension), PDF invoice generation, and email dispatch (welcome, credentials, invoices, renewal reminders, suspension notices).

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
| **Authentication** | JWT (jsonwebtoken) | ^9.0.3 | Restaurant admin: 15 min access / 7 day refresh; Retrop admin: 8 h access / 30 day refresh |
| **Password hashing** | bcryptjs | ^3.0.3 | Salt rounds: 10 |
| **Push notifications** | Firebase Admin SDK | firebase-admin ^13.10.0 | FCM for waiter + kitchen devices |
| **Security** | Helmet | ^8.2.0 | HTTP headers hardening |
| **Rate limiting** | express-rate-limit | ^8.5.2 | Per-route limits defined in constants.js |
| **PDF generation** | PDFKit | ^0.19.1 | Retrop subscription invoices |
| **QR code generation** | qrcode | ^1.5.4 | Setup QR codes for app config |
| **ECIES encryption** | eciesjs | ^0.5.0 | Encrypts server URL + product key for app setup QR |
| **Email** | Nodemailer | ^9.0.1 | Gmail SMTP (welcome, invoice, credentials, renewal, suspension emails) |
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
| **EAS (Expo build)** | EAS | projectId in app.json | Retrop_RMS_App/eas.json |

---

## Repository Structure

```
Resturant-Automation/
├── Context/                          ← This folder — authoritative AI context files
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
│   ├── global.d.ts                   ← Global type declarations
│   ├── IMPLEMENTATION_SUMMARY.md     ← Developer change log
│   ├── assets/                       ← Icons, splash images
│   ├── scripts/                      ← reset-project.js utility
│   └── src/
│       ├── app/                      ← expo-router file-based screens
│       │   ├── _layout.tsx           ← Root layout: initialises API URL, wraps context providers
│       │   ├── index.tsx             ← Landing / role-select / auto-redirect / setup
│       │   ├── login.tsx             ← Unified login screen (Manager / Waiter / Kitchen tabs)
│       │   ├── explore.tsx           ← (Expo starter screen, unused in production)
│       │   ├── manager/             ← Manager screens (auth-guarded, socket-connected)
│       │   │   ├── _layout.tsx       ← Manager tab bar + socket + inactivity timeout
│       │   │   ├── dashboard.tsx
│       │   │   ├── waiters.tsx
│       │   │   ├── kitchen.tsx
│       │   │   ├── menu.tsx
│       │   │   ├── tables.tsx
│       │   │   ├── analytics.tsx
│       │   │   └── restaurant-info.tsx
│       │   ├── waiter/              ← Waiter screens (auth-guarded)
│       │   │   ├── _layout.tsx
│       │   │   ├── dashboard.tsx
│       │   │   ├── active-orders.tsx
│       │   │   └── order-detail.tsx
│       │   └── kitchen/             ← Kitchen screens (auth-guarded)
│       │       ├── _layout.tsx
│       │       └── dashboard.tsx     ← Horizontal Kanban (Queue → Preparing → Ready → Serving)
│       ├── components/              ← Shared UI components
│       │   ├── AppSettingsModal.tsx  ← Server URL + Product Key + QR scan config modal
│       │   ├── AppDialog.tsx        ← Custom dialog component
│       │   ├── ScreenAnimationWrapper.tsx
│       │   ├── SkeletonLoader/
│       │   ├── animated-icon.tsx / .web.tsx
│       │   ├── app-tabs.tsx / .web.tsx
│       │   ├── ui/
│       │   └── ...
│       ├── config/
│       │   └── api.ts               ← Endpoint definitions + dynamic server URL + product key logic
│       ├── constants/               ← App-level constants
│       ├── context/
│       │   ├── AuthContext.tsx       ← Manager JWT state
│       │   ├── WaiterAuthContext.tsx
│       │   ├── KitchenAuthContext.tsx
│       │   ├── DialogContext.tsx     ← Global dialog/alert state
│       │   └── ThemeContext.tsx      ← Light/dark theme
│       ├── hooks/
│       │   ├── use-color-scheme.ts / .web.ts
│       │   └── use-theme.ts
│       ├── services/
│       │   ├── authService.ts       ← Manager login/refresh API calls
│       │   └── notificationService.ts ← Expo FCM token + notification listeners
│       └── utils/
│           ├── apiClient.ts         ← fetch wrapper with auto-refresh + disabled-account handling
│           ├── socket.ts            ← Singleton Socket.io client
│           ├── storage.ts           ← TokenStorage, WaiterStorage, KitchenStorage (SecureStore)
│           └── serverUrlStorage.ts  ← AsyncStorage server URL persistence
│
├── Retrop_RMS_Frontend/             ← Customer-facing React Vite SPA
│   ├── .env / .env.example          ← VITE_API_URL, VITE_PRODUCT_KEY
│   ├── index.html                   ← Vite HTML entry
│   ├── vite.config.js               ← Vite config + QR-code-on-start plugin
│   ├── INTEGRATION_GUIDE.md
│   ├── package.json
│   └── src/
│       ├── main.jsx                 ← React DOM entry
│       ├── App.jsx                  ← Root router (website flow + customer order flow)
│       ├── assets/
│       ├── components/             ← Shared UI components
│       │   ├── BillView/            ← Bill / invoice display
│       │   ├── CartDrawer/          ← Slide-out cart
│       │   ├── Contact/
│       │   ├── ErrorScreen/
│       │   ├── Footer/
│       │   ├── Hero/
│       │   ├── Hours/
│       │   ├── Loader/
│       │   ├── LoadingSpinner/
│       │   ├── Location/
│       │   ├── MenuCard/
│       │   ├── Navbar/
│       │   ├── OrderOnline/
│       │   ├── SignatureDishes/
│       │   ├── Skeleton/
│       │   └── StatusBar/
│       ├── context/
│       │   └── OrderContext.jsx     ← Global cart + session state (sessionStorage-persisted)
│       ├── hooks/
│       │   └── useRestaurantData.js ← Loads public/data.json for website content
│       ├── pages/
│       │   ├── Home/               ← Main restaurant website homepage
│       │   ├── QRLanding/          ← Step 1: QR scan entry; creates order session
│       │   ├── CustomerInfo/       ← Step 2: Customer enters name + mobile
│       │   ├── WaitingWaiter/      ← Step 3: Polls until waiter accepts
│       │   ├── Menu/               ← Step 4: Browse and add items
│       │   ├── Cart/               ← Step 5: Review cart before placing
│       │   ├── OrderPlaced/        ← Legacy redirect (now OrderTracking)
│       │   ├── OrderTracking/      ← Step 6+: Live order status after placing
│       │   ├── ThankYou/           ← Final bill page (/bill/:orderId)
│       │   ├── PublicMenu/         ← Read-only public menu at /menu
│       │   ├── NotFound/           ← 404 page
│       │   └── components/         ← Page-specific shared components
│       ├── services/
│       │   └── api.js              ← All customer-facing API calls (sends X-Product-Key header)
│       ├── styles/
│       └── utils/
│
├── Retrop_Admin_Dashboard/          ← Retrop SuperAdmin React Vite SPA
│   ├── .env / .env.example          ← VITE_API_URL
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  ← Root router
│       ├── App.css / index.css      ← Styles
│       ├── assets/
│       ├── components/
│       │   ├── Layout.jsx           ← Sidebar layout with nav
│       │   └── SkeletonLoader.jsx
│       ├── context/
│       │   └── DialogContext.jsx     ← Global dialog/alert state
│       ├── pages/
│       │   ├── Login.jsx            ← Retrop admin login
│       │   ├── Dashboard.jsx        ← Stats overview (restaurants, revenue, subscriptions)
│       │   ├── Restaurants.jsx      ← Restaurant CRUD listing
│       │   ├── RestaurantDetails.jsx← Single restaurant management (admins, keys, subscription, billing)
│       │   ├── Settings.jsx         ← Business config + pricing plans management
│       │   └── Transactions.jsx     ← Global transaction ledger
│       └── services/
│           └── api.js               ← All Retrop admin API calls (Bearer auth)
│
└── Server/                          ← Node.js / Express API server
    ├── .env / .env.example          ← All env vars (see Environment section)
    ├── package.json
    ├── scripts/                     ← Utility scripts
    └── src/
        ├── index.js                 ← Server entry: Express + Socket.io setup, billing cron, graceful shutdown
        ├── config/
        │   ├── constants.js         ← SERVER_CONFIG, JWT_CONFIG, RATE_LIMIT_CONFIG, HELMET_CONFIG
        │   ├── env.js               ← dotenv loader (must be imported first)
        │   ├── redis.js             ← Redis client singleton + helper wrappers + REDIS_KEYS (tenant-scoped)
        │   └── supabase.js          ← Supabase client with AsyncLocalStorage multi-tenant Proxy + tenantContext
        ├── controllers/
        │   ├── adminController.js
        │   ├── customerOrderController.js
        │   ├── healthController.js
        │   ├── kitchenController.js
        │   ├── managerController.js
        │   ├── menuController.js
        │   ├── restaurantInfoController.js
        │   ├── restaurantSettingsController.js
        │   ├── retropController.js  ← [NEW] Retrop SuperAdmin: auth, restaurant CRUD, keys, plans, billing, invoices, email
        │   └── waiterController.js
        ├── middleware/
        │   ├── auth.js              ← JWT verification + RBAC (requireRole)
        │   ├── productKeyAuth.js    ← [NEW] X-Product-Key validation + tenantContext binding
        │   ├── restaurantOpen.js    ← Blocks customer routes when restaurant closed
        │   ├── retropAuth.js        ← [NEW] Retrop SuperAdmin JWT middleware
        │   ├── security.js          ← Helmet + general rate limiter
        │   └── waiterKitchenAuth.js ← Separate JWT middleware for waiter + kitchen
        ├── migrations/              ← Ordered SQL migration files (run in Supabase SQL editor)
        │   ├── 001_drop_all.sql     ← Drops all old tables for clean migration
        │   ├── 002_fresh_schema.sql ← Complete multi-tenant schema (replaces old 001-012)
        │   ├── 003_billing_system.sql ← Billing, subscriptions, transactions, pricing plans, business config
        │   ├── 004_custom_billing.sql ← Custom billing cycle + grace period per subscription
        │   └── 005_taxation_flag.sql  ← isTaxEnabled flag on retrop_business_config
        ├── routes/
        │   └── routes.js            ← All route definitions (~292 lines)
        ├── services/
        │   ├── authService.js
        │   ├── database.js
        │   ├── invoiceService.js    ← [NEW] PDF invoice generation (PDFKit) + Supabase Storage upload
        │   ├── kitchenAuthService.js
        │   ├── mailer.js            ← [NEW] Nodemailer email dispatch (welcome, credentials, invoice, renewal, suspension)
        │   ├── managerService.js
        │   ├── menuService.js
        │   ├── notificationService.js ← FCM via Firebase Admin SDK
        │   ├── orderAnalyticsService.js
        │   ├── orderSessionService.js ← Full order lifecycle
        │   ├── productKeyService.js ← [NEW] Product key generation, resolution, toggle
        │   ├── restaurantInfoService.js
        │   ├── restaurantSettingsService.js
        │   ├── retropAuthService.js ← [NEW] Retrop SuperAdmin JWT auth (separate secrets)
        │   ├── socketService.js     ← Socket.io connection handler + session manager
        │   ├── tableService.js
        │   ├── waiterAuthService.js
        │   └── waiterService.js
        ├── utils/
        │   ├── billingCron.js       ← [NEW] node-cron daily subscription lifecycle processor
        │   ├── crypto.js            ← [NEW] ECIES encryption for setup QR payloads
        │   ├── logger.js            ← Winston-style logger
        │   └── time.js              ← nowIST(), todayDateIST(), todayStartIST(), tomorrowStartIST(), daysAgoStartIST(), monthRangeIST()
        └── scripts/
            └── (utility scripts)
```

---

## Multi-Tenant Architecture

### How Tenant Isolation Works

1. **Product Key Resolution**: Every restaurant-facing request must include an `X-Product-Key` header. The `productKeyAuth` middleware resolves the key to a `restaurantId` via the `product_key` table (joined with `retrop_restaurant`).

2. **AsyncLocalStorage Context**: `productKeyAuth` calls `tenantContext.enterWith({ restaurantId })` where `tenantContext` is a Node.js `AsyncLocalStorage` instance exported from `supabase.js`.

3. **Supabase Proxy Auto-Scoping**: The exported `supabase` client is a **JavaScript Proxy** over the raw Supabase client. For any table in the `tenantTables` list (`admin`, `admin_session`, `waiter`, `waiter_session`, `waiter_daily_stats`, `kitchen`, `kitchen_session`, `manager_session`, `login_attempt`, `restaurant_settings`, `restaurant_info`, `menu`, `restaurant_table`, `customer`, `orders`), the Proxy:
   - Automatically appends `.eq('restaurantId', store.restaurantId)` to all query methods.
   - Automatically injects `restaurantId` into all `insert()` and `upsert()` payloads.

4. **Redis Key Namespacing**: All `REDIS_KEYS.*` functions include `restaurantId` in the key pattern (e.g., `order_session:{restaurantId}:{tableId}`), preventing cross-restaurant data pollution in the shared Redis instance.

5. **Retrop Control Plane**: Routes under `/api/retrop/*` do NOT use `productKeyAuth`. They use `retropAuth` middleware (separate JWT secret: `RETROP_JWT_SECRET`). These routes access global/control tables (`retrop_restaurant`, `retrop_admin`, `product_key`, etc.) that are not tenant-scoped.

### Unique Constraints Changed for Multi-Tenancy
- `admin.mobile` → `UNIQUE (restaurantId, mobile)` (same mobile can exist across restaurants)
- `waiter.mobile` → `UNIQUE (restaurantId, mobile)`
- `kitchen.mobile` → `UNIQUE (restaurantId, mobile)`
- `restaurant_table.tableNo` → `UNIQUE (restaurantId, tableNo)`
- `customer` PK → `PRIMARY KEY (mobile, restaurantId)` (composite key)
- `restaurant_settings.restaurantId` → `UNIQUE` (one settings row per restaurant)
- `restaurant_info.restaurantId` → `UNIQUE` (one info row per restaurant)

---

## Data Models & Schemas

All tables reside in **Supabase (PostgreSQL)**. Column names use camelCase quoted identifiers.

### SECTION 1: Retrop SaaS Control Tables

#### `retrop_restaurant`
*(Source: `002_fresh_schema.sql`, `003_billing_system.sql`)*

| Field | Type | Notes |
|---|---|---|
| restaurantId | UUID PK | gen_random_uuid() |
| businessName | VARCHAR(255) NOT NULL | — |
| ownerName | VARCHAR(255) NOT NULL | — |
| gender | VARCHAR(20) | CHECK: 'Male', 'Female', 'Other' |
| ownerMobile | VARCHAR(20) NOT NULL | — |
| businessTypeId | VARCHAR(50) FK → business_type | Default: 'restaurant' (added in 003) |
| hasGst | BOOLEAN | Default false (added in 003) |
| gstin | VARCHAR(15) | Restaurant's GSTIN (added in 003) |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `product_key`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| keyId | UUID PK | gen_random_uuid() |
| keyValue | VARCHAR(50) UNIQUE NOT NULL | Format: `RETROP-XXXX-XXXX-XXXX` |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `retrop_admin`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| adminId | UUID PK | gen_random_uuid() |
| name | VARCHAR(255) NOT NULL | — |
| email | VARCHAR(255) UNIQUE NOT NULL | Login credential |
| password | VARCHAR(255) NOT NULL | bcrypt hashed |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |

#### `retrop_admin_session`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | gen_random_uuid() |
| adminId | UUID FK → retrop_admin | ON DELETE CASCADE |
| accessToken | VARCHAR(500) NOT NULL | — |
| refreshToken | VARCHAR(500) | — |
| tokenExpiresAt | TIMESTAMPTZ NOT NULL | 8h from login |
| refreshTokenExpiresAt | TIMESTAMPTZ | 30d from login |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `retrop_business_config`
*(Source: `003_billing_system.sql`, `005_taxation_flag.sql`)*

| Field | Type | Notes |
|---|---|---|
| configId | UUID PK | gen_random_uuid() |
| legalName | VARCHAR(255) NOT NULL | Retrop's legal name for invoices |
| address | TEXT NOT NULL | — |
| gstin | VARCHAR(15) NOT NULL | Retrop's GSTIN |
| mobile | VARCHAR(20) NOT NULL | — |
| email | VARCHAR(255) NOT NULL | — |
| bankDetails | JSONB NOT NULL | `{bankName, accountNo, ifsc}` |
| gstRate | DECIMAL(5,2) | Default 18.00 |
| isTaxEnabled | BOOLEAN | Default true (migration 005) |
| updatedAt | TIMESTAMPTZ | — |

#### `business_type`
*(Source: `003_billing_system.sql`)*

| Field | Type | Notes |
|---|---|---|
| typeId | VARCHAR(50) PK | e.g. 'restaurant', 'gym', 'manufacturing' |
| displayName | VARCHAR(100) NOT NULL | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |

#### `pricing_plan`
*(Source: `003_billing_system.sql`)*

| Field | Type | Notes |
|---|---|---|
| planId | UUID PK | gen_random_uuid() |
| businessTypeId | VARCHAR(50) FK → business_type | ON DELETE CASCADE |
| name | VARCHAR(100) NOT NULL | e.g. 'Monthly Subscription (28 Days)' |
| planType | VARCHAR(30) NOT NULL | CHECK: 'monthly', 'lifetime', 'support' |
| billingCycleDays | INTEGER | Default 28 |
| basePrice | DECIMAL(10,2) NOT NULL | — |
| gstPercent | DECIMAL(5,2) | Default 18.00 |
| description | TEXT | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `subscription`
*(Source: `003_billing_system.sql`, `004_custom_billing.sql`)*

| Field | Type | Notes |
|---|---|---|
| subscriptionId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| planId | UUID FK → pricing_plan | ON DELETE RESTRICT |
| status | VARCHAR(30) NOT NULL | CHECK: 'active', 'grace_period', 'suspended', 'pending_payment'; Default: 'pending_payment' |
| startDate | TIMESTAMPTZ | — |
| endDate | TIMESTAMPTZ | — |
| gracePeriodEndsAt | TIMESTAMPTZ | — |
| nextBillingDate | TIMESTAMPTZ | — |
| billingCycleDays | INTEGER | Default 28 (migration 004) |
| gracePeriodDays | INTEGER | Default 10 (migration 004) |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `transaction`
*(Source: `003_billing_system.sql`)*

| Field | Type | Notes |
|---|---|---|
| transactionId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| subscriptionId | UUID FK → subscription | ON DELETE SET NULL |
| invoiceNo | VARCHAR(50) UNIQUE NOT NULL | Format: `RETROP/YYYY-MM/XXXX` |
| paymentMethod | VARCHAR(20) NOT NULL | CHECK: 'Cash', 'UPI' |
| upiTransactionId | VARCHAR(100) | — |
| baseAmount | DECIMAL(10,2) NOT NULL | — |
| gstAmount | DECIMAL(10,2) NOT NULL | — |
| finalAmount | DECIMAL(10,2) NOT NULL | — |
| status | VARCHAR(20) NOT NULL | CHECK: 'paid', 'pending', 'failed'; Default: 'pending' |
| invoiceUrl | VARCHAR(500) | Supabase Storage URL |
| description | VARCHAR(255) NOT NULL | — |
| createdAt | TIMESTAMPTZ | — |

#### `support_service_ticket`
*(Source: `003_billing_system.sql`)*

| Field | Type | Notes |
|---|---|---|
| ticketId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| title | VARCHAR(255) NOT NULL | — |
| description | TEXT NOT NULL | — |
| ticketStatus | VARCHAR(30) NOT NULL | CHECK: 'pending_payment', 'open', 'resolved'; Default: 'pending_payment' |
| cost | DECIMAL(10,2) | Default 500.00 |
| createdAt | TIMESTAMPTZ | — |

### SECTION 2: Restaurant Tenant Tables

*(All tables below include `restaurantId` FK → `retrop_restaurant` for tenant isolation)*

#### `admin`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| adminId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| mobile | VARCHAR(20) NOT NULL | Login credential |
| password | VARCHAR(255) NOT NULL | bcrypt hashed |
| name | VARCHAR(255) NOT NULL | — |
| role | VARCHAR(50) NOT NULL | CHECK: 'owner', 'manager' |
| email | VARCHAR(255) | Optional |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |
| — | UNIQUE | `(restaurantId, mobile)` |

#### `admin_session`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| adminId | UUID FK → admin | ON DELETE CASCADE |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| accessToken | VARCHAR(500) NOT NULL | JWT access token |
| refreshToken | VARCHAR(500) | JWT refresh token |
| tokenExpiresAt | TIMESTAMPTZ NOT NULL | Access token expiry |
| refreshTokenExpiresAt | TIMESTAMPTZ | — |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `waiter`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| waiterId | UUID PK | — |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| waiterName | VARCHAR(255) NOT NULL | — |
| mobile | VARCHAR(20) NOT NULL | Login credential |
| password | VARCHAR(255) NOT NULL | bcrypt hashed |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| fcmToken | VARCHAR(500) | Firebase push token |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |
| — | UNIQUE | `(restaurantId, mobile)` |

#### `waiter_session`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| waiterId | UUID UNIQUE FK → waiter | ON DELETE CASCADE |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| socketId | VARCHAR(255) | Socket.io connection ID |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| lastActivityAt | TIMESTAMPTZ | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `waiter_daily_stats`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| statsId | UUID PK | — |
| waiterId | UUID FK → waiter | ON DELETE CASCADE |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| statsDate | DATE NOT NULL | — |
| totalOrders | INTEGER | Default 0 |
| completedOrders | INTEGER | Default 0 |
| totalEarnings | DECIMAL(10,2) | Default 0 |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |
| — | UNIQUE | `(waiterId, statsDate)` |

#### `kitchen`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| kitchenId | UUID PK | — |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| kitchenName | VARCHAR(255) NOT NULL | — |
| mobile | VARCHAR(20) NOT NULL | Login credential |
| password | VARCHAR(255) NOT NULL | bcrypt hashed |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| fcmToken | VARCHAR(500) | Firebase push token |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |
| — | UNIQUE | `(restaurantId, mobile)` |

#### `kitchen_session`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| kitchenId | UUID UNIQUE FK → kitchen | ON DELETE CASCADE |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| socketId | VARCHAR(255) | — |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `manager_session`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| adminId | UUID FK → admin | ON DELETE CASCADE |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| socketId | VARCHAR(255) | Socket.io connection ID |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| lastActivityAt | TIMESTAMPTZ | — |
| inactivityTimeout | INTEGER | Default 1800 (30 min) |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `login_attempt`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| attemptId | UUID PK | — |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE SET NULL |
| mobile | VARCHAR(20) NOT NULL | — |
| ipAddress | VARCHAR(50) | — |
| success | BOOLEAN NOT NULL | — |
| failureReason | VARCHAR(255) | — |
| createdAt | TIMESTAMPTZ | — |

### SECTION 3: Restaurant Configuration

#### `restaurant_settings`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| settingsId | UUID PK | gen_random_uuid() |
| restaurantId | UUID UNIQUE FK → retrop_restaurant | ON DELETE CASCADE |
| isRestaurantOpen | BOOLEAN NOT NULL | Default false |
| updatedAt | TIMESTAMPTZ | — |
| updatedBy | UUID FK → admin | ON DELETE SET NULL |

#### `restaurant_info`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| infoId | UUID PK | gen_random_uuid() |
| restaurantId | UUID UNIQUE FK → retrop_restaurant | ON DELETE CASCADE |
| restaurantName | VARCHAR(255) | — |
| address | TEXT | — |
| mobile | VARCHAR(20) | — |
| isGST | BOOLEAN | Default false |
| GSTIN | VARCHAR(50) | — |
| taxes | JSONB | `[{name, percent}]`; Default '[]' |
| taxType | VARCHAR(20) | CHECK: 'inclusive', 'exclusive'; Default 'exclusive' |
| discounts | JSONB | `[{name, percent, isActive}]`; Default '[]' |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### SECTION 4: Menu

#### `menu`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| dishId | UUID PK | — |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| dishName | VARCHAR(255) NOT NULL | — |
| price | DECIMAL(10,2) NOT NULL | — |
| isAvailable | BOOLEAN | Default true |
| category | VARCHAR(100) | — |
| description | TEXT | — |
| imageUrl | VARCHAR(500) | Supabase Storage public URL |
| preparationTime | INTEGER | Default 15 (minutes) |
| spicyLevel | VARCHAR(50) | — |
| isVegetarian | BOOLEAN | Default false |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### SECTION 5: Tables & Customers

#### `restaurant_table`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| tableId | UUID PK | — |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| tableNo | INTEGER NOT NULL | — |
| capacity | INTEGER | Default 2 |
| isAvailable | BOOLEAN | Default true |
| currentOrder | UUID FK → orders | ON DELETE SET NULL |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |
| — | UNIQUE | `(restaurantId, tableNo)` |

#### `customer`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| mobile | VARCHAR(20) | **Composite PK** with restaurantId |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE; **Composite PK** |
| name | VARCHAR(255) NOT NULL | — |
| lastLogIn | TIMESTAMPTZ | — |
| totalorders | INTEGER | Default 0 |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### SECTION 6: Orders

#### `orders`
*(Source: `002_fresh_schema.sql`)*

| Field | Type | Notes |
|---|---|---|
| ordersId | UUID PK | — |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| mobile | VARCHAR(20) NOT NULL | FK → customer composite key |
| waiterId | UUID FK → waiter | ON DELETE SET NULL |
| tableNo | INTEGER | — |
| orderStatus | VARCHAR(50) | Default 'ordering'; Values: ordering, preparing, ready, serving, completed, cancelled |
| ordersInfo | JSONB NOT NULL | `[{dishId, dishName, price, quantity, remarks}]` |
| ordersUpdateInfo | JSONB | Modification logs + addon batches |
| lockedItems | JSONB | Snapshot at 'ready' status |
| totalAmount | DECIMAL(10,2) | Subtotal before tax |
| discountAmount | DECIMAL(10,2) | Default 0 |
| discountBreakdown | JSONB | `[{name, percent, amount}]` |
| taxBreakdown | JSONB | `[{name, percent, amount, inclusive}]` |
| gstAmount | DECIMAL(10,2) | Default 0 |
| finalAmount | DECIMAL(10,2) | After taxes and discounts |
| isPaymentCompleted | BOOLEAN | Default false |
| paymentMethod | VARCHAR(50) | — |
| invoice | VARCHAR(500) | — |
| invoiceNo | VARCHAR(20) | Format: `INV{YYYYMMDD}{4-digit-seq}` |
| dailyOrderNo | INTEGER | — |
| orderNumber | VARCHAR(20) | e.g. `"#42"` |
| customerToken | VARCHAR(64) | Re-scan QR token |
| tokenValidUntil | TIMESTAMPTZ | acceptedAt + 5 hours |
| preparationStartedAt | TIMESTAMPTZ | — |
| readyAt | TIMESTAMPTZ | — |
| servedAt | TIMESTAMPTZ | — |
| completedAt | TIMESTAMPTZ | — |
| cancellationReason | TEXT | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### Redis Key Namespaces (Tenant-Scoped)
*(Source: `Server/src/config/redis.js`)*

| Key Pattern | Purpose | TTL |
|---|---|---|
| `order_session:{restaurantId}:{tableId}` | Active customer order session object | 20 min (extendable) |
| `waiter_fcm_tokens:{restaurantId}` | SET of waiter IDs with active FCM tokens | No TTL |
| `waiter_fcm:{restaurantId}:{waiterId}` | Individual waiter FCM token string | No TTL |
| `kitchen_fcm_tokens:{restaurantId}` | SET of kitchen IDs with active FCM tokens | No TTL |
| `kitchen_fcm:{restaurantId}:{kitchenId}` | Individual kitchen FCM token string | No TTL |
| `waiter_session:{restaurantId}:{waiterId}` | Waiter JWT session data | — |
| `kitchen_session:{restaurantId}:{kitchenId}` | Kitchen JWT session data | — |
| `daily_order_counter:{restaurantId}:{dateStr}` | Atomic order counter for dailyOrderNo | 48 hours |
| `restaurant_info:{restaurantId}` | Cached restaurant info | 5 min |
| `menu_cache:{restaurantId}` | Cached menu items | 5 min |

### Supabase Storage Bucket: `menu-images`
*(Source: `002_fresh_schema.sql`)*
- Public bucket; 5 MB per image limit
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Menu image path: `menu-images/{dishId}/{filename}`
- Invoice PDF path: `invoices/{invoiceNo}.pdf`
- Public URL: `{SUPABASE_URL}/storage/v1/object/public/menu-images/{path}`

---

## API Surface

All routes defined in `Server/src/routes/routes.js`.

**Auth notation:** `JWT-Admin` = `authMiddleware`; `JWT-Waiter` = `waiterAuthMiddleware`; `JWT-Kitchen` = `kitchenAuthMiddleware`; `JWT-Retrop` = `retropAuth`; `PK` = `productKeyAuth`; `Open` = no auth required.

### Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Open | Returns health status |

### Retrop SuperAdmin Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/retrop/auth/login` | Open (rate-limited: 10/15min) | Body: `{email, password}` |
| POST | `/api/retrop/auth/refresh` | Open | Body: `{refreshToken}` |
| POST | `/api/retrop/auth/logout` | JWT-Retrop | — |
| GET | `/api/retrop/auth/me` | JWT-Retrop | Returns admin profile |

### Retrop Dashboard & Restaurant CRUD

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/retrop/dashboard` | JWT-Retrop | Stats overview |
| POST | `/api/retrop/restaurants` | JWT-Retrop (rate-limited: 30/15min) | Create restaurant + bootstrap settings/info + default owner admin |
| GET | `/api/retrop/restaurants` | JWT-Retrop | List all restaurants |
| GET | `/api/retrop/restaurants/:restaurantId` | JWT-Retrop | Get restaurant details |
| PATCH | `/api/retrop/restaurants/:restaurantId` | JWT-Retrop (rate-limited) | Update restaurant |
| PATCH | `/api/retrop/restaurants/:restaurantId/status` | JWT-Retrop | Toggle isActive |
| DELETE | `/api/retrop/restaurants/:restaurantId` | JWT-Retrop (rate-limited) | Delete restaurant |

### Retrop Restaurant Admin Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/retrop/restaurants/:restaurantId/admins` | JWT-Retrop | Get restaurant admins |
| POST | `/api/retrop/restaurants/:restaurantId/admins` | JWT-Retrop | Add admin to restaurant |
| PATCH | `/api/retrop/restaurants/:restaurantId/admins/:adminId` | JWT-Retrop | Update admin |
| DELETE | `/api/retrop/restaurants/:restaurantId/admins/:adminId` | JWT-Retrop | Delete admin |
| POST | `/api/retrop/restaurants/:restaurantId/mail-credentials` | JWT-Retrop (rate-limited) | Send credentials email with setup QR |
| GET | `/api/retrop/restaurants/:restaurantId/setup-qrcode` | JWT-Retrop | Get setup QR code image |

### Retrop Product Key Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/retrop/keys/generate/:restaurantId` | JWT-Retrop | Generate product key (one per restaurant) |
| PATCH | `/api/retrop/keys/:keyId/toggle` | JWT-Retrop | Toggle key active status |
| DELETE | `/api/retrop/keys/:keyId` | JWT-Retrop | Delete key |
| GET | `/api/retrop/keys` | JWT-Retrop | List all keys |
| GET | `/api/retrop/keys/:restaurantId` | JWT-Retrop | Get restaurant keys |

### Retrop Business Config & Pricing Plans

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/retrop/config` | JWT-Retrop | Get business config |
| PUT | `/api/retrop/config` | JWT-Retrop | Update business config |
| GET | `/api/retrop/plans` | JWT-Retrop | List pricing plans |
| POST | `/api/retrop/plans` | JWT-Retrop | Create pricing plan |
| PUT | `/api/retrop/plans/:planId` | JWT-Retrop | Update pricing plan |
| DELETE | `/api/retrop/plans/:planId` | JWT-Retrop | Delete pricing plan |

### Retrop Transactions & Subscriptions

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/retrop/transactions` | JWT-Retrop | List all transactions |
| GET | `/api/retrop/transactions/:transactionId/invoice` | JWT-Retrop | Download invoice PDF |
| GET | `/api/retrop/subscriptions` | JWT-Retrop | List all subscriptions |
| PUT | `/api/retrop/subscriptions/:subscriptionId` | JWT-Retrop | Update subscription |
| POST | `/api/retrop/transactions/confirm` | JWT-Retrop (rate-limited) | Confirm payment → updates subscription, sends invoice email |
| POST | `/api/retrop/support-tickets` | JWT-Retrop (rate-limited) | Create support ticket |

### Admin / Manager Auth (requires Product Key)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/admin/login` | PK + rate-limited: 5/15min | Body: `{mobile, password}` |
| POST | `/api/admin/refresh` | PK | Body: `{refreshToken}` |
| POST | `/api/admin/logout` | PK + JWT-Admin | — |
| GET | `/api/admin/profile` | PK + JWT-Admin | Returns admin object |

### Manager — Profile & Dashboard

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/profile` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/dashboard/summary` | PK + JWT-Admin + role=manager | — |

### Manager — Waiter Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/waiters` | PK + JWT-Admin + role=manager | All waiters |
| GET | `/api/manager/waiters/active` | PK + JWT-Admin + role=manager | Active only |
| GET | `/api/manager/waiters/:waiterId` | PK + JWT-Admin + role=manager | Single waiter |
| GET | `/api/manager/waiters/:waiterId/tables` | PK + JWT-Admin + role=manager | Waiter's tables |
| POST | `/api/manager/waiters` | PK + JWT-Admin + role=manager | Add waiter |
| DELETE | `/api/manager/waiters/:waiterId` | PK + JWT-Admin + role=manager | Delete waiter |
| PATCH | `/api/manager/waiters/:waiterId/reset-password` | PK + JWT-Admin + role=manager | Reset password |
| PATCH | `/api/manager/waiters/:waiterId/status` | PK + JWT-Admin + role=manager | Toggle isActive |

### Manager — Kitchen Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/kitchen` | PK + JWT-Admin + role=manager | All kitchen accounts |
| POST | `/api/manager/kitchen` | PK + JWT-Admin + role=manager | Add kitchen |
| DELETE | `/api/manager/kitchen/:kitchenId` | PK + JWT-Admin + role=manager | Delete kitchen |
| PATCH | `/api/manager/kitchen/:kitchenId/status` | PK + JWT-Admin + role=manager | Toggle isActive |

### Manager — Analytics

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/admins/analytics` | PK + JWT-Admin + role=manager or owner | — |
| GET | `/api/manager/analytics/orders` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/analytics/orders/:orderId` | PK + JWT-Admin + role=manager | — |

### Manager — Table Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/tables` | PK + JWT-Admin + role=manager | All tables |
| GET | `/api/manager/tables/statistics` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/tables/occupancy-trend` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/tables/:tableNo` | PK + JWT-Admin + role=manager | Single table |
| POST | `/api/manager/tables` | PK + JWT-Admin + role=manager | Add table |
| DELETE | `/api/manager/tables/:tableNo` | PK + JWT-Admin + role=manager | Delete table |
| PATCH | `/api/manager/tables/:tableNo/capacity` | PK + JWT-Admin + role=manager | Update capacity |

### Manager — Menu Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/menu` | PK + JWT-Admin + role=manager | All items |
| GET | `/api/manager/menu/categories` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/menu/stats` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/menu/:dishId` | PK + JWT-Admin + role=manager | Single item |
| POST | `/api/manager/menu` | PK + JWT-Admin + role=manager | Add item |
| PUT | `/api/manager/menu/:dishId` | PK + JWT-Admin + role=manager | Update item |
| DELETE | `/api/manager/menu/:dishId` | PK + JWT-Admin + role=manager | Delete item |
| PATCH | `/api/manager/menu/:dishId/availability` | PK + JWT-Admin + role=manager | Toggle availability |
| PATCH | `/api/manager/menu/category/:category/availability` | PK + JWT-Admin + role=manager | Toggle category |
| POST | `/api/manager/menu/:dishId/image` | PK + JWT-Admin + role=manager | Upload image |
| DELETE | `/api/manager/menu/:dishId/image` | PK + JWT-Admin + role=manager | Delete image |

### Manager — Settings & Restaurant Info

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/settings` | PK + JWT-Admin + role=manager | — |
| PATCH | `/api/manager/settings/toggle` | PK + JWT-Admin + role=manager | — |
| GET | `/api/manager/restaurant-info` | PK + JWT-Admin + role=manager | — |
| PUT | `/api/manager/restaurant-info` | PK + JWT-Admin + role=manager | — |
| GET | `/api/public/restaurant-info` | PK + rate-limited | — |

### Waiter Auth & Operations (requires Product Key)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/waiter/login` | PK + rate-limited: 10/15min | Body: `{mobile, password}` |
| POST | `/api/waiter/refresh` | PK | Body: `{refreshToken}` |
| POST | `/api/waiter/logout` | PK + JWT-Waiter | — |
| POST | `/api/waiter/fcm-token` | PK + JWT-Waiter | Body: `{fcmToken}` |
| GET | `/api/waiter/dashboard` | PK + JWT-Waiter | — |
| GET | `/api/waiter/pending-sessions` | PK + JWT-Waiter | — |
| GET | `/api/waiter/menu` | PK + JWT-Waiter | — |
| GET | `/api/waiter/active-orders` | PK + JWT-Waiter | — |
| POST | `/api/waiter/orders/:tableId/accept` | PK + JWT-Waiter | — |
| GET | `/api/waiter/orders/:orderId` | PK + JWT-Waiter | — |
| PATCH | `/api/waiter/orders/:orderId/modify` | PK + JWT-Waiter | — |
| PATCH | `/api/waiter/orders/:orderId/status` | PK + JWT-Waiter | — |
| POST | `/api/waiter/orders/:orderId/conclude` | PK + JWT-Waiter | — |
| GET | `/api/waiter/orders/:orderId/bill-preview` | PK + JWT-Waiter | — |

### Kitchen Auth & Operations (requires Product Key)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/kitchen/login` | PK + rate-limited: 10/15min | — |
| POST | `/api/kitchen/refresh` | PK | — |
| POST | `/api/kitchen/logout` | PK + JWT-Kitchen | — |
| POST | `/api/kitchen/fcm-token` | PK + JWT-Kitchen | — |
| GET | `/api/kitchen/dashboard` | PK + JWT-Kitchen | — |
| PATCH | `/api/kitchen/orders/:orderId/start` | PK + JWT-Kitchen | — |
| PATCH | `/api/kitchen/orders/:orderId/ready` | PK + JWT-Kitchen | — |
| PATCH | `/api/kitchen/orders/:orderId/addon/:addonId/done` | PK + JWT-Kitchen | — |
| GET | `/api/kitchen/orders/:orderId` | PK + JWT-Kitchen | — |

### Public Customer Order Flow (requires Product Key)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/order/session` | PK + rate-limited + RestaurantOpen | — |
| POST | `/api/order/session/customer-info` | PK + rate-limited + RestaurantOpen | — |
| GET | `/api/order/session/:tableId/status` | PK + rate-limited + RestaurantOpen | — |
| GET | `/api/order/menu` | PK + rate-limited | — |
| POST | `/api/order/place` | PK + rate-limited + RestaurantOpen | — |
| GET | `/api/order/:orderId/bill` | PK + rate-limited | — |
| GET | `/api/order/:tableId/order-status` | PK + rate-limited + RestaurantOpen | — |
| POST | `/api/order/:orderId/customer-modify` | PK + rate-limited + RestaurantOpen | — |
| GET | `/api/order/:tableId/token-check` | PK + rate-limited + RestaurantOpen | — |

---

## Environment & Infrastructure

### Backend Environment Variables
*(Source: `Server/.env`)*

| Variable | Purpose |
|---|---|
| `PORT` | Express server port (default 3000) |
| `NODE_ENV` | `'development'` or `'production'` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `JWT_SECRET` | Secret for restaurant admin access tokens |
| `JWT_REFRESH_SECRET` | Secret for restaurant admin refresh tokens |
| `REDIS_URL` | Redis connection URL |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin SDK JSON string |
| `RETROP_JWT_SECRET` | Secret for Retrop SuperAdmin access tokens |
| `RETROP_JWT_REFRESH_SECRET` | Secret for Retrop SuperAdmin refresh tokens |
| `EMAIL_HOST` | SMTP host (default: smtp.gmail.com) |
| `EMAIL_PORT` | SMTP port (default: 465) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password / app password |
| `ECC_PUBLIC_KEY` | ECIES public key for setup QR encryption |

### Customer Frontend Environment Variables
*(Source: `Retrop_RMS_Frontend/.env`)*

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL |
| `VITE_PRODUCT_KEY` | Product key sent in X-Product-Key header |

### Admin Dashboard Environment Variables
*(Source: `Retrop_Admin_Dashboard/.env`)*

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL |

### App Environment Variables
*(Source: `Retrop_RMS_App/src/config/api.ts`)*

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Fallback backend URL; runtime URL configured via Settings modal |

### Confirmed Services
| Service | Role | Source |
|---|---|---|
| Supabase (PostgreSQL) | Primary persistent database | `Server/src/config/supabase.js` |
| Supabase Storage | Dish images + invoice PDFs (bucket: `menu-images`) | `002_fresh_schema.sql` |
| Redis | Session cache, FCM tokens, daily counters (tenant-scoped keys) | `Server/src/config/redis.js` |
| Firebase Cloud Messaging | Push notifications to waiter + kitchen apps | `Server/src/services/notificationService.js` |
| Socket.io | Real-time events across all clients | `Server/src/services/socketService.js` |
| Nodemailer (Gmail SMTP) | Email dispatch (welcome, credentials, invoice, renewal, suspension) | `Server/src/services/mailer.js` |
| node-cron | Daily billing cycle processor (midnight) | `Server/src/utils/billingCron.js` |

---

## Known Constraints & Technical Debt

| Area | Description |
|---|---|
| CORS `origin: '*'` | Both Express and Socket.io use open CORS — security concern for production |
| `.env.example` outdated | Does not include `RETROP_JWT_SECRET`, `RETROP_JWT_REFRESH_SECRET`, `EMAIL_*`, `ECC_PUBLIC_KEY` |
| Invoice storage bucket reuse | `invoiceService.js` reuses the `menu-images` bucket for PDF invoices |
| `Retrop_RMS_App/src/app/explore.tsx` | Unused Expo starter screen still present |
| `productKeyService` uses `new Date().toISOString()` | Should use `nowIST()` for consistency |

---

## How AI agents should update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **Only update after confirmed changes.** Every statement must trace to actual code, config, or migration files. Do not add speculative or planned content.
> 2. **Update the "Last Updated" line** at the top with today's ISO date and `"Updated by: [model name]"`.
> 3. **When adding new routes**, add a row to the correct table in the API Surface section. Include method, path, auth requirement, and a note on body/response shape derived from the controller.
> 4. **When adding new DB tables or columns**, add the model to the Data Models section with all fields confirmed from the migration file.
> 5. **When adding new env vars**, add them to the Environment section with the source file noted.
> 6. **When a constraint or debt item is resolved**, remove it from the Known Constraints table and record the fix in AGENT_MEMORY_LOG.md.
> 7. **When the tech stack changes** (new dependency added/removed), update the Tech Stack table with the version from the updated `package.json`.
> 8. **Do not remove existing content** unless a feature is confirmed deleted. Mark deprecated items with `~~strikethrough~~` and a date note instead.
