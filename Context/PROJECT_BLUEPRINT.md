# Project Blueprint

## Last Updated
2026-06-21 | Updated by: Antigravity AI Agent

---

## Project Overview

This is a **Restaurant Automation System** — a multi-surface platform that digitises the full dine-in experience for a single restaurant. Customers scan a QR code at their table and are guided through a self-service ordering flow on a React web app. Restaurant staff (manager, waiters, kitchen) use a cross-platform React Native / Expo mobile app to manage everything from menu configuration to real-time order processing. A single Node.js / Express backend with Socket.io powers all three surfaces and is backed by Supabase (PostgreSQL) for persistence and Redis for ephemeral session state, push-token tracking, and daily order counters.

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
| **Authentication** | JWT (jsonwebtoken) | ^9.0.3 | Access token 15 min, refresh 7 days |
| **Password hashing** | bcryptjs | ^3.0.3 | Salt rounds: 10 |
| **Push notifications** | Firebase Admin SDK | firebase-admin ^13.10.0 | FCM for waiter + kitchen devices |
| **Security** | Helmet | ^8.2.0 | HTTP headers hardening |
| **Rate limiting** | express-rate-limit | ^8.5.2 | Per-route limits defined in constants.js |
| **Dev server** | nodemon | ^3.1.14 | Watch mode for backend |
| **Mobile app framework** | Expo | ~56.0.4 | Managed workflow |
| **Mobile routing** | expo-router | ~56.2.6 | File-based routing |
| **Mobile language** | TypeScript | ~6.0.3 | App only |
| **Mobile UI** | React Native | 0.85.3 | — |
| **Mobile animations** | react-native-reanimated | 4.3.1 | — |
| **Mobile storage (secure)** | expo-secure-store | ~56.0.4 | JWT token storage |
| **Mobile storage (async)** | @react-native-async-storage/async-storage | 2.2.0 | Server URL config |
| **Mobile notifications** | expo-notifications | ~56.0.15 | Expo push + FCM token |
| **Mobile socket client** | socket.io-client | ^4.8.3 | Waiter, kitchen, manager real-time |
| **Frontend framework** | React | ^18.3.1 | Vite SPA |
| **Frontend bundler** | Vite | ^5.4.1 | Port 5173 |
| **Frontend routing** | react-router-dom | ^6.26.0 | Client-side SPA routing |
| **Frontend animations** | framer-motion | ^11.3.31 | — |
| **Frontend icons** | lucide-react | ^0.441.0 | — |
| **Frontend socket client** | socket.io-client | ^4.8.3 | Customer order tracking |
| **EAS (Expo build)** | EAS | projectId: 327b3a19-5b7d-4a39-adbc-5daec9bfa88b | App/eas.json |

---

## Repository Structure

