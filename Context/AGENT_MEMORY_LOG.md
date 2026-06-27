# Agent Memory Log

## Last Updated
2026-06-27 | Updated by: Antigravity AI Agent (Claude Opus 4.6 Thinking)

## How to use this file
- READ this entire file before starting any task
- APPEND new entries after completing any task — never edit or delete existing entries
- Each entry must follow the standard format defined in each section below
- Entries are ordered newest-first within each section

---

## Session Log
A record of every agent work session. Each entry created at the end of a session.

### 2026-06-27 — Complete Context Folder Update for Multi-Tenant SaaS Architecture
**Agent**: Antigravity (Claude Opus 4.6 Thinking)
**Task**: Deep-analysed the entire current ecosystem (Server/, Retrop_RMS_App/, Retrop_RMS_Frontend/, Retrop_Admin_Dashboard/) and rewrote all three context files (PROJECT_BLUEPRINT.md, FEATURE_FLOWS.md, AGENT_MEMORY_LOG.md) to reflect the massive multi-tenant SaaS migration. The old context referenced directory names (App/, Frontend/, Backend/, SuperAdmin/) and a single-restaurant schema. The new context documents the full Retrop SaaS platform with product key auth, tenant-scoped Supabase proxy, billing/subscription lifecycle, ECIES setup QR, email dispatch, PDF invoicing, and 5 new migration files.
**Files changed**:
- Overwritten: `Context/PROJECT_BLUEPRINT.md`
- Overwritten: `Context/FEATURE_FLOWS.md`
- Overwritten: `Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: Key structural changes detected: (1) All directories renamed (Backend→Server, App→Retrop_RMS_App, Frontend→Retrop_RMS_Frontend, SuperAdmin→Retrop_Admin_Dashboard). (2) Migrations reset from 001-012 incremental to 001-005 fresh schema. (3) All tables now have restaurantId FK. (4) Supabase client wrapped in JS Proxy for auto-scoping. (5) Redis keys include restaurantId. (6) 7 new Retrop SaaS tables added. (7) 6 new server services added (retropAuthService, productKeyService, invoiceService, mailer, billingCron, crypto). (8) retropController.js is 1701 lines — largest file in codebase. (9) New dependencies: pdfkit, qrcode, eciesjs, nodemailer, node-cron. (10) New env vars: RETROP_JWT_SECRET, RETROP_JWT_REFRESH_SECRET, EMAIL_HOST/PORT/USER/PASS, ECC_PUBLIC_KEY. (11) Admin Dashboard has Settings.jsx and Transactions.jsx pages not in old context.

### 2026-06-22 — Retrop SaaS Migration and SuperAdmin Panel Scaffolding
**Agent**: Antigravity (Claude Sonnet 4.6 Thinking)
**Task**: Completed Phase 4 (App Settings Modal + Dynamic header cog integration + Powered by Retrop branding), Phase 5 (Frontend X-Product-Key header inclusion + global inactive-key offline block screen + Powered by Retrop footer link), and Phase 6 (Scaffolded SuperAdmin React + Vite dashboard app under `SuperAdmin/` with a minimalist dark theme, stats cards, CRUD tables, one-time copy keys modal, and full routing/layout/API hookups).
**Files changed**:
- Created: `App/src/components/AppSettingsModal.tsx`
- Modified: `App/src/app/index.tsx`
- Modified: `App/src/app/login.tsx`
- Modified: `Frontend/src/services/api.js`
- Modified: `Frontend/.env`
- Modified: `Frontend/src/App.jsx`
- Modified: `Frontend/src/components/Footer/Footer.jsx`
- Scaffolded: `SuperAdmin/`
- Created: `SuperAdmin/src/index.css`
- Created: `SuperAdmin/src/services/api.js`
- Created: `SuperAdmin/src/components/SkeletonLoader.jsx`
- Created: `SuperAdmin/src/components/Layout.jsx`
- Created: `SuperAdmin/src/pages/Login.jsx`
- Created: `SuperAdmin/src/pages/Dashboard.jsx`
- Created: `SuperAdmin/src/pages/Restaurants.jsx`
- Created: `SuperAdmin/src/pages/RestaurantDetails.jsx`
- Created: `SuperAdmin/src/App.jsx`
- Modified: `Context/PROJECT_BLUEPRINT.md`
- Modified: `Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: Retrop SuperAdmin panel has been fully structured, all routes defined, dependency installation completed, and Retrop logo assets copied. *(Note: Directories were later renamed: App→Retrop_RMS_App, Frontend→Retrop_RMS_Frontend, SuperAdmin→Retrop_Admin_Dashboard, Backend→Server)*

