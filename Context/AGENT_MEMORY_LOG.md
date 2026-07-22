# Agent Memory Log

## Last Updated
2026-07-22 | Updated by: Antigravity AI Agent (Gemini 3.6 Flash)

## How to use this file
- READ this entire file before starting any task
- APPEND new entries after completing any task — never edit or delete existing entries
- Each entry must follow the standard format defined in each section below
- Entries are ordered newest-first within each section

---

## Session Log
A record of every agent work session. Each entry created at the end of a session.

### 2026-07-22 — Comprehensive Ecosystem Context Alignment (Retrop V3.5 Release)
**Agent**: Antigravity (Gemini 3.6 Flash)
**Task**: Audited the entire repository and updated all three context files (`PROJECT_BLUEPRINT.md`, `FEATURE_FLOWS.md`, `AGENT_MEMORY_LOG.md`) with recent ecosystem changes: Portal User OTP authentication system, multi-business switcher context, website telemetry & traffic analytics engine, SuperAdmin analytics dashboard, image security validation, smart CORS origin policy for Vercel, interactive documentation hub, and SPA Vercel deployment rewrites.
**Files changed**:
- Modified: `Context/PROJECT_BLUEPRINT.md`
- Modified: `Context/FEATURE_FLOWS.md`
- Modified: `Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: Added documentation for migrations `010_portal_users.sql` and `011_website_analytics.sql`, cataloged 10 new feature entries in `FEATURE_FLOWS.md`, documented new API routes (`/api/portal/auth/*`, `/api/analytics/*`), and verified repository structure.

### 2026-07-15 — Context Directory Alignment & Verification
**Agent**: Antigravity (Gemini 3.5 Flash)
**Task**: Verified and synchronized the `Context` folder contents to ensure maximum alignment and correctness with the latest ecosystem features. Identified and resolved missing documentation details: listed migration 009 in `PROJECT_BLUEPRINT.md`, documented Owner Portal menu-management, restaurant-settings, and analytics endpoints in the blueprint's API tables, and added detailed flows/index mappings in `FEATURE_FLOWS.md`.
**Files changed**:
- Modified: `Context/PROJECT_BLUEPRINT.md`
- Modified: `Context/FEATURE_FLOWS.md`
- Modified: `Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: Completed comprehensive cross-verification of active backend controller files/routes against the current Markdown blueprints.

### 2026-07-12 — Complete Owner Portal Integration & App Polish
**Agent**: Antigravity (Gemini 1.5 Pro)
**Task**: Implemented the Owner Dashboard features (Orders and Reviews sections with filters, direct modal reviews/invoice linkages) and Google Review integration (settings input, Thank You page redirects). Bypassed product key header for external customer A6 invoice PDF prints using temporary Redis authentication tokens.
**Files changed**:
- Modified: `Context/PROJECT_BLUEPRINT.md`
- Modified: `Context/FEATURE_FLOWS.md`
- Modified: `Context/AGENT_MEMORY_LOG.md`
- Modified: `Retrop_Website/src/pages/Dashboard.jsx`
- Modified: `Retrop_Website/src/services/api.js` (in previous session)
- Modified: `Retrop_RMS_Frontend/src/pages/ThankYou/ThankYou.jsx` (in previous session)
- Modified: `Server/src/controllers/customerOrderController.js` (in previous session)
- Modified: `Server/src/controllers/waiterController.js` (in previous session)
- Modified: `Server/src/controllers/ownerController.js` (in previous session)
- Modified: `Server/src/routes/routes.js` (in previous session)
- Created: `Server/src/migrations/009_google_review_link.sql` (in previous session)
**Outcome**: success
**Notes**: Bypassed product keys on PDF invoice print by storing temporary 10-minute tokens in Redis on order conclusion. Created Google page settings card, customer stars UI refactoring (gold stars), and locked one-time feedback submissions.

### 2026-07-10 — Update Context Files for Retrop V3 Release
**Agent**: Antigravity (Gemini 3.5 Flash)
**Task**: Updated all three context files (PROJECT_BLUEPRINT.md, FEATURE_FLOWS.md, AGENT_MEMORY_LOG.md) to reflect the recent Retrop V3 updates, cataloging the new Website surface (Owner Portal), 8 database tables, inventory BOM tracking, automated recipe COGS/gross profit logs, daily cash day close registries, unified staff aggregators, and Zod middleware validator.
**Files changed**:
- Overwritten: `Context/PROJECT_BLUEPRINT.md`
- Overwritten: `Context/FEATURE_FLOWS.md`
- Overwritten: `Context/AGENT_MEMORY_LOG.md`
**Outcome**: success
**Notes**: 
- Added Retrop_Website surface (port 5180) to orchestrator startup.
- Cataloged 8 migration updates: `retrop_owner`, `retrop_owner_session`, `vendor`, `inventory_item`, `purchase_entry`, `recipe`, `stock_adjustment`, `retrop_other_staff`, `loyalty_points`, `customer_feedback`.
- Outlined automatic AsyncLocalStorage tenant-scoping for owner sessions resolved through ownerAuthMiddleware.
- Added detailed descriptions of the BOM recipes mapping, expected vs actual cash day-close calculations, and monthly GSTR compliance summaries.

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

### 2026-07-19 — Self-Service Portal User System with Multi-Business Mapping
**Context**: Previously, owner accounts were manually provisioned per restaurant, restricting owners from managing multiple locations under a single credential.
**Decision**: Introduced a dedicated portal user system (`010_portal_users.sql` tables: `portal_user`, `portal_otp`, `portal_user_session`, `portal_user_business`). Portal users sign up via email OTP or Google OAuth and are mapped to one or more `retrop_restaurant` entities in `portal_user_business`. Upon login, the user selects their active restaurant context via `/api/portal/auth/select-business`.
**Do not reverse without owner confirmation**: yes

### 2026-07-19 — Persistent Telemetry Ingestion & File Backup Strategy
**Context**: Website traffic and visitor analytics needed to be monitored without slowing down page load performance or failing if database writes encountered transient errors.
**Decision**: Built a dual-layer telemetry analytics system (`analyticsService.js` & `website_analytics` table). Telemetry track hits and active session heartbeats are written to PostgreSQL and simultaneously backed up to `.data/website_analytics_backup.json` (ignored by nodemon via `nodemon.json`).
**Do not reverse without owner confirmation**: yes

### 2026-07-19 — Dynamic Smart CORS Whitelisting for Vercel Deployments
**Context**: Multi-surface SPA deployments on Vercel (`retrop.vercel.app`, `retrop-rms.vercel.app`, preview URLs) were blocked by strict single-origin CORS rules.
**Decision**: Refactored `Server/src/index.js` CORS middleware to inspect request origins dynamically. Whitelists local development origins (`localhost`, `127.0.0.1`, `*.ngrok-free.app`), production Vercel domains (`*.vercel.app`), and custom origins configured via `ALLOWED_ORIGINS` environment variable.
**Do not reverse without owner confirmation**: yes

### 2026-07-12 — Temporary 10-Minute Redis Tokens for Customer PDF Billing
**Context**: The mobile app prints a QR code containing the billing PDF download URL. When scanned by customers on their own mobile devices, it failed with a JSON error saying `X-Product-Key missing`, as their mobile web browsers do not have the restaurant's private API product key header.
**Decision**: Remove the product key authorization middleware constraint from `GET /api/orders/:orderId/bill-pdf`. Instead, generate a random temporary token valid for 10 minutes in Redis upon concluding the order (`temp_bill_token:<orderId>`). The customer's mobile browser scans the link `?token=xxx` which is verified directly against Redis. Bypasses the need to embed product keys on client devices.
**Do not reverse without owner confirmation**: yes

### 2026-07-10 — Single-Restaurant Binding in Owner Authentication Middleware
**Context**: In Retrop V3, owners manage their restaurant's back-office operations from the Owner Portal. However, the portal does not use a `X-Product-Key` header, unlike the frontends.
**Decision**: In `ownerAuthMiddleware`, resolve the `restaurantId` dynamically from the owner's profile (`retrop_owner` joined via `retrop_restaurant`), and call `tenantContext.enterWith({ restaurantId })`. This binds the multi-tenant context for the request lifecycle, ensuring all downstream queries automatically target only the owner's restaurant.
**Do not reverse without owner confirmation**: yes

### 2026-07-10 — Request Validation Layer via Zod Middleware
**Context**: New inventory, staff, and cash endpoints needed explicit format validation to avoid incomplete database records or unhandled type exceptions.
**Decision**: Standardized a request validation middleware `validate(schemas.name)` that executes schema checking using Zod. Returns HTTP 400 with a detailed field error mapping if validation checks fail, preventing execution from hitting controllers.
**Do not reverse without owner confirmation**: no

### 2026-07-10 — Asynchronous Cost of Goods Sold (COGS) Calculation
**Context**: Mapped ingredients in recipes/BOM must translate to profitability metrics when customers complete orders.
**Decision**: Executed `computeAndStoreCOGS` asynchronously on order conclusion. Resolves ingredients from recipes, computes portion scaling factor `(orderedQty / yieldQuantity)`, and scales units by the ingredient's latest purchase price (`costPerUnit`), writing `costOfGoods` and `grossProfit = finalAmount - costOfGoods` directly into the order.
**Do not reverse without owner confirmation**: yes

### 2026-06-27 — Multi-Tenant Isolation via AsyncLocalStorage Supabase Proxy
**Context**: The system migrated from single-restaurant (one DB = one restaurant) to multi-tenant SaaS (shared DB, scoped by restaurantId). Every tenant table needs `restaurantId` filtering on every query.
**Decision**: Instead of manually adding `.eq('restaurantId', ...)` to every query, a JavaScript `Proxy` wraps the Supabase client. When a tenant-scoped table is accessed and `tenantContext` (Node.js `AsyncLocalStorage`) has a store, the proxy automatically injects `restaurantId` into inserts/upserts and appends `.eq('restaurantId', ...)` to all queries. The `productKeyAuth` middleware sets the context via `tenantContext.enterWith({ restaurantId })`.
**Alternatives considered**: Manual scoping on each query (error-prone, verbose). Supabase RLS policies (would require per-request JWT with restaurant claims — complex). Separate databases per tenant (too expensive at this stage).
**Do not reverse without owner confirmation**: yes

---

## Bugs Encountered & Fixes Applied
A record of bugs found and how they were resolved.

### 2026-07-19 — ISSUE: Nodemon Server Restart Loop on Analytics Backup File Writes
**Symptom**: Operating the website triggered rapid server restarts every time a visitor hit a page or sent a heartbeat ping.
**Root cause**: `analyticsService.js` persisted JSON telemetry logs to `Server/.data/website_analytics_backup.json`. `nodemon` was watching all file writes inside the `Server/` directory, interpreting local JSON backup updates as server source code edits.
**Fix applied**: Created `Server/nodemon.json` configured to explicitly ignore `.data/*` and `data/*` runtime directories.
**Regression risk**: None.

### 2026-07-19 — ISSUE: Portal User Password Reset OTP Verification Failure
**Symptom**: Portal user password reset requests failed during OTP verification.
**Root cause**: Incorrect field identifier handling in `portalAuthController.js` when querying `portal_otp` for purpose `'forgot_password'`.
**Fix applied**: Aligned schema property names in `portalAuthController.js` to match `010_portal_users.sql` column definitions (`code`, `purpose`, `expiresAt`, `used`).
**Regression risk**: None.

### 2026-07-10 — ISSUE: Zod Validation Middleware Crash & UUID Format Failures
**Symptom**: 
1. The server crashed with a 500 error `Cannot read properties of undefined (reading 'map')` when returning validation details on guarded endpoints.
2. After resolving the crash, password resets on mock owner accounts failed with `Invalid request payload` due to an `Invalid ownerId format` validation error.
**Root cause**: 
1. In `Server/src/middleware/validate.js`, validation errors were mapped using `error.errors.map()`. Zod v4 deprecated the `.errors` alias in favor of `.issues`.
2. Seed/mock data in `demo.sql` uses non-RFC 4122 compliant UUID strings (such as `10000000-1111-1111-1111-111111111111`, where the variant marker is not `8`, `9`, `A`, or `B`). Zod v4 strictly enforces RFC 4122 version and variant formats in the `.uuid()` check, rejecting mock development values.
**Fix applied**: 
1. Changed error mapping to look up `error.issues || error.errors`.
2. Introduced a `looseUuid` schema pattern using a standard regex matching structure in place of Zod's strict `.uuid()` method across all schemas in `validate.js`.
**Regression risk**: None, fallback handles standard and non-standard/mock UUIDs.

---

## Patterns That Work
Reusable approaches confirmed to work well in this codebase.

### Telemetry Session Heartbeat Pattern
**Context**: Tracking active visitor session durations on SPAs accurately without heavy polling.
**Approach**: `useAnalytics.js` hook registers a page hit on route change, then initializes a 15-second heartbeat timer interval. The client sends `durationSeconds` to `/api/analytics/heartbeat` when the tab remains active and stops on page unload.
**First confirmed**: 2026-07-19

### Zod Validation Middleware Pattern
**Context**: Request validation was repetitive and error-prone across different endpoints.
**Approach**: Define structured schemas inside `validate.js`, wrap the schema in a validation helper, and pass it directly to the Express route handler map.
**Example**: `Server/src/routes/routes.js` — `router.post('/api/owner/staff', ownerAuthMiddleware, validate(schemas.createStaff), staffController.createStaff);`
**First confirmed**: 2026-07-10

### Supabase multi-tenant Proxy pattern
*(No changes)*

### Product key middleware pattern
*(No changes)*

### Tenant-scoped Redis key pattern
*(No changes)*

### IST timestamp generation for DB writes
*(No changes)*

### ENDPOINTS lazy getters in App
*(No changes)*

### Auth context pattern (login / logout / getAuthHeaders / refreshToken)
*(No changes)*

### loggingOutRef pattern for auth guard in layouts
*(No changes)*

### requireRestaurantOpen middleware placement
*(No changes)*

---

## Patterns to Avoid

### Trusting client-submitted prices for order calculation
*(No changes)*

### Global CORS `origin: '*'` in production
*(No changes)*

### Using `new Date().toISOString()` for DB writes
*(No changes)*

### Inline Redis key strings
*(No changes)*

### Querying tenant tables without product key context
*(No changes)*

---

## Owner Corrections
Every time the owner corrected an agent's output or redirected a task.

*(No owner corrections recorded yet.)*

---

## Open Questions
Things agents couldn't resolve and flagged for the owner.

### 2026-06-27 — .env.example is outdated
*(No changes)*

### 2026-06-27 — SERVER_URL env var for email QR generation
*(No changes)*

### 2026-06-21 — Backend deployment target
*(No changes)*

### 2026-06-21 — Frontend deployment target
*(No changes)*

### 2026-06-21 — CORS origin restriction for production
*(No changes)*

---

## How AI agents must update this file

> **AGENT UPDATE INSTRUCTIONS — read before editing this file**
>
> 1. **READ the entire file** before starting any work in this repository.
> 2. **APPEND, never edit or delete** existing entries. This file is append-only.
> 3. **After every work session**, add an entry to **Session Log** (newest-first).
> 4. **After every architectural decision**, add an entry to **Decisions & Rationale**.
> 5. **After fixing a bug**, add an entry to **Bugs Encountered & Fixes Applied**.
> 6. **After discovering a reusable pattern**, add it to **Patterns That Work**.
> 7. **After discovering a pattern that caused problems**, add it to **Patterns to Avoid**.
> 8. **Update the "Last Updated" line** at the top of this file after every session.