```
Resturant-Automation/
├── AI Project Context/          ← This folder — authoritative AI context files
├── App/                         ← Cross-platform Expo / React Native mobile app
│   ├── app.json                 ← Expo config (name, slug, plugins, EAS projectId)
│   ├── eas.json                 ← EAS build profiles
│   ├── package.json             ← App dependencies
│   ├── tsconfig.json            ← TypeScript config
│   ├── eslint.config.js         ← ESLint config
│   ├── IMPLEMENTATION_SUMMARY.md← Developer change log for last major feature
│   ├── assets/                  ← Icons, splash images
│   ├── scripts/                 ← reset-project.js utility
│   └── src/
│       ├── app/                 ← expo-router file-based screens
│       │   ├── _layout.tsx      ← Root layout: initialises API URL, wraps context providers
│       │   ├── index.tsx        ← Landing / role-select / auto-redirect
│       │   ├── login.tsx        ← Unified login screen (Manager / Waiter / Kitchen tabs)
│       │   ├── setup.tsx        ← Server URL setup screen (first-run)
│       │   ├── explore.tsx      ← (Expo starter screen, unused in production)
│       │   ├── manager/         ← Manager screens (auth-guarded, socket-connected)
│       │   │   ├── _layout.tsx  ← Manager tab bar (Home, Waiters, Kitchen, Tables, Menu, Analytics, Info, Logout)
│       │   │   ├── dashboard.tsx
│       │   │   ├── waiters.tsx
│       │   │   ├── kitchen.tsx
│       │   │   ├── menu.tsx
│       │   │   ├── tables.tsx
│       │   │   ├── analytics.tsx
│       │   │   └── restaurant-info.tsx
│       │   ├── waiter/          ← Waiter screens (auth-guarded)
│       │   │   ├── _layout.tsx
│       │   │   ├── dashboard.tsx
│       │   │   ├── active-orders.tsx
│       │   │   └── order-detail.tsx
│       │   └── kitchen/         ← Kitchen screens (auth-guarded)
│       │       ├── _layout.tsx
│       │       └── dashboard.tsx ← Horizontal Kanban (Queue → Preparing → Ready → Serving)
│       ├── components/          ← Shared UI components
│       │   ├── ScreenAnimationWrapper.tsx
│       │   ├── SkeletonLoader/
│       │   ├── animated-icon.tsx / .web.tsx
│       │   ├── app-tabs.tsx / .web.tsx
│       │   ├── ui/
│       │   └── ...
│       ├── config/
│       │   └── api.ts           ← All endpoint definitions + dynamic server URL logic
│       ├── constants/           ← (directory exists, contents not examined)
│       ├── context/
│       │   ├── AuthContext.tsx  ← Manager JWT state
│       │   ├── WaiterAuthContext.tsx
│       │   ├── KitchenAuthContext.tsx
│       │   └── ThemeContext.tsx ← Light/dark theme
│       ├── hooks/
│       │   ├── use-color-scheme.ts / .web.ts
│       │   └── use-theme.ts
│       ├── services/
│       │   ├── authService.ts   ← Manager login/refresh API calls
│       │   └── notificationService.ts ← Expo FCM token + notification listeners
│       └── utils/
│           ├── apiClient.ts     ← fetch wrapper with auto-refresh + disabled-account handling
│           ├── socket.ts        ← Singleton Socket.io client
│           ├── storage.ts       ← TokenStorage, WaiterStorage, KitchenStorage (SecureStore)
│           └── serverUrlStorage.ts ← AsyncStorage server URL persistence
│
├── Frontend/                    ← Customer-facing React Vite SPA (served on LAN / deployed)
│   ├── .env / .env.example      ← VITE_API_URL
│   ├── index.html               ← Vite HTML entry
│   ├── vite.config.js           ← Vite config + QR-code-on-start plugin
│   ├── package.json
│   ├── INTEGRATION_GUIDE.md
│   └── src/
│       ├── main.jsx             ← React DOM entry
│       ├── App.jsx              ← Root router (website flow + customer order flow)
│       ├── assets/
│       ├── components/          ← Shared UI components
│       │   ├── BillView/        ← Bill / invoice display
│       │   ├── CartDrawer/      ← Slide-out cart
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
│       │   └── OrderContext.jsx ← Global cart + session state (sessionStorage-persisted)
│       ├── hooks/
│       │   └── useRestaurantData.js ← Loads public/data.json for website content
│       ├── pages/
│       │   ├── Home/            ← Main restaurant website homepage
│       │   ├── QRLanding/       ← Step 1: QR scan entry; creates order session
│       │   ├── CustomerInfo/    ← Step 2: Customer enters name + mobile
│       │   ├── WaitingWaiter/   ← Step 3: Polls until waiter accepts
│       │   ├── Menu/            ← Step 4: Browse and add items
│       │   ├── Cart/            ← Step 5: Review cart before placing
│       │   ├── OrderPlaced/     ← Legacy redirect (now OrderTracking)
│       │   ├── OrderTracking/   ← Step 6+: Live order status after placing
│       │   ├── ThankYou/        ← Final bill page (/bill/:orderId)
│       │   ├── PublicMenu/      ← Read-only public menu at /menu
│       │   ├── NotFound/        ← 404 page
│       │   └── WaitingWaiter/
│       ├── services/
│       │   └── api.js           ← All customer-facing API calls (centralised fetch wrapper)
│       ├── styles/
│       └── utils/
│
└── Backend/                     ← Node.js / Express API server
    ├── .env / .env.example      ← All env vars (see Environment section)
    ├── package.json
    └── src/
        ├── index.js             ← Server entry: Express + Socket.io setup, graceful shutdown
        ├── config/
        │   ├── constants.js     ← SERVER_CONFIG, JWT_CONFIG, RATE_LIMIT_CONFIG, HELMET_CONFIG
        │   ├── env.js           ← dotenv loader (must be imported first)
        │   ├── redis.js         ← Redis client singleton + helper wrappers + REDIS_KEYS namespaces
        │   └── supabase.js      ← Supabase client (anon + service role)
        ├── controllers/
        │   ├── adminController.js
        │   ├── customerOrderController.js
        │   ├── healthController.js
        │   ├── kitchenController.js
        │   ├── managerController.js
        │   ├── menuController.js
        │   ├── restaurantInfoController.js
        │   ├── restaurantSettingsController.js
        │   └── waiterController.js
        ├── middleware/
        │   ├── auth.js              ← JWT verification + RBAC (requireRole)
        │   ├── restaurantOpen.js    ← Blocks customer routes when restaurant closed
        │   ├── security.js          ← Helmet + general rate limiter
        │   └── waiterKitchenAuth.js ← Separate JWT middleware for waiter + kitchen
        ├── migrations/              ← Ordered SQL migration files (run in Supabase SQL editor)
        │   ├── 001_create_tables.sql
        │   ├── 002_admin_auth.sql
        │   ├── 003_menu_images_storage.sql
        │   ├── 004_restaurant_settings.sql
        │   ├── 005_order_system_tables.sql
        │   ├── 006_order_token_field.sql
        │   ├── 007_tax_type.sql
        │   ├── 008_order_locked_items.sql
        │   ├── 009_discount_field.sql
        │   ├── 010_order_discount_fields.sql
        │   ├── 011_invoice_no_field.sql
        │   └── 012_add_cancellation_reason.sql
        ├── routes/
        │   └── routes.js        ← All route definitions (245 lines)
        ├── services/
        │   ├── authService.js
        │   ├── database.js
        │   ├── kitchenAuthService.js
        │   ├── managerService.js
        │   ├── menuService.js
        │   ├── notificationService.js ← FCM via Firebase Admin SDK
        │   ├── orderAnalyticsService.js
        │   ├── orderSessionService.js ← Full order lifecycle (1,056 lines)
        │   ├── restaurantInfoService.js
        │   ├── restaurantSettingsService.js
        │   ├── socketService.js   ← Socket.io connection handler + session manager
        │   ├── tableService.js
        │   ├── waiterAuthService.js
        │   └── waiterService.js
        ├── utils/
        │   ├── logger.js        ← Winston-style logger
        │   └── time.js          ← nowIST(), todayDateIST() helpers (IST timezone)
        └── scripts/
            ├── createAdmin.js   ← CLI script to seed first admin account
            └── check_columns.js ← Schema inspection helper
```

