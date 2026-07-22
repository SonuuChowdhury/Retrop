# Project Blueprint

## Last Updated
2026-07-22 | Updated by: Antigravity AI Agent (Gemini 3.6 Flash)

---

## Project Overview

This is **Retrop** — a **Multi-Tenant Restaurant Automation SaaS Platform** that digitises the dine-in experience for **multiple restaurants concurrently** from a **single shared server**. Each restaurant is identified by a `restaurantId` and is issued a unique **Product Key** (`RETROP-XXXX-XXXX-XXXX`) which must be sent via `X-Product-Key` header on every restaurant-facing API call. The server uses an **AsyncLocalStorage-based Supabase Proxy** and **tenant-scoped Redis keys** to automatically isolate all data per restaurant.

The ecosystem has **five surfaces**:

1. **Retrop_RMS_Frontend** — Customer-facing React Vite SPA (customers scan QR → order → track → pay → give feedback).
2. **Retrop_RMS_App** — Cross-platform Expo / React Native mobile app for restaurant staff (Manager, Waiter, Kitchen roles).
3. **Retrop_Admin_Dashboard** — Retrop SuperAdmin React Vite SPA for client onboarding, subscription management, billing, product key generation, and global telemetry analytics.
4. **Retrop_Website** — Restaurant Owner Portal & General Homepage. Provides public landing pages, interactive product documentation, self-service portal signup/login with OTP verification, multi-business switcher, and owner workplace dashboard.
5. **Server** — Unified Node.js / Express backend with Socket.io powering real-time sync, automated cron schedulers, telemetry analytics ingestion, and multi-tenant proxy data access across all surfaces.

The platform includes a **Retrop SuperAdmin control plane** (`/api/retrop/*`) for restaurant onboarding, admin CRUD, product key lifecycle, pricing plans, subscription billing (with automated cron-based renewal/grace/suspension), PDF invoice generation, email dispatch, and platform-wide website analytics tracking (`/api/analytics/*`).

The platform also includes a **Self-Service Portal User authentication system** (`/api/portal/auth/*`) allowing restaurant owners to register via email OTP, verify credentials, reset passwords, log in via Google OAuth, and manage multiple business entities under a single profile using `portal_user_business` mappings.

The platform also includes a **Restaurant Owner control plane** (`/api/owner/*`) for back-office business management (BOM inventory, supplier tracking, purchases, unified staff custom roles, expense tracking, daily cash closeout registry, GST compliance GSTR-1/3B reporting, order management, review feedback, and customer loyalty tracking).

---

## Tech Stack

