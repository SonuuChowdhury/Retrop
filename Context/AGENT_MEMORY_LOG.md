# Agent Memory Log

## Last Updated
2026-06-22 | Updated by: Antigravity AI Agent

## How to use this file
- READ this entire file before starting any task
- APPEND new entries after completing any task — never edit or delete existing entries
- Each entry must follow the standard format defined in each section below
- Entries are ordered newest-first within each section

---

## Session Log
A record of every agent work session. Each entry created at the end of a session.

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
**Notes**: Retrop SuperAdmin panel has been fully structured, all routes defined, dependency installation completed, and Retrop logo assets copied.

### 2026-06-21 — Initial full codebase scan and AI Project Context creation
**Agent**: Antigravity (Claude Sonnet 4.6 Thinking)
**Task**: Deep-analyse the entire codebase (App/, Frontend/, Backend/) and produce three authoritative context files: PROJECT_BLUEPRINT.md, FEATURE_FLOWS.md, AGENT_MEMORY_LOG.md in the /AI Project Context/ directory.
**Files changed**:
- Created: `AI Project Context/PROJECT_BLUEPRINT.md`
- Created: `AI Project Context/FEATURE_FLOWS.md`
- Created: `AI Project Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: All three files derived exclusively from reading source code and migration files. No Docker/CI config found in the three scanned directories — deployment target for the backend is unverified. The `App/src/app/explore.tsx` file appears to be an unused Expo starter screen (6.5 KB, not referenced by any other file examined). The `App/src/constants/` directory was not internally examined but exists. The `Backend/src/services/database.js` file (9.7 KB) was not fully read — it likely contains low-level Supabase query helpers but its exact exports are unverified.

---

## Decisions & Rationale
Architectural or design decisions made during agent sessions — so future agents don't re-open settled questions.

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

### 2026-06-21 — Dynamic server URL configuration for the Expo app
**Context**: The backend URL changes frequently (ngrok URL for local dev, deployment URL for production). Rebuilding the app for each URL change is impractical.
**Decision**: The backend URL is stored in `AsyncStorage` and loaded at app startup by `initializeApi()`. On first launch (or after reset), the app shows a setup screen where the user enters the URL. `ENDPOINTS` are lazy getters that read `_baseUrl` at call time, so they always reflect the latest URL.
**Alternatives considered**: Hardcoding URL via env var requires app rebuild; EAS update for config changes (more overhead).
**Do not reverse without owner confirmation**: yes

### 2026-06-21 — taxType: inclusive vs exclusive on restaurant_info
**Context**: Some restaurants include tax in their listed prices (inclusive); others add tax on top (exclusive).
**Decision**: `restaurant_info.taxType` defaults to `'exclusive'`. Manager can switch to `'inclusive'` in the Info screen. Tax calculation in `concludeOrder` branches on this value:
- `exclusive`: `finalAmount = discountedSubtotal + sum(taxes)`
- `inclusive`: taxes are mathematically extracted from the discountedSubtotal for the breakdown display; `finalAmount = discountedSubtotal`
**Alternatives considered**: None documented in code.
**Do not reverse without owner confirmation**: yes

### 2026-06-21 — Invoice number format: INV + YYYYMMDD + 4-digit-seq
**Context**: Invoices need human-readable, sortable, unique identifiers that encode date information.
**Decision**: Format is `INV{YYYYMMDD}{0001}`. Date is IST (`Asia/Kolkata` timezone). Sequence is from a Redis daily counter that resets each day (48-h TTL on the key).
**Alternatives considered**: UUID-based invoice numbers (not human-readable). Sequential global counter (date information lost).
**Do not reverse without owner confirmation**: yes

---

## Bugs Encountered & Fixes Applied
A record of bugs found and how they were resolved.

### 2026-06-21 — ISSUE 1: Table busy on QR re-scan by stranger
**Symptom**: A second customer scanning the QR at an occupied table would receive the session of the first customer, allowing them to see/interfere with another customer's order.
**Root cause**: Session creation returned any existing active session without checking ownership.
**Fix applied**: `Backend/src/services/orderSessionService.js` — if an existing session is found with status beyond `'waiting_customer_info'`, the service now returns HTTP 423 (Table Busy) instead of handing out the session. Re-entry for the legitimate customer is handled via `customerToken` stored in localStorage.
**Regression risk**: Any logic that calls `createOrderSession` and expects to receive an existing session in mid-flow states must handle 423.

### 2026-06-21 — ISSUE 2: Customer add-on items not visible to kitchen as separate cards
**Symptom**: When a customer added items after an order was placed, the kitchen had no way to distinguish the new additions from the original order items.
**Root cause**: Customer `modifyOrder` only updated `ordersInfo` without creating a trackable addon batch.
**Fix applied**: `Backend/src/services/orderSessionService.js` `customerModifyOrder` — when items are added (net new quantity), an `addonBatch` object `{type: 'addon', addonId (UUID), addonItems, kitchenAcknowledged: false, timestamp, customer: true}` is appended to `orders.ordersUpdateInfo`. Kitchen dashboard reads this and renders addon cards. Waiter can also acknowledge via `PATCH /api/kitchen/orders/{orderId}/addon/{addonId}/done`.
**Regression risk**: Any code reading `ordersUpdateInfo` must handle both old-format log entries and new addon batch format.

### 2026-06-21 — ISSUE 3: Customer removes items after food served (malpractice)
**Symptom**: Customer could reduce items or remove dishes from their order after the kitchen had already prepared them, resulting in unpaid food.
**Root cause**: No immutable record of what was actually prepared.
**Fix applied**: Three-part fix:
1. `kitchenOrderReady` snapshots `ordersInfo → lockedItems` (migration 008, `orderSessionService.js`).
2. `customerModifyOrder` enforces locked quantities as minimum.
3. `concludeOrder` uses locked items as billing baseline.
**Regression risk**: `lockedItems` must never be mutated after first set. The guard `(order.lockedItems && order.lockedItems.length > 0) ? order.lockedItems : [...order.ordersInfo]` ensures idempotency.

### 2026-06-21 — ISSUE 9: Discounts not applied before tax calculation
**Symptom**: Taxes were calculated on the full subtotal; discounts were applied after tax, resulting in incorrect final amounts.
**Root cause**: Order of operations in `concludeOrder` applied discounts after tax.
**Fix applied**: `Backend/src/services/orderSessionService.js` `concludeOrder` — active discounts from `restaurant_info.discounts` are summed first, producing `discountedSubtotal`. Tax is then calculated on `discountedSubtotal`.
**Regression risk**: Billing math must always follow: `subtotal → apply discounts → apply taxes → finalAmount`.

### 2026-06-21 — ISSUE 10: Customer can bypass "restaurant closed" by typing URL directly
**Symptom**: If the restaurant was marked closed, a customer who knew the URL could navigate directly to `/order/...` pages, bypassing the closed check.
**Root cause**: Closed check only existed on the QR landing page, not on subsequent pages.
**Fix applied**:
1. `Frontend/src/context/OrderContext.jsx` — fetches `GET /api/public/restaurant-info` on mount; exposes `isRestaurantClosed` and `closedCheckDone`.
2. `Frontend/src/App.jsx` — `ClosedGuard` component wraps all `/order/*` sub-routes and renders "We're Closed" screen if `isRestaurantClosed = true`.
3. `Backend/src/routes/routes.js` line 242–243 — `GET /api/order/{tableId}/token-check` now also applies `requireRestaurantOpen`.
**Regression risk**: `closedCheckDone` must be checked before rendering guard, to avoid flash of "closed" before the API responds.

### 2026-06-21 — ISSUE 13: Manager logout redirect loop
**Symptom**: Logging out from the manager section caused a redirect loop: logout → `isAuthenticated = false` → auth guard fires → redirect to login → back to layout → repeat.
**Root cause**: Auth guard `useEffect` ran on `isAuthenticated` change, including the change triggered by logout itself.
**Fix applied**: `App/src/app/manager/_layout.tsx` — `loggingOutRef = useRef(false)` flag set to `true` before calling `logout()`. Auth guard checks `!loggingOutRef.current` before redirecting.
**Regression risk**: Any future logout flow that does not set this flag before calling `logout()` will re-introduce the loop.

### 2026-06-21 — ISSUE 16: Manager tab bar showing labels + icons (too crowded)
**Symptom**: With 7 tabs + logout, showing both icon and label made the tab bar too cramped.
**Fix applied**: `App/src/app/manager/_layout.tsx` — `TabBarButton` renders icon only (no label text). Logout button retains its label as an exception per the spec comment in code.
**Regression risk**: If tab count increases further, icon-only may still become cramped. Consider a scrollable tab bar or overflow menu.

### 2026-06-22 — ISSUE: SuperAdmin API Response Check Mismatch
**Symptom**: Onboarding new restaurants or requesting keys completes successfully on the backend, but the SuperAdmin / RMS_ADMIN UI remains stuck loading without closing modals, displaying generated product keys, or refreshing lists.
**Root cause**: Backend Retrop control plane endpoints respond with `{ success: true, data: ... }` instead of `{ status: 'success', data: ... }`. The dashboard views (Dashboard, Restaurants, RestaurantDetails, Layout) strictly check `res.status === 'success'` and thus bypass processing successful responses.
**Fix applied**: Updated the request wrapper in RMS_ADMIN/src/services/api.js to automatically map `success: true` to `status: 'success'` and `success: false` to `status: 'error'` if `status` is not returned.
**Regression risk**: None, acts as a transparent normalization layer.

---

## Patterns That Work
Reusable approaches confirmed to work well in this codebase.

### IST timestamp generation for DB writes
**Context**: All DB timestamps should be in IST (Asia/Kolkata, UTC+5:30) for this Indian restaurant system.
**Approach**: Use `nowIST()` and `todayDateIST()` from `Backend/src/utils/time.js` for all timestamp generation. Do not use `new Date().toISOString()` directly in DB writes — it produces UTC strings.
**Example**: `Backend/src/services/orderSessionService.js` — `createdAt: nowIST()` in all Supabase inserts/updates.
**First confirmed**: 2026-06-21

### Redis key namespacing via REDIS_KEYS constants
**Context**: Redis keys need consistent naming to avoid collisions and make debugging easier.
**Approach**: All Redis key strings are defined as functions in `REDIS_KEYS` object in `Backend/src/config/redis.js`. Always use `REDIS_KEYS.orderSession(tableId)` etc., never inline string keys.
**Example**: `Backend/src/services/orderSessionService.js` — `redis.get(REDIS_KEYS.orderSession(tableId))`.
**First confirmed**: 2026-06-21

### ENDPOINTS lazy getters in App
**Context**: The backend URL is set at runtime (not at build time). All endpoint URLs must reflect the current `_baseUrl` at call time, not at import time.
**Approach**: `ENDPOINTS` in `App/src/config/api.ts` uses ES getter syntax (`get ENDPOINT_NAME() { return \`${base()}/...\`; }`) so every access reads the live `_baseUrl`. Parameterised endpoints use arrow functions (`ENDPOINT_NAME: (id) => \`...\``).
**Example**: `App/src/config/api.ts` lines 93–172.
**First confirmed**: 2026-06-21

### Auth context pattern (login / logout / getAuthHeaders / refreshToken)
**Context**: All three actor types (manager, waiter, kitchen) need the same auth lifecycle.
**Approach**: Each auth context (AuthContext, WaiterAuthContext, KitchenAuthContext) exposes `{isAuthenticated, isLoading, login, logout, getAuthHeaders, refreshToken}`. `apiClient.ts` uses the `refreshToken` callback for auto-refresh on 401. `getAuthHeaders()` builds the `Authorization: Bearer ...` + `ngrok-skip-browser-warning` header set.
**Example**: `App/src/context/AuthContext.tsx`.
**First confirmed**: 2026-06-21

### loggingOutRef pattern for auth guard in layouts
**Context**: Setting `isAuthenticated = false` (from logout) triggers the auth guard useEffect, which can re-redirect before the router has moved.
**Approach**: Use a `useRef(false)` flag (`loggingOutRef`). Set it to `true` synchronously before calling `logout()`. Auth guard checks `!loggingOutRef.current` before redirecting. This is a one-way flag; do not reset it.
**Example**: `App/src/app/manager/_layout.tsx` lines 112, 116, 182.
**First confirmed**: 2026-06-21

### requireRestaurantOpen middleware placement
**Context**: Restaurant closed check must run on all customer order routes without code duplication.
**Approach**: `Backend/src/middleware/restaurantOpen.js` is a standalone middleware applied per-route in `routes.js`. It is NOT applied as global middleware (some customer routes like `getOrderBill` and `getPublicMenu` must work even when closed). Apply it explicitly to each route that should be blocked.
**Example**: `Backend/src/routes/routes.js` lines 234–243.
**First confirmed**: 2026-06-21

### Supabase service role key for storage operations
**Context**: Supabase Storage RLS policies are in place, but the backend bypasses them by using the service role key.
**Approach**: Backend always uses the service role Supabase client (`SUPABASE_SERVICE_ROLE_KEY`) for storage upload/delete operations. This means backend code does NOT need to manage storage RLS; all permission control is at the API authentication layer.
**Example**: `Backend/src/config/supabase.js`, `003_menu_images_storage.sql` comment at line 53.
**First confirmed**: 2026-06-21

---

## Patterns to Avoid

### Trusting client-submitted prices for order calculation
**What was tried**: (Hypothetical / general web pattern) — accepting `price` fields from the client in order placement requests.
**Why it failed**: Menu prices can be manipulated client-side. The backend validates and re-prices all order items from the `menu` table at the time of `placeOrder`. Customer-submitted item lists only carry `dishId`, `quantity`, and `remarks` — never `price`.
**Alternative**: Always re-fetch prices from Supabase `menu` table in `orderSessionService.placeOrder`.
**Date confirmed**: 2026-06-21

### Global CORS `origin: '*'` in production
**What was tried**: Current config uses `origin: '*'` in both Express CORS and Socket.io CORS.
**Why it failed**: Not yet confirmed as a production problem, but this is a security concern. Any domain can make cross-origin requests to the backend.
**Alternative**: Restrict `origin` to the specific frontend domain(s) in production. This is marked UNVERIFIED — owner needs to confirm the intended deployment model (local LAN only vs public).
**Date confirmed**: 2026-06-21

### Using `new Date().toISOString()` for DB writes
**What was tried**: Standard JS ISO string for timestamps.
**Why it failed**: Produces UTC timestamps (`Z` suffix), inconsistent with the IST-aware system. The codebase explicitly converts to IST (`+05:30`) for DB storage.
**Alternative**: Use `nowIST()` from `Backend/src/utils/time.js` for all Supabase writes.
**Date confirmed**: 2026-06-21

### Inline Redis key strings
**What was tried**: Writing Redis key names as inline template literals (e.g. `` `order_session:${tableId}` ``).
**Why it failed**: Error-prone; typos create silent key mismatches that are hard to debug.
**Alternative**: Always use the `REDIS_KEYS.*` functions from `Backend/src/config/redis.js`.
**Date confirmed**: 2026-06-21

---

## Owner Corrections
Every time the owner corrected an agent's output or redirected a task.

*(No owner corrections recorded yet — this is the first agent session.)*

---

## Open Questions
Things agents couldn't resolve and flagged for the owner.

### 2026-06-21 — Backend deployment target
**Context**: No Dockerfile, docker-compose, or CI/CD configuration files were found in the scanned directories (App/, Frontend/, Backend/). The backend deployment environment is unknown.
**Blocked task**: Cannot document infrastructure in PROJECT_BLUEPRINT.md with certainty. Cannot advise on production CORS config, environment variable injection method, or process management.
**Status**: open
**Answer**: N/A

### 2026-06-21 — Frontend deployment target
**Context**: `vite.config.js` shows a dev server on port 5173 with LAN QR code generation. No build/deploy pipeline was found. The frontend appears intended for LAN use (customers scan QR to same LAN IP), but a production deployment target is unclear.
**Blocked task**: Cannot confirm whether `VITE_API_URL` is set at build time or runtime, or whether the frontend is hosted on a public URL.
**Status**: open
**Answer**: N/A

### 2026-06-21 — Contents of Backend/src/services/database.js
**Context**: This file (9.7 KB) was not fully examined during the initial scan. Its exact exports and purpose within the service layer are unverified.
**Blocked task**: Some backend service functionality may rely on this file in ways not captured in PROJECT_BLUEPRINT.md or FEATURE_FLOWS.md.
**Status**: open
**Answer**: N/A

### 2026-06-21 — App/src/constants/ directory contents
**Context**: The directory `App/src/constants/` exists but its files were not examined.
**Blocked task**: Any shared app-level constants (color tokens, strings, etc.) defined there are not documented.
**Status**: open
**Answer**: N/A

### 2026-06-21 — Frontend/src/hooks/useRestaurantData.js source
**Context**: `Frontend/src/App.jsx` imports `useRestaurantData` which reads from `public/data.json` (confirmed by error message in JSX: `"Failed to load restaurant data. Please check public/data.json."`). The actual `public/data.json` file structure and schema were not read.
**Blocked task**: The homepage restaurant content (hours, location, signature dishes, etc.) schema is undocumented.
**Status**: open
**Answer**: N/A

### 2026-06-21 — CORS origin restriction for production
**Context**: Both Express and Socket.io have `origin: '*'` in current config. It is unclear whether this is intentional (LAN-only deployment where security via obscurity is acceptable) or a development convenience that should be restricted in production.
**Blocked task**: Cannot make a definitive security recommendation without knowing the deployment model.
**Status**: open
**Answer**: N/A

---

## How AI agents must update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **READ the entire file** before starting any work in this repository. It contains decisions and bug fixes that must not be repeated or reversed.
> 2. **APPEND, never edit or delete** existing entries. This file is append-only. Historical entries have permanent value.
> 3. **After every work session**, add an entry to **Session Log** (newest-first). Include: date, one-line summary, agent name, task, files changed, outcome, and key notes for the next agent.
> 4. **After every architectural decision**, add an entry to **Decisions & Rationale**. Set "Do not reverse without owner confirmation" honestly — this prevents future agents from re-litigating settled questions.
> 5. **After fixing a bug**, add an entry to **Bugs Encountered & Fixes Applied**. Always note the regression risk — areas that could break if related code changes.
> 6. **After discovering a reusable pattern**, add it to **Patterns That Work** with a concrete code example reference.
> 7. **After discovering a pattern that caused problems**, add it to **Patterns to Avoid** with the confirmed reason and the recommended alternative.
> 8. **When the owner corrects your output**, add an entry to **Owner Corrections** immediately. This is the highest-value signal — future agents must honour these rules.
> 9. **When you cannot resolve something**, add it to **Open Questions**. Set `Status: open`. When the owner answers, update the entry to `Status: answered` and add the answer. Do NOT attempt to work around open questions by guessing — flag and stop if the question is blocking.
> 10. **Update the "Last Updated" line** at the top of this file after every session.
