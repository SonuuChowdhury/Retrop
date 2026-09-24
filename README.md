# Retrop

> Multi-tenant restaurant management SaaS and real-time dine-in automation platform.

[![Live Demo](https://img.shields.io/badge/Live_Demo-retrop.vercel.app-blue?style=for-the-badge&logo=vercel)](https://retrop.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18%20%2F%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.85.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-~56.0.12-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-~6.0.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Redis](https://img.shields.io/badge/Redis-6.0.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)

---

## 2. OVERVIEW

Retrop is a multi-tenant restaurant automation SaaS platform designed to eliminate operational friction across all dining touchpoints from a single unified server. It connects restaurant owners, general managers, floor waitstaff, kitchen chefs, and dine-in guests into a synchronized, real-time ecosystem. By digitizing table orders, kitchen ticket workflows, inventory consumption, and financial closeouts, Retrop replaces disconnected point-of-sale hardware with a responsive, multi-device software architecture.

---

## 3. KEY FEATURES

- **Multi-Tenant Architecture with Strict Isolation**: Hosts multiple restaurant brands concurrently on a shared PostgreSQL and Redis infrastructure using dynamic Product Key resolution (`RETROP-XXXX-XXXX-XXXX`), `AsyncLocalStorage` context propagation, and transparent ORM query scoping.
- **Contactless QR-Based Customer Ordering**: Guests scan dynamic table QR codes to enter an interactive session, submit contact details, review live digital menus, submit order drafts, and track preparation statuses in real time.
- **Kitchen Display System (KDS)**: Dedicated horizontal Kanban workflow (`Queue` &rarr; `Preparing` &rarr; `Ready` &rarr; `Serving`) featuring audio-visual order alerts, real-time add-on item acknowledgments, and preparation timers.
- **Waiter Workstation**: Mobile interface for real-time table request acceptance, active table management, manual ticket creation, on-the-fly order modifications, bill previews, and payment collection.
- **Anti-Malpractice Billing Lock (`lockedItems`)**: Automated snapshotting locks prepared dishes into an immutable ledger when kitchen staff flag them as ready, preventing unauthorized post-preparation dish cancellations or bill shaving at checkout.
- **Recipe Bill of Materials (BOM) & Inventory Tracking**: Maps menu dishes to raw ingredient ratios; automatically deducts stock upon kitchen completion, evaluates reorder thresholds, and emits live socket low-stock alerts.
- **Automated COGS & Gross Profit Accounting**: Calculates actual Cost of Goods Sold (COGS) on every completed ticket using weighted purchase costs from ingredient purchase logs, computing live gross profit margins per order.
- **Procurement & Vendor Ledger**: Supplier management module supporting purchase order logging, automated stock increments, unit cost updates, and payment status tracking.
- **Cash Register Day Closeout**: Calculates daily cash reconciliations by combining opening float, cash sales, and operational expenses against physical counts to flag register variance.
- **GST Compliance Engine**: Automated calculation of CGST, SGST, and IGST under inclusive and exclusive regimes, supporting HSN code mapping and generating structured GSTR-1 and GSTR-3B audit payloads.
- **Loyalty Points System**: Automatically credits customer loyalty balances (1 point per ₹100 spent) linked by mobile number, retaining balance and lifetime spend history.
- **Zero-Config Mobile Pairing (ECIES Encryption)**: Generates Elliptic Curve-encrypted QR codes in the admin dashboard containing server URLs and product keys; staff apps scan and decrypt credentials into secure device storage without manual typing.
- **Ephemeral Customer PDF Downloads**: Waiters generate cryptographically random, 10-minute temporary tokens in Redis, permitting guest phones to download thermal A6 billing PDFs without tenant authentication headers.
- **Role-Based Access Control (RBAC)**: Enforces role boundaries across SuperAdmin, Portal User / Business Owner, Manager, Waiter, and Kitchen accounts with dedicated JWT secret isolation and rate limiting.
- **Subscription Billing & Automated Cron Lifecycle**: SuperAdmin control plane managing multi-tier pricing plans, manual payment verifications, PDF invoice generation via PDFKit, and midnight automated renewal/grace/suspension cron evaluations.
- **First-Party Telemetry & Analytics**: Custom tracking pipeline capturing visitor sessions, referrers, device telemetry, geolocations, and heartbeats into PostgreSQL without external tracking scripts.

---

## 4. TECH STACK

### Backend
- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Framework**: Express `^5.2.1`
- **Validation**: Zod `^4.4.3`
- **PDF Generation**: PDFKit `^0.19.1`
- **Email Service**: Nodemailer `^9.0.1` (SMTP)
- **Task Scheduling**: node-cron `^4.5.0`
- **Logging**: Winston logger with structured file and console transports
- **Encryption**: eciesjs `^0.5.0` (Elliptic Curve Integrated Encryption Scheme)
- **Process Manager**: nodemon `^3.1.14`

### Frontend: Customer Web App (`Retrop_RMS_Frontend`)
- **Framework**: React `^18.3.1`
- **Tooling / Bundler**: Vite `^5.4.1`
- **Routing**: react-router-dom `^6.26.0`
- **Animations**: Framer Motion `^11.3.31`
- **Icons**: Lucide React `^0.441.0`
- **Real-Time Client**: socket.io-client `^4.8.3`

### Frontend: Owner Portal & Website (`Retrop_Website`)
- **Framework**: React `^19.2.7`
- **Tooling / Bundler**: Vite `^8.1.1`
- **Linter**: Oxlint `^1.71.0`
- **Routing**: react-router-dom `^7.18.1`
- **Icons**: Lucide React `^1.23.0`
- **Database Client**: @supabase/supabase-js `^2.110.7`

### Frontend: SuperAdmin Dashboard (`Retrop_Admin_Dashboard`)
- **Framework**: React `^19.2.6`
- **Tooling / Bundler**: Vite `^8.0.12`
- **Routing**: react-router-dom `^7.18.0`
- **Icons**: Lucide React `^1.21.0`

### Mobile App: Staff Workstation (`Retrop_RMS_App`)
- **Framework**: React Native `0.85.3` / Expo `~56.0.12` (Managed Workflow)
- **Routing**: expo-router `~56.2.11` (File-based)
- **Language**: TypeScript `~6.0.3`
- **Animations**: react-native-reanimated `4.3.1`
- **Secure Storage**: expo-secure-store `~56.0.4`
- **Configuration Storage**: @react-native-async-storage/async-storage `2.2.0`
- **Camera & Scanning**: expo-camera `~56.0.8`
- **Print & Share**: expo-print `~56.0.4`, expo-sharing `~56.0.18`
- **Push Client**: expo-notifications `~56.0.18`
- **Decryption**: eciesjs `^0.5.0`
- **Real-Time Client**: socket.io-client `^4.8.3`

### Database
- **Platform**: Supabase (Hosted PostgreSQL)
- **Driver**: @supabase/supabase-js `^2.106.1`
- **Migrations**: Native SQL scripts (`Server/src/migrations/*.sql`)

### Real-Time & Messaging
- **WebSockets**: Socket.io `^4.8.3` (bi-directional state synchronization)
- **Push Notifications**: Firebase Admin SDK `^13.10.0` (FCM for staff mobile alerts)

### Caching & In-Memory Store
- **Store**: Redis `^6.0.0` (table sessions, FCM token sets, ephemeral PDF tokens, daily atomic counters)

### Authentication & Security
- **Tokens**: JSON Web Tokens (jsonwebtoken `^9.0.3`) with isolated role-based signing secrets
- **Hashing**: bcryptjs `^3.0.3` (10 salt rounds)
- **Header Hardening**: Helmet `^8.2.0`
- **Rate Limiting**: express-rate-limit `^8.5.2` (per-route security profiles)
- **File Security**: Magic-byte buffer inspector (`imageSecurity.js`)

### DevOps & Deployment
- **Web Hosting**: Vercel (SPA rewrites configured via `vercel.json`)
- **Mobile Builds**: EAS (Expo Application Services)
- **Local Dev Orchestrator**: Custom Python supervisor (`dev.py`) with dynamic Ngrok tunnel synchronization

---

## 5. ARCHITECTURE

Retrop employs a modular monolith backend architecture paired with an event-driven real-time coordination layer. The single Express server handles RESTful API transactions and coordinates persistent WebSocket connections via Socket.io. 

```
                                  +-------------------------------------------------+
                                  |                 CLIENT SURFACES                 |
                                  |                                                 |
                                  |  [ Customer Web SPA ]    [ Staff Mobile App ]   |
                                  |  (React 18 / Vite)       (Expo / React Native)  |
                                  |                                                 |
                                  |  [ Owner Portal Web ]    [ SuperAdmin Panel ]   |
                                  |  (React 19 / Vite)       (React 19 / Vite)      |
                                  +-----------------------+-------------------------+
                                                          |
                                           HTTPS / WSS    |  (X-Product-Key / Bearer JWT)
                                                          v
+---------------------------------------------------------------------------------------------------+
|                                      BACKEND APPLICATION SERVER                                   |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Middleware Pipeline: Helmet | CORS | Rate Limiting | Zod Validation | Auth & Tenant Guards  |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                          |                                        |
|  +-----------------------------------+                   |                                        |
|  |     AsyncLocalStorage Context     |<------------------+                                        |
|  |    (tenantContext: restaurantId)  |                   |                                        |
|  +-----------------+-----------------+                   |                                        |
|                    |                                     v                                        |
|  +-----------------v-----------------+   +-------------------------------+   +-----------------+  |
|  |   Supabase ES6 Proxy Layer        |   |    Socket.io Event Gateway    |   | Firebase Admin  |  |
|  | - Injects restaurantId to INSERT  |   | - Rooms: restaurant:{id}      |   |   (FCM Push)    |  |
|  | - Appends .eq() to queries        |   | - Events: order, stock, kds   |   +--------+--------+  |
|  +-----------------+-----------------+   +---------------+---------------+            |           |
+--------------------|-------------------------------------|----------------------------|-----------+
                     |                                     |                            |
                     v                                     v                            v
        +-------------------------+           +-------------------------+    +----------------------+
        |   Supabase PostgreSQL   |           |       Redis Cache       |    | Staff Device Alerts  |
        |  (Multi-Tenant Tables)  |           | (Sessions, Keys, State) |    |  (Waiter / Kitchen)  |
        +-------------------------+           +-------------------------+    +----------------------+
```

### Multi-Tenant Data Isolation Approach

Retrop implements tenant data isolation at the application proxy layer, combining Node.js execution contexts with JavaScript metaprogramming:

1. **Tenant Context Binding**:
   Every incoming request directed to a restaurant resource must provide an `X-Product-Key` header (or an authenticated Owner/Portal JWT). The `productKeyAuth` or `ownerAuth` middleware validates the key against the database, extracts the corresponding `restaurantId`, and enters an execution scope:
   ```javascript
   tenantContext.enterWith({ restaurantId });
   ```
   `tenantContext` is an instance of Node.js `AsyncLocalStorage`, ensuring the `restaurantId` remains available across all asynchronous call chains without parameter drilling.

2. **Transparent Supabase ES6 Proxy Scoping**:
   Rather than querying Supabase directly, all backend services import a wrapped `supabase` instance. This instance intercepts calls to `.from(tableName)`. If the target table belongs to `tenantTables` (e.g., `orders`, `menu`, `inventory_item`, `customer`), the query builder is wrapped in an inner proxy:
   - **Mutation Injection**: Any `insert()` or `upsert()` automatically injects `restaurantId: store.restaurantId` into single records or payload arrays before execution.
   - **Query Filtering**: Read, update, and delete queries automatically chain `.eq('restaurantId', store.restaurantId)` onto the query builder.
   This guarantees that developers cannot accidentally omit tenant scoping, preventing cross-tenant data leaks.

3. **Tenant-Scoped Redis Namespacing**:
   Shared Redis instances isolate keys through dynamic prefix functions (`REDIS_KEYS.*`). Every cache key—from active table sessions (`order_session:{restaurantId}:{tableId}`) to waiter FCM token sets (`waiter_fcm_tokens:{restaurantId}`) and daily counters (`daily_order_counter:{restaurantId}:{dateStr}`)—embeds the `restaurantId` directly into the key schema.

4. **Global Control Plane Boundary**:
   Routes serving Retrop's SuperAdmin control plane (`/api/retrop/*`) and public analytics ingestion (`/api/analytics/*`) bypass tenant scoping, interacting directly with platform-wide administrative models.

---

## 6. GETTING STARTED

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20.x` recommended)
- **Package Manager**: `npm` (v9+)
- **Redis Server**: Local Redis instance or cloud instance (e.g., Upstash / Redis Cloud) running on default port `6379`
- **Database**: Supabase PostgreSQL project with SQL migrations applied
- **Mobile Development (Optional)**: Expo CLI (`npm install -g expo-cli`) and Expo Go on Android/iOS
- **Python (Optional)**: Python 3.9+ for automated multi-service orchestration (`dev.py`)

### Step-by-Step Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SonuuChowdhury/Resturant-Automation.git
   cd Resturant-Automation
   ```

2. **Install dependencies across all workspaces**:
   ```bash
   # Server
   cd Server && npm install && cd ..

   # Customer Web App
   cd Retrop_RMS_Frontend && npm install && cd ..

   # SuperAdmin Dashboard
   cd Retrop_Admin_Dashboard && npm install && cd ..

   # Owner Website & Portal
   cd Retrop_Website && npm install && cd ..

   # Staff Mobile App
   cd Retrop_RMS_App && npm install && cd ..
   ```

3. **Configure Environment Variables**:
   Create `.env` files in each sub-application based on the variable specifications below. Reference `Server/.env.example` for the core backend.

4. **Apply Database Migrations**:
   Execute the migration SQL scripts located in `Server/src/migrations/` sequentially against your Supabase PostgreSQL instance:
   - `001_drop_all.sql` (Initial clean state)
   - `002_fresh_schema.sql` (Core tables: restaurant, admin, waiter, kitchen, menu, orders)
   - `003_billing_system.sql` (Subscriptions & pricing plans)
   - `004_custom_billing.sql` (Tax rates & custom billing profiles)
   - `005_taxation_flag.sql` (Tax inclusive/exclusive flags)
   - `006_owner_system.sql` (Owner accounts & portal sessions)
   - `007_inventory.sql` (Vendors, stock items, BOM recipes, purchase entries)
   - `008_expense_staff_loyalty_schema.sql` (Expenses, day close, custom staff, loyalty)
   - `009_google_review_link.sql` (External review configurations)
   - `010_portal_users.sql` (Self-service portal users & OTP verification)
   - `011_website_analytics.sql` (Telemetry event tracking)

### Required Environment Variables

#### `Server/.env` (Reference: `Server/.env.example`)
```env
PORT
NODE_ENV
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
JWT_REFRESH_SECRET
WAITER_JWT_SECRET
WAITER_REFRESH_SECRET
KITCHEN_JWT_SECRET
KITCHEN_REFRESH_SECRET
OWNER_JWT_SECRET
OWNER_JWT_REFRESH_SECRET
PORTAL_JWT_SECRET
PORTAL_JWT_REFRESH_SECRET
RETROP_JWT_SECRET
RETROP_JWT_REFRESH_SECRET
REDIS_URL
FIREBASE_SERVICE_ACCOUNT_JSON
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
PORTAL_URL
ALLOWED_ORIGINS
ECC_PUBLIC_KEY
```

#### `Retrop_RMS_Frontend/.env`
```env
VITE_API_URL
VITE_PRODUCT_KEY
```

#### `Retrop_Admin_Dashboard/.env`
```env
VITE_API_URL
```

#### `Retrop_Website/.env`
```env
VITE_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID
```

#### `Retrop_RMS_App/.env`
```env
EXPO_PUBLIC_API_URL
```

### Running Locally

You can launch each component independently or use the orchestrator script:

#### Method A: Automated Orchestration (Recommended for Dev)
Run the root supervisor script to launch the server, ngrok tunnel, frontends, and mobile bundler with auto-synced URLs:
```bash
python dev.py
```

#### Method B: Manual Execution
Open separate terminal instances for each application:

- **Backend Server**:
  ```bash
  cd Server
  npm run dev
  # Server running at http://localhost:3000
  ```

- **Customer Ordering Web SPA**:
  ```bash
  cd Retrop_RMS_Frontend
  npm run dev
  # Web app running at http://localhost:5173
  ```

- **SuperAdmin Dashboard**:
  ```bash
  cd Retrop_Admin_Dashboard
  npm run dev
  # Admin panel running at http://localhost:5175
  ```

- **Restaurant Owner Portal & Website**:
  ```bash
  cd Retrop_Website
  npm run dev
  # Portal running at http://localhost:5180
  ```

- **Staff Mobile App**:
  ```bash
  cd Retrop_RMS_App
  npx expo start
  # Expo Metro bundler running at http://localhost:8081
  ```

---

## 7. API OVERVIEW

Retrop's backend exposes over 85 endpoints organized into 8 functional route groups. Route protection is enforced via middleware cascading: rate limiting &rarr; product key / tenant validation &rarr; JWT token verification &rarr; role boundary checks &rarr; Zod payload parsing.

| Route Group | Base Path | Auth Mechanism | Purpose |
|---|---|---|---|
| **Health Check** | `/` | None | Service liveness and connectivity verification |
| **Portal Auth** | `/api/portal/auth/*` | Open (Rate Limited) / Portal JWT | Owner registration, OTP verification, password recovery, multi-business profile management |
| **SuperAdmin Plane** | `/api/retrop/*` | SuperAdmin Bearer JWT | Restaurant onboarding, Product Key lifecycle, pricing plans, billing ledger, subscription cron operations |
| **Manager Control** | `/api/admin/*`, `/api/manager/*` | `X-Product-Key` + Admin JWT | Staff management, table topology, menu items, order history, and restaurant open/close toggling |
| **Waiter Operations** | `/api/waiter/*` | `X-Product-Key` + Waiter JWT | Table claim requests, active order tracking, bill previews, manual order dispatch, and bill conclusion |
| **Kitchen KDS** | `/api/kitchen/*` | `X-Product-Key` + Kitchen JWT | Live order ticket queue, preparation state advancement (`start`, `ready`), and add-on acknowledgments |
| **Customer QR Flow** | `/api/order/*`, `/api/orders/*` | `X-Product-Key` + Session Token | Session creation, customer registration, menu browsing, cart submission, live status polling, bill retrieval |
| **Owner Workplace** | `/api/owner/*` | Owner / Portal Bearer JWT | BOM recipes, inventory stock, vendor purchasing, expense tracking, daily cash closeout, GSTR-1/3B reporting |
| **Platform Telemetry**| `/api/analytics/*` | Open / SuperAdmin JWT | Ingestion of pageviews, device fingerprints, session durations, and aggregate analytics reporting |

---

## 8. CHALLENGES & TECHNICAL DECISIONS

### 1. Transparent Multi-Tenant Data Isolation Without ORM Boilerplate
- **The Problem**: In a multi-tenant SaaS architecture sharing a single database, relying on developers to manually attach `.eq('restaurantId', id)` in every query leads to inevitable human error, introducing catastrophic cross-tenant data leak risks. Conversely, maintaining isolated physical databases or dynamic PostgreSQL schemas introduces excessive operational cost and complex migration overhead.
- **The Solution**: Retrop combines Node.js `AsyncLocalStorage` (`tenantContext`) with an ES6 `Proxy` wrapping the `@supabase/supabase-js` client. Inbound requests pass through auth middleware that identifies the restaurant and binds its identifier to the async storage context. When any service executes `supabase.from(table)`, the Proxy intercepts access: if the table is tenant-bound, it automatically appends `.eq('restaurantId', store.restaurantId)` to query operations and injects `restaurantId` into all `insert` and `upsert` payloads.
- **Why This Approach**: This design achieves absolute data isolation at the ORM interface boundary. Developers write business logic as if building a single-tenant application, while multi-tenant segregation is enforced deterministically with zero manual query boilerplate.

### 2. Concurrency and Race Conditions on Shared Table Resources
- **The Problem**: High-volume dine-in restaurants present multiple concurrency hazards:
  1. Two guests simultaneously scanning a table QR code.
  2. Multiple floor waiters attempting to claim the same new table order request simultaneously.
  3. Concurrent orders contending for sequential daily invoice numbers (`INVYYYYMMDD####`).
- **The Solution**: Redis is leveraged as an atomic coordination layer prior to database persistence:
  - **Table Sessions**: Active table sessions are cached in Redis with a 20-minute TTL. If a session is already active past the initial registration stage, subsequent scans receive an HTTP `423 Locked` status, preventing collision while allowing the registered guest to resume via an ephemeral session token.
  - **Waiter Order Claiming**: Waiter acceptance transitions the session state atomically. If another waiter attempts to claim the same table, the condition `session.status === 'accepted' && session.waiterId !== claimingWaiterId` immediately aborts with an HTTP `409 Conflict`.
  - **Invoice Sequence Numbers**: Daily invoice numbers are incremented atomically using `redis.incr(REDIS_KEYS.dailyOrderCounter(today))`. The counter holds a 48-hour auto-cleaning TTL, guaranteeing strictly consecutive invoice sequences under parallel order writes without database lock contention.
- **Why This Approach**: Handling concurrency through Redis atomic primitives avoids expensive PostgreSQL row-level locks, maintaining sub-millisecond response times even during peak restaurant dining hours.

### 3. Anti-Malpractice Bill Baseline (`lockedItems`) & Ephemeral Public PDF Access
- **The Problem**: In dining environments, cash-handling staff may engage in billing malpractice by deleting expensive food items from an open ticket after the kitchen has already prepared them, pocketing the cash difference upon table clearance. Concurrently, guests who scan a bill QR code from their personal smartphone need to view and download thermal PDF invoices without requiring an account or exposing restaurant-level API keys.
- **The Solution**:
  - **Anti-Malpractice Snapshot**: When the kitchen flags an order as `ready`, the server takes an immutable snapshot of `ordersInfo` and persists it into the `lockedItems` JSON column. When the waiter concludes the order, the calculation engine uses `lockedItems` as a non-negotiable minimum floor: items present in `lockedItems` cannot be removed or have their quantities reduced. Unlocked add-ons can still be modified, but prepared food is permanently locked into the billable total.
  - **Ephemeral Bill Tokens**: Upon order settlement, the server generates a cryptographically random token stored in Redis under `temp_bill_token:[orderId]` with a strict 10-minute expiration. The guest's printed or on-screen checkout link routes to `/api/orders/:orderId/bill-pdf?token=xxx`, validating the token against Redis to authorize direct thermal PDF streaming without passing tenant headers.
- **Why This Approach**: This decouples public accessibility from administrative security while preserving a tamper-proof audit trail for restaurant revenue and inventory accounting.

---

## 9. ROADMAP

1. **Automated Payment Gateway Integration**: Native support for Razorpay, Stripe, and UPI dynamic QR intent flows to facilitate direct, contactless self-checkout by guests from their mobile browsers.
2. **Offline-First POS Synchronization**: Implementing local SQLite database caching and optimistic background synchronization for the staff mobile app (`Retrop_RMS_App`) to maintain operations during network drops.
3. **Formal Stress & Saturation Testing**: Developing automated k6 and Artillery testing suites to benchmark concurrent WebSocket broadcasts and verify Redis key eviction limits under multi-tenant load.
4. **Predictive Inventory & Purchase Forecasting**: Machine learning-assisted demand forecasting analyzing historical sales patterns, seasonal trends, and BOM consumption to auto-generate weekly vendor purchase orders.
5. **Private Storage Bucket Migration**: Transitioning billing and subscription PDF storage from shared assets to private S3/Supabase storage buckets with time-limited pre-signed download URLs.

---

## 10. LICENSE & CONTACT

### License
This project is licensed under the [ISC License](file:///c:/Users/levono/Documents/Project%20Workspace/Resturant-Automation/Server/package.json).

### Contact & Portfolio
- **Developer**: Sonu Chowdhury
- **Live Portfolio**: [portfolio-sonuuchowdhury.vercel.app](https://portfolio-sonuuchowdhury.vercel.app)
- **LinkedIn**: [linkedin.com/in/sonu-chowdhury-5378612b2](https://linkedin.com/in/sonu-chowdhury-5378612b2)