| Layer | Technology | Version (from package.json) | Notes |
|---|---|---|---|
| **Backend runtime** | Node.js | unspecified (ESM modules) | `"type": "module"` in package.json |
| **Backend framework** | Express | ^5.2.1 | Express 5 (RC) |
| **Backend language** | JavaScript (ES Modules) | — | No TypeScript on backend |
| **Database** | Supabase (PostgreSQL) | @supabase/supabase-js ^2.106.1 | Hosted Postgres via Supabase |
| **Cache / session store** | Redis | redis ^6.0.0 | Session cache, FCM tokens, daily counters, temporary PDF tokens |
| **Real-time** | Socket.io | socket.io ^4.8.3 | Server-side web sockets |
| **Authentication** | JWT (jsonwebtoken) | ^9.0.3 | Access/refresh tokens for admins, waiters, kitchen, owners, and portal users |
| **Validation** | Zod | ^4.4.3 | Data schema validation middleware (with loose UUID fallback) |
| **Password hashing** | bcryptjs | ^3.0.3 | Salt rounds: 10 |
| **Push notifications** | Firebase Admin SDK | firebase-admin ^13.10.0 | FCM for waiter + kitchen devices |
| **Security** | Helmet | ^8.2.0 | HTTP headers hardening |
| **Image Security** | Custom Buffer Inspector | — | Multi-layered file header & mime-type validation (`imageSecurity.js`) |
| **Rate limiting** | express-rate-limit | ^8.5.2 | Per-route limits defined in constants.js & routes.js |
| **PDF generation** | PDFKit | ^0.19.1 | Retrop subscription invoices & thermal billing prints |
| **QR code generation** | qrcode | ^1.5.4 | Setup QR codes for app config & customer billing links |
| **ECIES encryption** | eciesjs | ^0.5.0 | Encrypts server URL + product key for app setup QR |
| **Email** | Nodemailer | ^9.0.1 | Gmail SMTP for credentials, OTPs, welcome emails, invoices |
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
| **Customer frontend** | React | ^18.3.1 | Vite SPA (Vercel deployment ready) |
| **Customer bundler** | Vite | ^5.4.1 | Port 5173 |
| **Customer routing** | react-router-dom | ^6.26.0 | Client-side SPA routing |
| **Customer animations** | framer-motion | ^11.3.31 | — |
| **Customer icons** | lucide-react | ^0.441.0 | — |
| **Customer socket client** | socket.io-client | ^4.8.3 | Customer order tracking |
| **Admin Dashboard** | React | ^19.2.6 | Vite SPA (Vercel deployment ready) |
| **Admin Dashboard bundler** | Vite | ^8.0.12 | Includes platform telemetry analytics page |
| **Admin Dashboard routing** | react-router-dom | ^7.18.0 | — |
| **Admin Dashboard icons** | lucide-react | ^1.21.0 | — |
| **Owner Website** | React | ^19.2.7 | Vite SPA (Vercel deployment ready) |
| **Owner Website bundler** | Vite | ^8.1.1 | Port 5180 |
| **Owner Website routing** | react-router-dom | ^7.18.1 | Includes SEO tags, analytics telemetry, docs hub, portal auth |
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
├── Assets/                           ← Shared assets (logos, branding)
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
│   ├── vercel.json                  ← Production SPA routing rewrite config
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
│       │   ├── ThankYou/           ← Final bill page (/bill/:orderId) + feedback ratings + Google review link
│       │   ├── PublicMenu/         ← Read-only public menu at /menu
│       │   └── NotFound/           ← 404 page
│       └── services/
│           └── api.js              ← Customer-facing API calls (sends X-Product-Key header)
│
├── Retrop_Admin_Dashboard/          ← Retrop SuperAdmin React Vite SPA
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json                  ← Production SPA routing rewrite config
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  ← Root router
│       ├── components/
│       │   └── Layout.jsx           ← Sidebar layout with nav links (Dashboard, Restaurants, Analytics, Transactions, Settings)
│       └── pages/
│           ├── Login.jsx            ← Retrop admin login
│           ├── Dashboard.jsx        ← Stats overview (restaurants, revenue, subscriptions)
│           ├── Restaurants.jsx      ← Restaurant CRUD listing
│           ├── RestaurantDetails.jsx← Single restaurant management (admins, keys, subscription, billing)
│           ├── Analytics.jsx        ← Platform-wide telemetry analytics (visitors, pageviews, geo, conversion)
│           ├── Settings.jsx         ← Business config + pricing plans management
│           └── Transactions.jsx     ← Global transaction ledger
│
├── Retrop_Website/                  ← Restaurant Owner Portal & Landing Platform
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json                  ← Production SPA routing rewrite config
│   ├── package.json
│   ├── public/
│   │   ├── robots.txt               ← Search engine crawler rules
│   │   └── sitemap.xml              ← Sitemap for search indexing
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  ← Root Router & Layout Wrapper
│       ├── components/
│       │   ├── Navbar.jsx           ← Main platform navbar
│       │   ├── Footer.jsx           ← Main platform footer
│       │   ├── ProtectedRoute.jsx   ← Route guard for owner authentication
│       │   ├── SEO.jsx              ← React Helmet title, meta description, and social tags
│       │   ├── CookieConsent.jsx    ← GDPR cookie consent banner
│       │   ├── PageWrapper.jsx      ← Page transition container
│       │   ├── DocsLayout.jsx       ← Documentation layout shell
│       │   ├── DocsSidebar.jsx      ← Documentation navigation sidebar
│       │   └── ScrollToTop.jsx      ← Route change scroll restoration
│       ├── context/
│       │   └── AuthContext.jsx      ← JWT auth state, active business state, theme manager
│       ├── hooks/
│       │   └── useAnalytics.js      ← Real-time telemetry tracking hook
│       ├── utils/
│       │   └── analytics.js         ← Visitor tracking engine (session ID, device info, heartbeat ping)
│       ├── styles/
│       │   └── dashboard.css        ← Dedicated owner dashboard styling
│       ├── pages/
│       │   ├── Home.jsx             ← Main platform homepage & feature showcase
│       │   ├── About.jsx            ← Platform story & team overview
│       │   ├── Contact.jsx          ← Contact form & inquiries
│       │   ├── Services.jsx         ← Detailed product features & capabilities
│       │   ├── Login.jsx            ← Owner / Portal User login page
│       │   ├── Signup.jsx           ← Self-service email OTP signup
│       │   ├── ForgotPassword.jsx   ← Self-service OTP password reset
│       │   ├── BusinessSelector.jsx ← Multi-business restaurant context selection screen
│       │   ├── ResetPassword.jsx    ← First-time forced password reset
│       │   ├── Dashboard.jsx        ← Owner Workplace (Overview, Menu, Orders, Reviews, Staff, Inventory, Expenses, Settings, GST)
│       │   ├── Docs.jsx             ← Documentation hub landing
│       │   ├── DownloadApp.jsx      ← Mobile app download links & QR setup info
│       │   ├── Downloads.jsx        ← Software download resources
│       │   ├── PrivacyPolicy.jsx    ← Privacy policy compliance page
│       │   ├── TermsOfService.jsx   ← Terms of service page
│       │   ├── CookiePolicy.jsx     ← Cookie policy page
│       │   ├── NotFound.jsx         ← Custom 404 page
│       │   └── docs/                ← Interactive documentation pages
│       │       ├── RMSOverview.jsx  ← Platform architecture & setup guide
│       │       ├── RMSApp.jsx       ← Mobile RMS App user manual
│       │       ├── RMSOrdering.jsx  ← QR Ordering flow guide
│       │       └── RMSPortal.jsx    ← Owner workplace guide
│       └── services/
│           └── api.js               ← Owner & Portal API wrapper (Bearer token auth)
│
└── Server/                          ← Node.js / Express API server
    ├── package.json
    ├── nodemon.json                 ← Watch configuration ignoring local analytics data files
    └── src/
        ├── index.js                 ← Server entry: Express, CORS policies, Socket.io, billing cron, graceful shutdown
        ├── config/
        │   ├── constants.js         ← Server constants, limits, rate limit configs
        │   ├── env.js               ← dotenv environment loader
        │   ├── redis.js             ← Redis client + tenant-scoped keys
        │   └── supabase.js          ← Supabase AsyncLocalStorage multi-tenant Proxy
        ├── controllers/
        │   ├── adminController.js
        │   ├── analyticsController.js← Telemetry track hits, heartbeats, analytics summaries
        │   ├── customerOrderController.js
        │   ├── expenseController.js  ← Expense entries, cash day close operations
        │   ├── healthController.js
        │   ├── inventoryController.js← Vendors, inventory items, purchases, recipe BOM
        │   ├── kitchenController.js
        │   ├── managerController.js
        │   ├── menuController.js
        │   ├── ownerController.js    ← Owner dashboard metrics, orders/reviews, GST reports, logo upload
        │   ├── portalAuthController.js← Portal user signup OTP, login, password reset, business linking
        │   ├── restaurantInfoController.js
        │   ├── restaurantSettingsController.js
        │   ├── retropController.js  ← SuperAdmin actions & platform control plane
        │   ├── staffController.js   ← Unified staff aggregator (managers, waiters, chefs, others)
        │   └── waiterController.js
        ├── middleware/
        │   ├── auth.js              ← Restaurant Admin JWT validation & role enforcement
        │   ├── ownerAuth.js         ← Owner Portal JWT verification & tenant binding
        │   ├── portalAuth.js        ← Self-service Portal User JWT verification
        │   ├── productKeyAuth.js    ← X-Product-Key validation & tenant context binding
        │   ├── restaurantOpen.js    ← Open status checker guard
        │   ├── retropAuth.js        ← SuperAdmin auth guard
        │   ├── security.js          ← Rate limiting, Helmet middleware
        │   ├── validate.js          ← Zod-based request validation middleware (with loose UUID check)
        │   └── waiterKitchenAuth.js ← Waiter/Kitchen JWT validation
        ├── migrations/
        │   ├── 001_drop_all.sql
        │   ├── 002_fresh_schema.sql
        │   ├── 003_billing_system.sql
        │   ├── 004_custom_billing.sql
        │   ├── 005_taxation_flag.sql
        │   ├── 006_owner_system.sql ← Owner portal tables (retrop_owner, retrop_owner_session)
        │   ├── 007_inventory.sql    ← BOM & Inventory tables (vendor, item, recipe, purchase, adjustment)
        │   ├── 008_expense_staff_loyalty_schema.sql ← Expenses, Day close, staff roles, loyalty, customer feedback
        │   ├── 009_google_review_link.sql ← Adds googleReviewLink column to restaurant_info
        │   ├── 010_portal_users.sql ← Portal user system (portal_user, portal_otp, portal_user_session, portal_user_business)
        │   └── 011_website_analytics.sql ← Telemetry tracking (website_analytics table)
        ├── routes/
        │   ├── analyticsRoutes.js   ← Telemetry tracking routes (/api/analytics/*)
        │   └── routes.js            ← Unified backend routes map
        ├── services/
        │   ├── analyticsService.js  ← Telemetry processing, session duration calculation, JSON backup persistence
        │   ├── authService.js
        │   ├── database.js
        │   ├── invoiceService.js    ← PDFKit subscription & billing invoice generator
        │   ├── kitchenAuthService.js
        │   ├── mailer.js            ← Nodemailer SMTP service (OTPs, credentials, invoices)
        │   ├── managerService.js
        │   ├── menuService.js
        │   ├── notificationService.js
        │   ├── orderAnalyticsService.js
        │   ├── orderSessionService.js ← Order sessions, lockedItems logic, loyalty rewards, COGS calculation
        │   ├── ownerAuthService.js  ← JWT logic for legacy owner accounts
        │   ├── productKeyService.js
        │   ├── restaurantInfoService.js
        │   ├── restaurantSettingsService.js
        │   ├── retropAuthService.js
        │   ├── socketService.js     ← Socket.io real-time event broadcasting
        │   ├── staffController.js
        │   ├── tableService.js
        │   ├── waiterAuthService.js
        │   └── waiterService.js
        └── utils/
            ├── billingCron.js       ← Subscription checks cron scheduler
            ├── crypto.js            ← ECIES encryption/decryption utilities
            ├── imageSecurity.js     ← File buffer header & mime-type security checker
            ├── logger.js            ← Winston logger instance
            └── time.js              ← IST timezone helper utilities
```

---

## Multi-Tenant Architecture

### How Tenant Isolation Works

1. **Product Key Resolution (Restaurant surfaces)**: Every restaurant-facing request (admin, waiter, kitchen, customer) must include an `X-Product-Key` header. The `productKeyAuth` middleware resolves the key to a `restaurantId` via the `product_key` table (joined with `retrop_restaurant`).

2. **Owner Session & Portal User Resolution (Owner Portal)**:
   - For legacy owner logins (`ownerAuthMiddleware`), the token resolves the owner profile and their linked `restaurantId`.
   - For self-service portal users (`portalAuthMiddleware`), the user authenticates via email/OTP/Google, obtaining a `userId`. The frontend calls `/api/portal/auth/select-business` or provides the target `restaurantId` from `portal_user_business`, setting `tenantContext.enterWith({ restaurantId })`.

3. **AsyncLocalStorage Context**: The auth middlewares call `tenantContext.enterWith({ restaurantId })` where `tenantContext` is a Node.js `AsyncLocalStorage` instance exported from `supabase.js`.

4. **Supabase Proxy Auto-Scoping**: The exported `supabase` client is a **JavaScript Proxy** over the raw Supabase client. For any table in the `tenantTables` list (`admin`, `admin_session`, `waiter`, `waiter_session`, `waiter_daily_stats`, `kitchen`, `kitchen_session`, `manager_session`, `login_attempt`, `restaurant_settings`, `restaurant_info`, `menu`, `restaurant_table`, `customer`, `orders`, `vendor`, `inventory_item`, `purchase_entry`, `recipe`, `stock_adjustment`, `expense`, `day_close`, `retrop_other_staff`, `loyalty_points`, `customer_feedback`), the Proxy:
   - Automatically appends `.eq('restaurantId', store.restaurantId)` to all query methods.
   - Automatically injects `restaurantId` into all `insert()` and `upsert()` payloads.

5. **Redis Key Namespacing**: All `REDIS_KEYS.*` functions include `restaurantId` in the key pattern (e.g., `order_session:{restaurantId}:{tableId}`), preventing cross-restaurant data pollution in the shared Redis instance.

6. **Retrop Control Plane & Telemetry**: Routes under `/api/retrop/*` and `/api/analytics/*` do NOT use `productKeyAuth`. They use `retropAuth` or open/telemetry handlers accessing global data without tenant scoping.

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
| Field | Type | Notes |
|---|---|---|
| keyId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| productKey | VARCHAR(50) UNIQUE NOT NULL | Format: RETROP-XXXX-XXXX-XXXX |
| status | VARCHAR(20) | CHECK: 'active', 'inactive', 'revoked', 'expired' |
| expiresAt | TIMESTAMPTZ | Key expiration date |
| createdAt | TIMESTAMPTZ | — |

---

### SECTION 2: Self-Service Portal User Tables
*(Source: `010_portal_users.sql`)*

#### `portal_user`
| Field | Type | Notes |
|---|---|---|
| userId | UUID PK | gen_random_uuid() |
| name | VARCHAR(255) NOT NULL | User's full name |
| email | VARCHAR(255) UNIQUE NOT NULL | Login credential |
| mobile | VARCHAR(20) | User mobile contact |
| passwordHash | VARCHAR(255) | Null until first password set |
| googleId | TEXT UNIQUE | Populated if logged in via Google |
| needsPasswordReset | BOOLEAN | Default true |
| isActive | BOOLEAN | Default true |
| emailVerified | BOOLEAN | Default false |
| lastLoginAt | TIMESTAMPTZ | Timestamp of last login |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

#### `portal_otp`
| Field | Type | Notes |
|---|---|---|
| otpId | UUID PK | gen_random_uuid() |
| email | VARCHAR(255) NOT NULL | Recipient email |
| code | VARCHAR(6) NOT NULL | 6-digit OTP code |
| purpose | VARCHAR(20) NOT NULL | CHECK: 'signup', 'forgot_password' |
| expiresAt | TIMESTAMPTZ NOT NULL | Expiry timestamp |
| used | BOOLEAN | Default false |
| createdAt | TIMESTAMPTZ | — |

#### `portal_user_session`
| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | gen_random_uuid() |
| userId | UUID FK → portal_user | ON DELETE CASCADE |
| accessToken | TEXT NOT NULL | Bearer JWT |
| refreshToken | TEXT | Long-lived refresh token |
| tokenExpiresAt | TIMESTAMPTZ NOT NULL | Token expiration |
| refreshTokenExpiresAt | TIMESTAMPTZ | Refresh token expiration |
| isActive | BOOLEAN | Default true |
| ipAddress | VARCHAR(50) | Client IP |
| userAgent | TEXT | Client User-Agent |
| createdAt | TIMESTAMPTZ | — |

#### `portal_user_business`
| Field | Type | Notes |
|---|---|---|
| userId | UUID FK → portal_user | ON DELETE CASCADE |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| role | VARCHAR(20) | Default 'owner' |
| linkedAt | TIMESTAMPTZ | Link creation timestamp |
| **PRIMARY KEY** | (`userId`, `restaurantId`) | Composite PK |

---

### SECTION 3: Telemetry & Website Analytics Table
*(Source: `011_website_analytics.sql`)*

#### `website_analytics`
| Field | Type | Notes |
|---|---|---|
| session_id | VARCHAR(255) PK | Client session identifier |
| visitor_id | VARCHAR(255) NOT NULL | Unique visitor cookie ID |
| is_returning | BOOLEAN | Default false |
| entry_page | TEXT | First visited path |
| exit_page | TEXT | Last recorded path |
| pages_visited | JSONB | Array of visited pages with timestamps |
| duration_seconds | INTEGER | Total active session duration |
| device_type | VARCHAR(50) | desktop, mobile, tablet |
| browser | VARCHAR(50) | Chrome, Safari, Firefox, Edge, etc. |
| os | VARCHAR(50) | Windows, macOS, Android, iOS, Linux |
| screen_resolution | VARCHAR(50) | e.g., "1920x1080" |
| timezone | VARCHAR(100) | e.g., "Asia/Kolkata" |
| network_type | VARCHAR(50) | 4g, wifi, etc. |
| ip_address | VARCHAR(50) | Client IP address |
| country | VARCHAR(100) | Geo country |
| state | VARCHAR(100) | Geo state |
| city | VARCHAR(100) | Geo city |
| isp | VARCHAR(255) | Internet service provider |
| traffic_source | VARCHAR(100) | direct, google, referrer |
| referrer_domain | TEXT | Referring website domain |
| utm_data | JSONB | Campaign UTM query params |
| created_at | TIMESTAMPTZ | Session creation time |
| updated_at | TIMESTAMPTZ | Last heartbeat ping time |

---

### SECTION 4: Restaurant Owner Portal & Management Tables

#### `retrop_owner`
| Field | Type | Notes |
|---|---|---|
| ownerId | UUID PK | gen_random_uuid() |
| name | VARCHAR(255) NOT NULL | — |
| email | VARCHAR(255) UNIQUE NOT NULL | Login credential |
| mobile | VARCHAR(20) UNIQUE NOT NULL | Login credential |
| password | VARCHAR(255) NOT NULL | Hashed password |
| needsPasswordReset | BOOLEAN | Default true |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |

---

### SECTION 5: BOM & Inventory Tables

#### `vendor`
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

#### `inventory_item`
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

#### `purchase_entry`
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

#### `recipe`
| Field | Type | Notes |
|---|---|---|
| recipeId | UUID PK | gen_random_uuid() |
| dishId | UUID FK → menu | UNIQUE with restaurantId |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| ingredients | JSONB NOT NULL | `[{itemId, itemName, quantity, unit}]` |
| yieldQuantity | DECIMAL(10,2) | Portions yield per recipe run |

---

### SECTION 6: Expense & Cash Register Tables

#### `expense`
| Field | Type | Notes |
|---|---|---|
| expenseId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| amount | DECIMAL(10,2) NOT NULL | — |
| category | VARCHAR(100) NOT NULL | Rent, Utilities, Ingredients, Salaries, Maintenance, Other |
| description | TEXT | — |
| paymentMode | VARCHAR(50) | Cash, UPI, Card, Bank Transfer |
| expenseDate | DATE NOT NULL | — |

#### `day_close`
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

---

### SECTION 7: Unified Staff, Loyalty & Reviews Tables

#### `retrop_other_staff`
| Field | Type | Notes |
|---|---|---|
| staffId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| name | VARCHAR(255) NOT NULL | — |
| mobile | VARCHAR(20) NOT NULL | UNIQUE with restaurantId |
| password | VARCHAR(255) NOT NULL | Hashed password |
| role | VARCHAR(100) NOT NULL | Cashier, Storekeeper, Cleaner, Valet, etc. |

#### `loyalty_points`
| Field | Type | Notes |
|---|---|---|
| pointId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| mobile | VARCHAR(20) NOT NULL | UNIQUE with restaurantId |
| totalPoints | INTEGER | Current balance |
| lifetimeEarned | INTEGER | Total earned |

#### `customer_feedback`
| Field | Type | Notes |
|---|---|---|
| feedbackId | UUID PK | gen_random_uuid() |
| restaurantId | UUID FK → retrop_restaurant | ON DELETE CASCADE |
| orderId | UUID FK → orders | ON DELETE SET NULL |
| mobile | VARCHAR(20) NOT NULL | Customer mobile |
| rating | SMALLINT NOT NULL | CHECK: 1 to 5 stars |
| comment | TEXT | Customer feedback |

---

## API Surface

### Portal User Auth (`/api/portal/auth/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/portal/auth/signup/request-otp` | Open (Rate Limited) | Request email verification OTP |
| POST | `/api/portal/auth/signup/verify-otp` | Open (Rate Limited) | Verify email signup OTP |
| POST | `/api/portal/auth/signup/set-password` | Open (Rate Limited) | Set initial password after verification |
| POST | `/api/portal/auth/login` | Open (Rate Limited) | Portal user login with email & password |
| POST | `/api/portal/auth/google` | Open (Rate Limited) | Single sign-on with Google OAuth token |
| POST | `/api/portal/auth/forgot-password/request-otp` | Open (Rate Limited) | Request password reset OTP |
| POST | `/api/portal/auth/forgot-password/verify-otp` | Open (Rate Limited) | Verify password reset OTP |
| POST | `/api/portal/auth/forgot-password/reset` | Open (Rate Limited) | Reset password using verified OTP |
| POST | `/api/portal/auth/logout` | JWT-Portal | Logout & invalidate portal user session |
| GET | `/api/portal/auth/me` | JWT-Portal | Retrieve profile and linked businesses |
| PUT | `/api/portal/profile` | JWT-Portal | Update portal user profile |
| PUT | `/api/portal/auth/change-password` | JWT-Portal | Change portal user password |

---

### Telemetry & Website Analytics (`/api/analytics/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/analytics/track` | Open | Ingest website visitor pageview & telemetry data |
| POST | `/api/analytics/heartbeat` | Open | Active session ping & duration tracker |
| GET | `/api/analytics/summary` | Open / Retrop | Retrieve aggregated visitor stats, geo distribution, and login audit logs |

---

### Owner Portal Workplace (`/api/owner/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/owner/dashboard/summary` | JWT-Owner / Portal | Sales, gross profit, top dishes, loyalty summary |
| GET | `/api/owner/dashboard/export` | JWT-Owner / Portal | Export sales ledger report as CSV |
| POST | `/api/owner/restaurant/logo` | JWT-Owner / Portal | Upload custom restaurant logo to Supabase |
| GET | `/api/owner/managers` | JWT-Owner / Portal | List restaurant managers |
| POST | `/api/owner/managers` | JWT-Owner (Zod-validated) | Create manager profile |
| DELETE | `/api/owner/managers/:adminId` | JWT-Owner / Portal | Delete manager profile |
| PUT | `/api/owner/managers/:adminId/password` | JWT-Owner (Zod-validated) | Reset manager password |
| GET | `/api/owner/inventory/vendors` | JWT-Owner / Portal | List suppliers |
| POST | `/api/owner/inventory/vendors` | JWT-Owner (Zod-validated) | Create vendor profile |
| PUT | `/api/owner/inventory/vendors/:vendorId` | JWT-Owner (Zod-validated) | Update vendor profile |
| DELETE | `/api/owner/inventory/vendors/:vendorId` | JWT-Owner / Portal | Delete vendor profile |
| GET | `/api/owner/inventory/items` | JWT-Owner / Portal | List ingredients and stock levels |
| POST | `/api/owner/inventory/items` | JWT-Owner (Zod-validated) | Create ingredient stock item |
| PUT | `/api/owner/inventory/items/:itemId` | JWT-Owner (Zod-validated) | Update ingredient item |
| DELETE | `/api/owner/inventory/items/:itemId` | JWT-Owner / Portal | Delete ingredient item |
| GET | `/api/owner/inventory/recipes` | JWT-Owner / Portal | Retrieve BOM recipe mappings |
| POST | `/api/owner/inventory/recipes` | JWT-Owner (Zod-validated) | Create or update dish recipe BOM |
| DELETE | `/api/owner/inventory/recipes/:dishId` | JWT-Owner / Portal | Delete dish recipe |
| GET | `/api/owner/inventory/purchases` | JWT-Owner / Portal | List logged purchase entries |
| POST | `/api/owner/inventory/purchases` | JWT-Owner (Zod-validated) | Log new purchase entry (increments stock) |
| GET | `/api/owner/menu-management` | JWT-Owner / Portal | List all menu items |
| GET | `/api/owner/menu-management/categories` | JWT-Owner / Portal | List menu categories |
| GET | `/api/owner/menu-management/stats` | JWT-Owner / Portal | Menu statistics & popularity |
| GET | `/api/owner/menu-management/:dishId` | JWT-Owner / Portal | Retrieve specific dish details |
| POST | `/api/owner/menu-management` | JWT-Owner / Portal | Add new dish |
| PUT | `/api/owner/menu-management/:dishId` | JWT-Owner / Portal | Update dish details |
| DELETE | `/api/owner/menu-management/:dishId` | JWT-Owner / Portal | Delete dish |
| PATCH | `/api/owner/menu-management/:dishId/availability` | JWT-Owner / Portal | Toggle dish availability |
| PATCH | `/api/owner/menu-management/category/:category/availability` | JWT-Owner / Portal | Toggle category availability |
| POST | `/api/owner/menu-management/:dishId/image` | JWT-Owner / Portal | Upload dish image |
| DELETE | `/api/owner/menu-management/:dishId/image` | JWT-Owner / Portal | Remove dish image |
| GET | `/api/owner/restaurant-info` | JWT-Owner / Portal | Get profile settings & Google review URL |
| PUT | `/api/owner/restaurant-info` | JWT-Owner / Portal | Update profile settings, taxes, review link |
| GET | `/api/owner/analytics` | JWT-Owner / Portal | Retrieve sales, profit & tax analytics |
| GET | `/api/owner/gst/gstr1` | JWT-Owner / Portal | Fetch GSTR-1 compliance JSON payload |
| GET | `/api/owner/gst/gstr3b` | JWT-Owner / Portal | Fetch GSTR-3B compliance JSON payload |
| PUT | `/api/owner/menu/:dishId/hsn` | JWT-Owner / Portal | Update dish HSN tax code |
| GET | `/api/owner/orders` | JWT-Owner / Portal | Returns paginated list of restaurant orders |
| GET | `/api/owner/orders/:orderId/pdf` | JWT-Owner / Portal | Generate and return thermal PDF bill |
| GET | `/api/owner/reviews` | JWT-Owner / Portal | Paginated customer feedback reviews |
| GET | `/api/owner/staff` | JWT-Owner / Portal | Returns aggregated staff registry (managers, waiters, chefs, others) |
| POST | `/api/owner/staff` | JWT-Owner (Zod-validated) | Create staff account |
| DELETE | `/api/owner/staff/:type/:id` | JWT-Owner / Portal | Remove staff member |
| PUT | `/api/owner/staff/:type/:id/password` | JWT-Owner (Zod-validated) | Reset staff password |
| GET | `/api/owner/expenses` | JWT-Owner / Portal | List operational expenses |
| POST | `/api/owner/expenses` | JWT-Owner (Zod-validated) | Log operational expense |
| DELETE | `/api/owner/expenses/:expenseId` | JWT-Owner / Portal | Delete expense entry |
| GET | `/api/owner/day-close` | JWT-Owner / Portal | Get daily cash close register stats |
| POST | `/api/owner/day-close` | JWT-Owner (Zod-validated) | Submit cash day close register |

---

### Retrop SuperAdmin Control Plane (`/api/retrop/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/retrop/login` | Open (Rate Limited) | Retrop SuperAdmin login |
| POST | `/api/retrop/refresh` | Open | Refresh SuperAdmin JWT |
| POST | `/api/retrop/logout` | JWT-Retrop | Logout SuperAdmin |
| GET | `/api/retrop/me` | JWT-Retrop | Get SuperAdmin profile |
| GET | `/api/retrop/dashboard` | JWT-Retrop | Global platform metrics & revenue stats |
| GET | `/api/retrop/restaurants` | JWT-Retrop | List all onboarded restaurants |
| POST | `/api/retrop/restaurants` | JWT-Retrop (Limiter) | Onboard new restaurant & send credentials |
| GET | `/api/retrop/restaurants/:id` | JWT-Retrop | Single restaurant detail & keys |
| PUT | `/api/retrop/restaurants/:id` | JWT-Retrop | Update restaurant info |
| DELETE | `/api/retrop/restaurants/:id` | JWT-Retrop | Delete restaurant & purge tenant data |
| POST | `/api/retrop/keys/generate` | JWT-Retrop | Generate new product key |
| PUT | `/api/retrop/keys/:keyId/status` | JWT-Retrop | Activate / revoke product key |
| GET | `/api/retrop/keys` | JWT-Retrop | List all product keys |
| GET | `/api/retrop/config` | JWT-Retrop | Get business configuration |
| PUT | `/api/retrop/config` | JWT-Retrop | Update business configuration |
| GET | `/api/retrop/plans` | JWT-Retrop | List pricing plans |
| POST | `/api/retrop/plans` | JWT-Retrop | Create pricing plan |
| PUT | `/api/retrop/plans/:planId` | JWT-Retrop | Update pricing plan |
| DELETE | `/api/retrop/plans/:planId` | JWT-Retrop | Delete pricing plan |
| GET | `/api/retrop/transactions` | JWT-Retrop | List financial transactions ledger |
| GET | `/api/retrop/transactions/:id/invoice` | JWT-Retrop | Download transaction PDF invoice |
| GET | `/api/retrop/subscriptions` | JWT-Retrop | List all restaurant subscriptions |
| PUT | `/api/retrop/subscriptions/:id` | JWT-Retrop | Manually extend or modify subscription |
| POST | `/api/retrop/transactions/confirm` | JWT-Retrop (Limiter) | Confirm manual payment & issue product key |

---

## Infrastructure & Deployments

### Vercel Production Deployments

The frontend projects (`Retrop_Website`, `Retrop_Admin_Dashboard`, `Retrop_RMS_Frontend`) contain `vercel.json` rewrite files to support single-page application routing without 404 errors:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Smart CORS Whitelisting

The backend `Server/src/index.js` dynamically enforces CORS based on origin inspection:

1. **Development mode**: Allows `http://localhost:*`, `http://127.0.0.1:*`, and `*.ngrok-free.app` / `*.ngrok.io`.
2. **Production mode**: Dynamically allows `https://retrop.vercel.app`, `https://retrop-rms.vercel.app`, `https://retrop-admin.vercel.app`, any `*.vercel.app` preview deployments, and custom domains specified in `ALLOWED_ORIGINS` environment variable.

---

## Known Constraints & Technical Debt

- **Invoice Storage Bucket**: Subscription PDF invoices share the `menu-images` public storage bucket. Production hardening should migrate these to a private bucket (`invoices`) with signed URLs.
- **GSTR Export Formats**: GSTR-1 and GSTR-3B compliance endpoints output structured JSON objects. Excel (`.xlsx`) export utility script should be added for direct portal download.
- **Image Security Validation**: Uploads undergo header magic-bytes checking. Large images should be resized/compressed via Sharp before writing to Supabase.