### 2026-06-21 — Initial full codebase scan and AI Project Context creation
**Agent**: Antigravity (Claude Sonnet 4.6 Thinking)
**Task**: Deep-analyse the entire codebase (App/, Frontend/, Backend/) and produce three authoritative context files: PROJECT_BLUEPRINT.md, FEATURE_FLOWS.md, AGENT_MEMORY_LOG.md in the /AI Project Context/ directory.
**Files changed**:
- Created: `AI Project Context/PROJECT_BLUEPRINT.md`
- Created: `AI Project Context/FEATURE_FLOWS.md`
- Created: `AI Project Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: All three files derived exclusively from reading source code and migration files. *(Note: Context folder was later moved from "AI Project Context" to "Context")*

---

## Decisions & Rationale
Architectural or design decisions made during agent sessions — so future agents don't re-open settled questions.

### 2026-06-27 — Multi-Tenant Isolation via AsyncLocalStorage Supabase Proxy
**Context**: The system migrated from single-restaurant (one DB = one restaurant) to multi-tenant SaaS (shared DB, scoped by restaurantId). Every tenant table needs `restaurantId` filtering on every query.
**Decision**: Instead of manually adding `.eq('restaurantId', ...)` to every query, a JavaScript `Proxy` wraps the Supabase client. When a tenant-scoped table is accessed and `tenantContext` (Node.js `AsyncLocalStorage`) has a store, the proxy automatically injects `restaurantId` into inserts/upserts and appends `.eq('restaurantId', ...)` to all queries. The `productKeyAuth` middleware sets the context via `tenantContext.enterWith({ restaurantId })`.
**Alternatives considered**: Manual scoping on each query (error-prone, verbose). Supabase RLS policies (would require per-request JWT with restaurant claims — complex). Separate databases per tenant (too expensive at this stage).
**Do not reverse without owner confirmation**: yes

### 2026-06-27 — Product Key as Multi-Tenant Identifier
**Context**: Restaurants need a portable, human-readable identifier that can be entered into the mobile app and included in customer frontend requests.
**Decision**: Each restaurant gets a unique product key (`RETROP-XXXX-XXXX-XXXX`). Clients send this via `X-Product-Key` header. The `productKeyAuth` middleware resolves it to a `restaurantId`. Key format uses hex segments for uniqueness. Only one active key per restaurant is allowed.
**Alternatives considered**: Using restaurantId directly as header (UUIDs are unwieldy for manual entry). API keys with hashed storage (adds complexity). Subdomain-based routing (requires DNS management).
**Do not reverse without owner confirmation**: yes

### 2026-06-27 — Separate JWT Secrets for Retrop SuperAdmin
**Context**: Retrop SuperAdmin accounts manage ALL restaurants and have different privilege levels from restaurant admins.
**Decision**: `RETROP_JWT_SECRET` and `RETROP_JWT_REFRESH_SECRET` are completely separate from `JWT_SECRET` and `JWT_REFRESH_SECRET`. Retrop tokens have 8h access / 30d refresh (more lenient than restaurant admin's 15m/7d). Retrop admin table is `retrop_admin` with email-based login (not mobile-based).
**Alternatives considered**: Shared JWT secret with role-based claims (security concern — a compromised restaurant JWT could potentially be used on Retrop routes if secrets are shared).
**Do not reverse without owner confirmation**: yes

### 2026-06-27 — ECIES Encrypted Setup QR Codes
**Context**: The mobile app needs both a server URL and product key to function. Manual entry is error-prone. QR codes are convenient but expose credentials if intercepted.
**Decision**: Server encrypts `[serverUrl, productKey]` payload using ECIES (Elliptic Curve Integrated Encryption Scheme, secp256k1). The QR code contains Base64 ciphertext. The mobile app has the corresponding private key (`getDecryptionPrivateKey()`) to decrypt. Uses `eciesjs` library on both server and app.
**Alternatives considered**: Plain text QR codes (security risk). AES encryption (requires shared secret distribution). HTTPS-only approach (doesn't solve QR interception at rest).
**Do not reverse without owner confirmation**: yes

### 2026-06-27 — Subscription Lifecycle: active → grace_period → suspended
**Context**: SaaS restaurants need automated billing enforcement without manual intervention.
**Decision**: Monthly subscriptions follow: `active` (paid, within billing cycle) → `grace_period` (cycle expired, grace days given, default 10) → `suspended` (grace expired, restaurant+keys deactivated). The `billingCron.js` runs daily at midnight and processes each state transition. On suspension, `retrop_restaurant.isActive = false` and all `product_key.isActive = false`, which immediately blocks all API access via `productKeyAuth`.
**Alternatives considered**: Manual suspension only (no cron). Immediate suspension on expiry (too harsh — 10-day grace is standard SaaS practice).
**Do not reverse without owner confirmation**: yes

### 2026-06-27 — Nodemailer for Transactional Emails
**Context**: The platform needs to send welcome, credentials, invoice, renewal, and suspension emails.
**Decision**: Gmail SMTP via Nodemailer with app-specific password (`EMAIL_USER`, `EMAIL_PASS`). If credentials are missing, emails are mocked (logged but not sent). The `From` name dynamically uses `retrop_business_config.legalName`.
**Alternatives considered**: SendGrid/Mailgun (adds third-party dependency and cost). AWS SES (overkill for current scale).
**Do not reverse without owner confirmation**: no (can be changed without breaking architecture)

### 2026-06-21 — Separate JWT secrets for admin, waiter, and kitchen
**Context**: The system has three distinct actor types (admin/manager, waiter, kitchen) each needing independent authentication and token revocation.
**Decision**: Each actor type uses a separate JWT secret. Admin uses `JWT_SECRET` and `JWT_REFRESH_SECRET`. Waiter and kitchen each use their own secrets managed by `waiterAuthService.js` and `kitchenAuthService.js` respectively. Socket.io `verifyTokenWithRole` tries all three secrets to authenticate socket connections.
**Alternatives considered**: A single shared JWT secret was likely the initial simpler approach; separate secrets allow invalidating one actor class without affecting others.
**Do not reverse without owner confirmation**: yes

### 2026-06-21 — Redis session for customer order flow; Supabase for persistence
**Context**: Customer order sessions are ephemeral (20-min TTL) and involve frequent polling. Writing every poll to Supabase would be expensive.
**Decision**: Customer order sessions (from QR scan through to order placement) live exclusively in Redis with a 20-min TTL. On order placement, the order is persisted to Supabase `orders` table. Redis session is extended after placement but eventually auto-expires.
**Alternatives considered**: Writing everything to Supabase in real time was rejected for performance reasons.
**Do not reverse without owner confirmation**: yes

### 2026-06-21 — lockedItems snapshot to prevent order malpractice (ISSUE 3)
**Context**: Customers could theoretically order food, consume it, then reduce the order on the tracking page before payment, resulting in underbilling.
**Decision**: When the kitchen marks an order `ready`, the current `ordersInfo` is snapshotted into `orders.lockedItems`. At bill conclusion, `lockedItems` is the minimum billing baseline. Customer `customerModifyOrder` cannot reduce below locked quantities. The `concludeOrder` service merges locked + any new unlocked additions.
**Alternatives considered**: Disabling customer order modification after order placement (too restrictive — customers legitimately add items).
**Do not reverse without owner confirmation**: yes

### 2026-06-21 — taxType: inclusive vs exclusive on restaurant_info
**Context**: Some restaurants include tax in their listed prices (inclusive); others add tax on top (exclusive).
**Decision**: `restaurant_info.taxType` defaults to `'exclusive'`. Manager can switch to `'inclusive'` in the Info screen.
**Do not reverse without owner confirmation**: yes

### 2026-06-21 — Invoice number format: INV + YYYYMMDD + 4-digit-seq
**Context**: Invoices need human-readable, sortable, unique identifiers that encode date information.
**Decision**: Format is `INV{YYYYMMDD}{0001}`. Date is IST. Sequence is from a tenant-scoped Redis daily counter.
**Do not reverse without owner confirmation**: yes

---

## Bugs Encountered & Fixes Applied
A record of bugs found and how they were resolved.

### 2026-06-22 — ISSUE: SuperAdmin API Response Check Mismatch
**Symptom**: Onboarding new restaurants or requesting keys completes successfully on the backend, but the SuperAdmin / RMS_ADMIN UI remains stuck loading without closing modals, displaying generated product keys, or refreshing lists.
**Root cause**: Backend Retrop control plane endpoints respond with `{ success: true, data: ... }` instead of `{ status: 'success', data: ... }`. The dashboard views strictly check `res.status === 'success'` and thus bypass processing successful responses.
**Fix applied**: Updated the request wrapper in Retrop_Admin_Dashboard/src/services/api.js to automatically map `success: true` to `status: 'success'` and `success: false` to `status: 'error'` if `status` is not returned.
**Regression risk**: None, acts as a transparent normalization layer.

### 2026-06-21 — ISSUE 1: Table busy on QR re-scan by stranger
**Symptom**: A second customer scanning the QR at an occupied table would receive the session of the first customer.
**Root cause**: Session creation returned any existing active session without checking ownership.
**Fix applied**: Returns HTTP 423 (Table Busy) if existing session is past `waiting_customer_info` stage.
**Regression risk**: Any logic calling `createOrderSession` and expecting an existing mid-flow session must handle 423.

### 2026-06-21 — ISSUE 2: Customer add-on items not visible to kitchen as separate cards
**Symptom**: Kitchen couldn't distinguish new additions from original order.
**Fix applied**: `customerModifyOrder` creates addon batch objects in `ordersUpdateInfo`.
**Regression risk**: Code reading `ordersUpdateInfo` must handle both old and new formats.

### 2026-06-21 — ISSUE 3: Customer removes items after food served (malpractice)
**Symptom**: Customer could reduce items after kitchen prepared them.
**Fix applied**: Three-part fix: lockedItems snapshot, customerModifyOrder enforcement, concludeOrder baseline.
**Regression risk**: `lockedItems` must never be mutated after first set.

### 2026-06-21 — ISSUE 9: Discounts not applied before tax calculation
**Fix applied**: Billing math follows: subtotal → apply discounts → apply taxes → finalAmount.
**Regression risk**: Order of operations must always follow this sequence.

### 2026-06-21 — ISSUE 10: Customer can bypass "restaurant closed" by typing URL directly
**Fix applied**: `ClosedGuard` component + `requireRestaurantOpen` middleware on token-check route.
**Regression risk**: `closedCheckDone` must be checked before rendering guard.

### 2026-06-21 — ISSUE 13: Manager logout redirect loop
**Fix applied**: `loggingOutRef` flag in `_layout.tsx`.
**Regression risk**: Any future logout flow must set this flag before calling `logout()`.

### 2026-06-21 — ISSUE 16: Manager tab bar showing labels + icons (too crowded)
**Fix applied**: Tab bar renders icon only (no label text).
**Regression risk**: If tab count increases further, consider scrollable tab bar.

---

## Patterns That Work
Reusable approaches confirmed to work well in this codebase.

### Supabase multi-tenant Proxy pattern
**Context**: All tenant-scoped queries need automatic restaurantId filtering.
**Approach**: Use JavaScript `Proxy` over Supabase client + `AsyncLocalStorage` for request-scoped context. Set context in middleware, consumed transparently by all services.
**Example**: `Server/src/config/supabase.js`
**First confirmed**: 2026-06-27

### Product key middleware pattern
**Context**: Every restaurant-facing route needs tenant resolution.
**Approach**: Single `productKeyAuth` middleware resolves key → restaurantId, sets tenantContext, and attaches to req. All downstream code is automatically scoped.
**Example**: `Server/src/middleware/productKeyAuth.js`
**First confirmed**: 2026-06-27

### Tenant-scoped Redis key pattern
**Context**: Redis keys must not collide across restaurants in a shared instance.
**Approach**: All `REDIS_KEYS` functions accept `(restaurantId, entityId)` or fall back to `tenantContext.getStore()?.restaurantId`. Key format: `{purpose}:{restaurantId}:{entityId}`.
**Example**: `Server/src/config/redis.js` — `REDIS_KEYS.orderSession(restaurantId, tableId)` → `order_session:{restaurantId}:{tableId}`
**First confirmed**: 2026-06-27

### IST timestamp generation for DB writes
**Context**: All DB timestamps should be in IST (Asia/Kolkata, UTC+5:30).
**Approach**: Use `nowIST()` and `todayDateIST()` from `Server/src/utils/time.js` for all Supabase writes.
**First confirmed**: 2026-06-21

### ENDPOINTS lazy getters in App
**Context**: The backend URL is set at runtime. All endpoint URLs must reflect the current `_baseUrl` at call time.
**Approach**: `ENDPOINTS` uses ES getter syntax. Parameterised endpoints use arrow functions.
**Example**: `Retrop_RMS_App/src/config/api.ts`
**First confirmed**: 2026-06-21

### Auth context pattern (login / logout / getAuthHeaders / refreshToken)
**Context**: All three actor types need the same auth lifecycle.
**Approach**: Each auth context exposes `{isAuthenticated, isLoading, login, logout, getAuthHeaders, refreshToken}`. `apiClient.ts` uses the `refreshToken` callback for auto-refresh on 401.
**First confirmed**: 2026-06-21

### loggingOutRef pattern for auth guard in layouts
**Context**: Setting `isAuthenticated = false` (from logout) triggers the auth guard useEffect.
**Approach**: Use `useRef(false)` flag set to `true` before calling `logout()`.
**First confirmed**: 2026-06-21

### requireRestaurantOpen middleware placement
**Context**: Restaurant closed check per-route, not global.
**Approach**: Apply `restaurantOpen.js` middleware explicitly to each route that should be blocked.
**First confirmed**: 2026-06-21

---

## Patterns to Avoid

### Trusting client-submitted prices for order calculation
**What was tried**: Accepting `price` fields from the client in order placement requests.
**Why it failed**: Menu prices can be manipulated client-side. Backend re-prices from DB.
**Alternative**: Always re-fetch prices from Supabase `menu` table.
**Date confirmed**: 2026-06-21

### Global CORS `origin: '*'` in production
**What was tried**: Current config uses `origin: '*'`.
**Why it failed**: Any domain can make cross-origin requests. Security concern for production.
**Alternative**: Restrict `origin` to specific frontend domains.
**Date confirmed**: 2026-06-21

### Using `new Date().toISOString()` for DB writes
**What was tried**: Standard JS ISO string for timestamps.
**Why it failed**: Produces UTC timestamps, inconsistent with IST-aware system.
**Alternative**: Use `nowIST()` from `Server/src/utils/time.js`.
**Date confirmed**: 2026-06-21

### Inline Redis key strings
**What was tried**: Writing Redis key names as inline template literals.
**Why it failed**: Error-prone; typos create silent key mismatches.
**Alternative**: Use `REDIS_KEYS.*` functions from `Server/src/config/redis.js`.
**Date confirmed**: 2026-06-21

### Querying tenant tables without product key context
**What was tried**: Calling Supabase tenant-scoped tables from Retrop control plane routes without setting tenantContext.
**Why it failed**: The Proxy auto-appends `.eq('restaurantId', ...)` only when `tenantContext.getStore()` has data. Without it, queries are unscoped (return all restaurants' data).
**Alternative**: For Retrop routes that need to query tenant tables for a specific restaurant, manually add `.eq('restaurantId', specificId)` to the query. Do NOT use the proxy's auto-scoping for cross-restaurant operations.
**Date confirmed**: 2026-06-27

---

## Owner Corrections
Every time the owner corrected an agent's output or redirected a task.

*(No owner corrections recorded yet.)*

---

## Open Questions
Things agents couldn't resolve and flagged for the owner.

### 2026-06-27 — .env.example is outdated
**Context**: The `.env.example` file in `Server/` only lists the original 9 variables. The actual `.env` has 15+ variables including `RETROP_JWT_SECRET`, `RETROP_JWT_REFRESH_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ECC_PUBLIC_KEY`.
**Blocked task**: New developers will not know which environment variables to configure.
**Status**: open
**Answer**: N/A

### 2026-06-27 — SERVER_URL env var for email QR generation
**Context**: The `sendCredentialsEmail` and `getSetupQrCode` functions need the server's public URL to encrypt into the QR code payload. It's unclear how `serverUrl` is determined at runtime (could be from request headers, an env var, or hardcoded).
**Blocked task**: Cannot fully document the setup QR flow without knowing the serverUrl source.
**Status**: open
**Answer**: N/A

### 2026-06-21 — Backend deployment target
**Context**: No Dockerfile, docker-compose, or CI/CD configuration files found. Deployment environment unknown.
**Status**: open
**Answer**: N/A

### 2026-06-21 — Frontend deployment target
**Context**: Vite static build. Dev server on port 5173 with LAN QR code generation. Production deployment target unclear.
**Status**: open
**Answer**: N/A

### 2026-06-21 — CORS origin restriction for production
**Context**: Both Express and Socket.io have `origin: '*'`.
**Status**: open
**Answer**: N/A

---

## How AI agents must update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **READ the entire file** before starting any work in this repository. It contains decisions and bug fixes that must not be repeated or reversed.
> 2. **APPEND, never edit or delete** existing entries. This file is append-only. Historical entries have permanent value.
> 3. **After every work session**, add an entry to **Session Log** (newest-first). Include: date, one-line summary, agent name, task, files changed, outcome, and key notes for the next agent.
> 4. **After every architectural decision**, add an entry to **Decisions & Rationale**. Set "Do not reverse without owner confirmation" honestly.
> 5. **After fixing a bug**, add an entry to **Bugs Encountered & Fixes Applied**. Always note the regression risk.
> 6. **After discovering a reusable pattern**, add it to **Patterns That Work** with a concrete code example reference.
> 7. **After discovering a pattern that caused problems**, add it to **Patterns to Avoid** with the confirmed reason and the recommended alternative.
> 8. **When the owner corrects your output**, add an entry to **Owner Corrections** immediately.
> 9. **When you cannot resolve something**, add it to **Open Questions**. Set `Status: open`. When the owner answers, update the entry to `Status: answered` and add the answer.
> 10. **Update the "Last Updated" line** at the top of this file after every session.
> 11. **Use NEW directory names**: `Server/`, `Retrop_RMS_App/`, `Retrop_RMS_Frontend/`, `Retrop_Admin_Dashboard/`. The old names (Backend/, App/, Frontend/, SuperAdmin/) are deprecated.