---

## Data Models & Schemas

All tables reside in **Supabase (PostgreSQL)**. Column names use camelCase quoted identifiers.

### `admin`
*(Source: `002_admin_auth.sql`)*

| Field | Type | Notes |
|---|---|---|
| adminId | UUID PK | gen_random_uuid() |
| mobile | VARCHAR(20) UNIQUE | Login credential |
| password | VARCHAR(255) | bcrypt hashed |
| name | VARCHAR(255) | — |
| role | VARCHAR(50) | Values: `'owner'`, `'manager'` |
| email | VARCHAR(255) | Optional |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `admin_session`
*(Source: `002_admin_auth.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| adminId | UUID FK → admin | ON DELETE CASCADE |
| accessToken | VARCHAR(500) | JWT access token |
| refreshToken | VARCHAR(500) | JWT refresh token |
| tokenExpiresAt | TIMESTAMPTZ | Access token expiry |
| refreshTokenExpiresAt | TIMESTAMPTZ | — |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| isActive | BOOLEAN | Set false on logout |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `login_attempt`
*(Source: `002_admin_auth.sql`)*

| Field | Type | Notes |
|---|---|---|
| attemptId | UUID PK | — |
| mobile | VARCHAR(20) | — |
| ipAddress | VARCHAR(50) | — |
| success | BOOLEAN | — |
| failureReason | VARCHAR(255) | e.g. `'invalid_password'`, `'user_not_found'` |
| createdAt | TIMESTAMPTZ | — |

### `waiter`
*(Source: `001_create_tables.sql`, `005_order_system_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| waiterId | UUID PK | — |
| waiterName | VARCHAR(255) | — |
| mobile | VARCHAR(20) UNIQUE | Login credential |
| password | VARCHAR(255) | bcrypt hashed |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | Added in migration 005 |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `waiter_session`
*(Source: `001_create_tables.sql`, `005_order_system_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| waiterId | UUID FK → waiter | ON DELETE CASCADE |
| socketId | VARCHAR(255) | Socket.io connection ID |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| lastActivityAt | TIMESTAMPTZ | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | Added in migration 005 |

### `waiter_daily_stats`
*(Source: `001_create_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| statsId | UUID PK | — |
| waiterId | UUID FK → waiter | ON DELETE CASCADE |
| statsDate | DATE | — |
| totalOrders | INTEGER | Default 0 |
| completedOrders | INTEGER | Default 0 |
| totalEarnings | DECIMAL(10,2) | Default 0 |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |
| — | UNIQUE | `(waiterId, statsDate)` |

### `kitchen`
*(Source: `005_order_system_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| kitchenId | UUID PK | — |
| kitchenName | VARCHAR(255) | — |
| mobile | VARCHAR(20) UNIQUE | Login credential |
| password | VARCHAR(255) | bcrypt hashed |
| isActive | BOOLEAN | Default true |
| lastLogIn | TIMESTAMPTZ | — |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `kitchen_session`
*(Source: `005_order_system_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| kitchenId | UUID FK → kitchen | ON DELETE CASCADE |
| socketId | VARCHAR(255) | — |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `manager_session`
*(Source: `001_create_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| sessionId | UUID PK | — |
| adminId | UUID FK → admin | ON DELETE CASCADE |
| socketId | VARCHAR(255) | Socket.io connection ID |
| ipAddress | VARCHAR(50) | — |
| userAgent | TEXT | — |
| lastActivityAt | TIMESTAMPTZ | — |
| inactivityTimeout | INTEGER | Default 1800 (30 min in seconds) |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `customer`
*(Source: `001_create_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| mobile | VARCHAR(20) PK | Phone number as unique identifier |
| name | VARCHAR(255) | — |
| lastLogIn | TIMESTAMPTZ | — |
| totalorders | INTEGER | Cached order count |
| fcmToken | VARCHAR(255) | Firebase push token |
| isActive | BOOLEAN | Default true |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `menu`
*(Source: `001_create_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| dishId | UUID PK | — |
| dishName | VARCHAR(255) | — |
| price | DECIMAL(10,2) | — |
| isAvailable | BOOLEAN | Default true |
| category | VARCHAR(100) | e.g. `'Appetizer'`, `'Main Course'`, `'Dessert'` |
| description | TEXT | — |
| imageUrl | VARCHAR(500) | Supabase Storage public URL |
| preparationTime | INTEGER | Minutes; default 15 |
| spicyLevel | VARCHAR(50) | e.g. `'Mild'`, `'Medium'`, `'Spicy'` |
| isVegetarian | BOOLEAN | Default false |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `restaurant_table`
*(Source: `001_create_tables.sql`)*

| Field | Type | Notes |
|---|---|---|
| tableId | UUID PK | — |
| tableNo | INTEGER UNIQUE | Displayed table number |
| capacity | INTEGER | Default 2 |
| isAvailable | BOOLEAN | Default true |
| currentOrder | UUID FK → orders | ON DELETE SET NULL; deferred FK |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `orders`
*(Source: `001_create_tables.sql`, migrations 005–012)*

| Field | Type | Notes |
|---|---|---|
| ordersId | UUID PK | — |
| mobile | VARCHAR(20) FK → customer | ON DELETE CASCADE |
| waiterId | UUID FK → waiter | ON DELETE SET NULL |
| tableNo | INTEGER FK → restaurant_table(tableNo) | ON DELETE SET NULL |
| orderStatus | VARCHAR(50) | Values: `'ordering'`, `'preparing'`, `'ready'`, `'serving'`, `'completed'`, `'cancelled'` |
| ordersInfo | JSONB | Array: `[{dishId, dishName, price, quantity, remarks}]` |
| ordersUpdateInfo | JSONB | Array of modification logs |
| lockedItems | JSONB | Snapshot at `ready` status; prevents removal after served (migration 008) |
| totalAmount | DECIMAL(10,2) | Subtotal before tax |
| finalAmount | DECIMAL(10,2) | After taxes and discounts (migration 005) |
| taxBreakdown | JSONB | `[{name, percent, amount, inclusive}]` (migration 005) |
| gstAmount | DECIMAL(10,2) | Total GST amount (migration 005) |
| discountAmount | DECIMAL(10,2) | Total discount applied (migration 010) |
| discountBreakdown | JSONB | `[{name, percent, amount}]` (migration 010) |
| isPaymentCompleted | BOOLEAN | Default false |
| paymentMethod | VARCHAR(50) | Values: `'cash'`, `'online'`, `'upi'` |
| invoice | VARCHAR(500) | URL/path to PDF invoice |
| invoiceNo | VARCHAR(20) | Format: `INV{YYYYMMDD}{4-digit-seq}` (migration 011) |
| dailyOrderNo | INTEGER | Per-day counter from Redis INCR (migration 005) |
| orderNumber | VARCHAR(20) | e.g. `"#42"` (migration 005) |
| customerToken | VARCHAR(64) | Re-scan QR token (migration 006) |
| tokenValidUntil | TIMESTAMPTZ | acceptedAt + 5 hours (migration 006) |
| cancellationReason | TEXT | (migration 012) |
| servedAt | TIMESTAMPTZ | — |
| readyAt | TIMESTAMPTZ | (migration 005) |
| preparationStartedAt | TIMESTAMPTZ | (migration 005) |
| completedAt | TIMESTAMPTZ | (migration 005) |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### `restaurant_settings`
*(Source: `004_restaurant_settings.sql`)*

| Field | Type | Notes |
|---|---|---|
| settingsId | INTEGER PK | Always 1 (single-row table) |
| isRestaurantOpen | BOOLEAN | Default false |
| updatedAt | TIMESTAMPTZ | — |
| updatedBy | UUID FK → admin | ON DELETE SET NULL |

### `restaurant_info`
*(Source: `005_order_system_tables.sql`, migrations 007, 009)*

| Field | Type | Notes |
|---|---|---|
| infoId | INTEGER PK | Always 1 (single-row table) |
| restaurantName | VARCHAR(255) | Default: `'My Restaurant'` |
| address | TEXT | — |
| mobile | VARCHAR(20) | — |
| isGST | BOOLEAN | Default false |
| GSTIN | VARCHAR(50) | GST Identification Number |
| taxes | JSONB | `[{name, percent}]` e.g. CGST 9%, SGST 9% |
| taxType | VARCHAR(20) | `'inclusive'` or `'exclusive'`; default `'exclusive'` (migration 007) |
| discounts | JSONB | `[{name, percent, isActive}]` (migration 009) |
| createdAt | TIMESTAMPTZ | — |
| updatedAt | TIMESTAMPTZ | — |

### Redis Key Namespaces
*(Source: `Backend/src/config/redis.js`)*

| Key Pattern | Purpose | TTL |
|---|---|---|
| `order_session:{tableId}` | Active customer order session object | 20 min (extendable) |
| `waiter_fcm_tokens` | SET of waiter IDs with active FCM tokens | No TTL |
| `waiter_fcm:{waiterId}` | Individual waiter FCM token string | No TTL |
| `kitchen_fcm_tokens` | SET of kitchen IDs with active FCM tokens | No TTL |
| `kitchen_fcm:{kitchenId}` | Individual kitchen FCM token string | No TTL |
| `waiter_session:{waiterId}` | Waiter JWT session data | — |
| `kitchen_session:{kitchenId}` | Kitchen JWT session data | — |
| `daily_order_counter:{dateStr}` | Atomic order counter for dailyOrderNo | 48 hours |
| `restaurant_info` | Cached restaurant info | 5 min (noted in code) |
| `menu_cache` | Cached menu items | 5 min (noted in code) |

### Supabase Storage Bucket: `menu-images`
*(Source: `003_menu_images_storage.sql`)*
- Public bucket; 5 MB per image limit
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Path pattern: `menu-images/{dishId}/{filename}`
- Public URL: `{SUPABASE_URL}/storage/v1/object/public/menu-images/{path}`

---

## API Surface

All routes defined in `Backend/src/routes/routes.js`.

**Auth notation:** `JWT-Admin` = `authMiddleware`; `JWT-Waiter` = `waiterAuthMiddleware`; `JWT-Kitchen` = `kitchenAuthMiddleware`; `Open` = no auth required.

### Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Open | Returns health status |

### Admin / Manager Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/admin/login` | Open (rate-limited: 5/15min) | Body: `{mobile, password}`; Returns: `{accessToken, refreshToken, admin}` |
| POST | `/api/admin/refresh` | Open | Body: `{refreshToken}`; Returns: new `accessToken` |
| POST | `/api/admin/logout` | JWT-Admin | Invalidates current session |
| GET | `/api/admin/profile` | JWT-Admin | Returns admin object |

### Manager — Profile & Dashboard

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/profile` | JWT-Admin + role=manager | Returns manager profile |
| GET | `/api/manager/dashboard/summary` | JWT-Admin + role=manager | Dashboard summary stats |

### Manager — Waiter Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/waiters` | JWT-Admin + role=manager | All waiters |
| GET | `/api/manager/waiters/active` | JWT-Admin + role=manager | Active waiters only |
| GET | `/api/manager/waiters/:waiterId` | JWT-Admin + role=manager | Single waiter profile |
| GET | `/api/manager/waiters/:waiterId/tables` | JWT-Admin + role=manager | Waiter's current tables |
| POST | `/api/manager/waiters` | JWT-Admin + role=manager | Add waiter; Body: `{waiterName, mobile, password}` |
| DELETE | `/api/manager/waiters/:waiterId` | JWT-Admin + role=manager | Delete waiter |
| PATCH | `/api/manager/waiters/:waiterId/reset-password` | JWT-Admin + role=manager | Reset password |
| PATCH | `/api/manager/waiters/:waiterId/status` | JWT-Admin + role=manager | Toggle isActive |

### Manager — Kitchen Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/kitchen` | JWT-Admin + role=manager | All kitchen accounts |
| POST | `/api/manager/kitchen` | JWT-Admin + role=manager | Add kitchen account |
| DELETE | `/api/manager/kitchen/:kitchenId` | JWT-Admin + role=manager | Delete kitchen account |
| PATCH | `/api/manager/kitchen/:kitchenId/status` | JWT-Admin + role=manager | Toggle isActive |

### Manager — Analytics

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/admins/analytics` | JWT-Admin + role=manager or owner | Comprehensive analytics |
| GET | `/api/manager/analytics/orders` | JWT-Admin + role=manager | All orders with full details |
| GET | `/api/manager/analytics/orders/:orderId` | JWT-Admin + role=manager | Single order full detail |

### Manager — Table Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/tables` | JWT-Admin + role=manager | All tables |
| GET | `/api/manager/tables/statistics` | JWT-Admin + role=manager | Table statistics |
| GET | `/api/manager/tables/occupancy-trend` | JWT-Admin + role=manager | Occupancy trend data |
| GET | `/api/manager/tables/:tableNo` | JWT-Admin + role=manager | Single table details |
| POST | `/api/manager/tables` | JWT-Admin + role=manager | Add table; Body: `{tableNo, capacity}` |
| DELETE | `/api/manager/tables/:tableNo` | JWT-Admin + role=manager | Delete table |
| PATCH | `/api/manager/tables/:tableNo/capacity` | JWT-Admin + role=manager | Update capacity |

### Manager — Menu Management

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/menu` | JWT-Admin + role=manager | All menu items |
| GET | `/api/manager/menu/categories` | JWT-Admin + role=manager | Distinct categories |
| GET | `/api/manager/menu/stats` | JWT-Admin + role=manager | Menu statistics |
| GET | `/api/manager/menu/:dishId` | JWT-Admin + role=manager | Single menu item |
| POST | `/api/manager/menu` | JWT-Admin + role=manager | Add menu item |
| PUT | `/api/manager/menu/:dishId` | JWT-Admin + role=manager | Update menu item |
| DELETE | `/api/manager/menu/:dishId` | JWT-Admin + role=manager | Delete menu item |
| PATCH | `/api/manager/menu/:dishId/availability` | JWT-Admin + role=manager | Toggle isAvailable |
| PATCH | `/api/manager/menu/category/:category/availability` | JWT-Admin + role=manager | Toggle category availability |
| POST | `/api/manager/menu/:dishId/image` | JWT-Admin + role=manager | Upload dish image (raw binary body, up to 6 MB) |
| DELETE | `/api/manager/menu/:dishId/image` | JWT-Admin + role=manager | Delete dish image from Supabase Storage |

### Manager — Settings & Restaurant Info

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/manager/settings` | JWT-Admin + role=manager | Gets `isRestaurantOpen` |
| PATCH | `/api/manager/settings/toggle` | JWT-Admin + role=manager | Toggles open/closed |
| GET | `/api/manager/restaurant-info` | JWT-Admin + role=manager | Gets restaurant_info row |
| PUT | `/api/manager/restaurant-info` | JWT-Admin + role=manager | Updates restaurant_info |
| GET | `/api/public/restaurant-info` | Open (rate-limited) | Same restaurant_info; used by customer web |

### Waiter Auth & Operations

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/waiter/login` | Open (rate-limited: 10/15min) | Body: `{mobile, password}`; Returns: `{accessToken, refreshToken, waiter}` |
| POST | `/api/waiter/refresh` | Open | Body: `{refreshToken}` |
| POST | `/api/waiter/logout` | JWT-Waiter | — |
| POST | `/api/waiter/fcm-token` | JWT-Waiter | Body: `{fcmToken}`; Stores in Redis |
| GET | `/api/waiter/dashboard` | JWT-Waiter | Stats + active orders |
| GET | `/api/waiter/pending-sessions` | JWT-Waiter | Pending customer sessions needing acceptance |
| GET | `/api/waiter/menu` | JWT-Waiter | Full menu for waiter |
| GET | `/api/waiter/active-orders` | JWT-Waiter | All active orders for this waiter |
| POST | `/api/waiter/orders/:tableId/accept` | JWT-Waiter | Waiter accepts customer session; sets customerToken |
| GET | `/api/waiter/orders/:orderId` | JWT-Waiter | Order detail |
| PATCH | `/api/waiter/orders/:orderId/modify` | JWT-Waiter | Add/remove/update items; Body: `{action, items, remarks}` |
| PATCH | `/api/waiter/orders/:orderId/status` | JWT-Waiter | Update order status |
| POST | `/api/waiter/orders/:orderId/conclude` | JWT-Waiter | Collect payment; Body: `{paymentMethod}`; triggers tax + discount calc |
| GET | `/api/waiter/orders/:orderId/bill-preview` | JWT-Waiter | Preview bill before concluding |

### Kitchen Auth & Operations

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/kitchen/login` | Open (rate-limited: 10/15min) | Body: `{mobile, password}` |
| POST | `/api/kitchen/refresh` | Open | — |
| POST | `/api/kitchen/logout` | JWT-Kitchen | — |
| POST | `/api/kitchen/fcm-token` | JWT-Kitchen | Body: `{fcmToken}` |
| GET | `/api/kitchen/dashboard` | JWT-Kitchen | All active/pending orders |
| PATCH | `/api/kitchen/orders/:orderId/start` | JWT-Kitchen | Mark order as `preparing` |
| PATCH | `/api/kitchen/orders/:orderId/ready` | JWT-Kitchen | Mark order as `ready`; locks items; notifies waiter |
| PATCH | `/api/kitchen/orders/:orderId/addon/:addonId/done` | JWT-Kitchen | Acknowledge a customer add-on batch |
| GET | `/api/kitchen/orders/:orderId` | JWT-Kitchen | Order detail for kitchen view |

### Public Customer Order Flow

All routes additionally guarded by `requireRestaurantOpen` middleware (returns 403 if closed), except `getOrderBill` and `getPublicMenu`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/order/session` | Open + RestaurantOpen | Body: `{tableId}`; Creates 20-min Redis session |
| POST | `/api/order/session/customer-info` | Open + RestaurantOpen | Body: `{tableId, sessionToken, customerName, customerMobile}`; Notifies waiters via FCM |
| GET | `/api/order/session/:tableId/status` | Open + RestaurantOpen | Polling endpoint; returns current session state |
| GET | `/api/order/menu` | Open | Public menu (Redis-cached 5 min) |
| POST | `/api/order/place` | Open + RestaurantOpen | Body: `{tableId, sessionToken, items}`; Creates order in DB; notifies kitchen |
| GET | `/api/order/:orderId/bill` | Open | Final bill after payment; 400 if payment not completed |
| GET | `/api/order/:tableId/order-status` | Open + RestaurantOpen | Query: `?token=xxx`; Customer order tracking |
| POST | `/api/order/:orderId/customer-modify` | Open + RestaurantOpen | Body: `{token, action, items}`; Customer add/modify items |
| GET | `/api/order/:tableId/token-check` | Open + RestaurantOpen | Query: `?token=xxx`; Validates re-scan token |

---

## Environment & Infrastructure

### Backend Environment Variables
*(Source: `Backend/.env.example`)*

| Variable | Purpose |
|---|---|
| `PORT` | Express server port (default 3000 if unset; from constants.js) |
| `NODE_ENV` | `'development'` or `'production'` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS — keep secret) |
| `JWT_SECRET` | Secret for admin access tokens |
| `JWT_REFRESH_SECRET` | Secret for admin refresh tokens |
| `REDIS_URL` | Redis connection URL (app degrades gracefully if missing) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Firebase Admin SDK service account JSON string; push notifications disabled if missing |

### Frontend Environment Variables
*(Source: `Frontend/.env.example`)*

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL for customer web (e.g. `https://xxxx.ngrok.app`) |

### App Environment Variables
*(Source: `App/src/config/api.ts`)*

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Fallback backend URL; runtime URL configured via AsyncStorage setup screen |

### Confirmed Services
| Service | Role | Source |
|---|---|---|
| Supabase (PostgreSQL) | Primary persistent database | `Backend/src/config/supabase.js` |
| Supabase Storage | Dish image hosting (bucket: `menu-images`) | `003_menu_images_storage.sql` |
| Redis | Session cache, FCM tokens, daily counters | `Backend/src/config/redis.js` |
| Firebase Cloud Messaging | Push notifications to waiter + kitchen apps | `Backend/src/services/notificationService.js` |
| Socket.io | Real-time events across all clients | `Backend/src/index.js`, `Backend/src/services/socketService.js` |

### Deployment Targets
- **Backend**: Unverified — no Dockerfile, docker-compose, or CI/CD config found in scanned directories. UNVERIFIED — needs owner confirmation.
- **Frontend**: Vite static build (`npm run build`). Dev server auto-generates LAN QR code at startup. Deployment target unspecified in code.
- **App**: EAS (Expo Application Services). `App/eas.json` present with `projectId: 327b3a19-5b7d-4a39-adbc-5daec9bfa88b`. App uses runtime server URL configuration — backend URL set via setup screen on first launch.

---

## Known Constraints & Technical Debt

The following markers were found in the codebase:

| File | Line(s) | Marker | Quote |
|---|---|---|---|
| `Backend/src/routes/routes.js` | 242 | Comment | `// ISSUE 10 FIX: token-check now also requires restaurant to be open` |
| `Frontend/src/App.jsx` | 12–13 | Comment | `// ISSUE 10 FIX: ClosedGuard wraps order sub-pages and shows a "We're Closed" screen when the restaurant is closed, preventing manual URL bypass.` |
| `Frontend/src/context/OrderContext.jsx` | 6–7 | Comment | `// ISSUE 10 FIX: Exposes isRestaurantClosed so all order sub-pages can guard against manual navigation when the restaurant is closed.` |
| `Backend/src/services/orderSessionService.js` | 49–51 | Comment | `// ISSUE 1 FIX: If the table already has an active session owned by someone else, return 423 (Table Busy)` |
| `Backend/src/services/orderSessionService.js` | 460 | Comment | `// ISSUE 3 FIX: Snapshot ordersInfo into lockedItems when order becomes ready.` |
| `Backend/src/services/orderSessionService.js` | 514–515 | Comment | `// ISSUE 9 FIX: Apply active discounts (from restaurant_info) before tax calculation.` `// ISSUE 3 FIX: totalAmount uses lockedItems as baseline to prevent removal malpractice.` |
| `Backend/src/services/orderSessionService.js` | 696–698 | Comment | `// ISSUE 2 FIX: When adding items, also create an addon batch in ordersUpdateInfo for the kitchen to see as a separate card.` `// ISSUE 3 FIX: Prevent removal/quantity-reduction of locked items.` |
| `App/src/app/manager/_layout.tsx` | 7 | Comment | `// Fixes: #13: Logout redirect loop fixed via loggingOutRef guard` `// #16: Tab bar shows icons only (no labels) except Logout` |
| `Backend/src/index.js` | 30–35 | Config note | CORS `origin: '*'` — open CORS (no domain restriction in current config) |
| `Backend/src/index.js` | 78–86 | Config note | Socket.io CORS `origin: '*'` — open CORS |
| `App/src/app/explore.tsx` | — | Expo starter screen present in `app/` directory | May be unused boilerplate |

**No `TODO`, `FIXME`, or `HACK` comments** were found in the scanned files (ISSUE/FIX labels are the project's own convention for tracked bugs).

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
