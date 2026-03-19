# Open Bookshelf / Open Reader / Open Sync — Platform Architecture Plan

## A. Executive summary
OpenBookshelf already has strong foundations: a Next.js app-router shell, reader UI, Supabase-first data access, modular feature flags, OPDS connectors, AI actions, and a growing external API surface. The fastest path to a complete open reading platform is **not a rewrite**; it is a domain refactor into a modular monolith with strict boundaries:

- `library-core` (books/metadata/state)
- `reader-runtime` (epub/pdf/session + annotations)
- `sync-engine` (connectors, jobs, mappings, conflicts)
- `ai-engine` (provider abstraction + queued tasks)
- `integration-api` (external sync + extension handshake)
- `platform-ops` (health, audit, admin, costs)

This plan preserves existing UX and routing while isolating risky areas (provider adapters, connector scrapers, AI variability) behind stable contracts.

## B. Audit of current app
### Current architecture overview
- Next.js 16 App Router frontend + server routes/actions.
- Data client abstraction currently in `utils/supabase/*`, with runtime provider resolution in `lib/config/database.ts`.
- Firebase REST compatibility adapter exists but is large and emulates Supabase behavior (`utils/firebase/rest-compat.ts`).
- Reader state auto-sync and status resolution implemented (`components/ReaderWrapper.tsx`, `lib/sync/reading-status.ts`).
- External API endpoints under `/api/v1/*` with bearer token guard (`lib/api/external-auth.ts`).
- Runtime health dashboard/API (`app/setup/page.tsx`, `app/api/v1/health/route.ts`, `lib/config/runtime-health.ts`).

### Strengths
- Working feature toggles and settings model with presets.
- Practical integration APIs for external tools.
- Reader progress/status sync pipeline already present.
- Documentation momentum (`docs/EXTERNAL_API.md`, README sections).

### Weaknesses
- Provider adapter complexity concentrated in one large Firebase file.
- Business logic mixed in route handlers/components.
- No formal job queue abstraction for sync/AI background tasks.
- API contracts are present but thinly versioned/typed.

### Scalability risks
- REST compatibility adapter doing in-memory filtering for query operators.
- No durable sync job queue or retry policy model yet.
- No dedicated search index abstraction for large libraries.

### Maintainability issues
- Domain rules duplicated across UI, actions, and API routes.
- Connector behavior not yet under a strict adapter interface package.

### Security risks
- External bearer token is global; no scoped integration keys/rotation.
- Connector fetch behavior needs strict SSRF allowlists/timeouts.

### Performance bottlenecks
- Client-side filtering in Firebase compat mode for complex queries.
- Potential N+1 patterns in some page-level queries.

### Data model problems
- Good base entities, but missing first-class entities for sync mappings/conflicts/jobs/AI artifacts in app-level model layer.

### UX inconsistency issues
- Setup/FAQ exists, but sync center and conflict resolution UX are not first-class pages.

### Missing core capabilities
- Queue-backed background sync orchestration.
- Dedicated highlights/annotations domain pages.
- Connector health/history dashboard.
- Extension auth handshake endpoints.

### Keep / Refactor / Remove / Add
- **Keep**: reader UX baseline, settings system, feature flags, OPDS integration, API v1 foundation.
- **Refactor**: provider adapters, sync orchestration, route validation, domain service boundaries.
- **Remove**: ad-hoc data logic from UI components over time.
- **Add**: sync job engine, connector SDK contract, AI job queue, extension bridge, admin observability surfaces.

## C. Proposed target architecture
Adopt a **modular monolith** with package-like folders under `lib/domains/*` and `lib/platform/*`.

- `lib/domains/library/*`
- `lib/domains/reader/*`
- `lib/domains/sync/*`
- `lib/domains/ai/*`
- `lib/domains/connectors/*`
- `lib/platform/data/*` (supabase/firebase/demo repositories)
- `lib/platform/jobs/*`
- `lib/platform/search/*`
- `lib/platform/security/*`

All UI/routes call domain services; services call repository interfaces; repositories choose runtime provider.

## D. Core feature modules
1. Library core: books/authors/series/editions/files/shelves/tags/status/notes/highlights.
2. Sync engine: import/schedule/background/retry/conflicts/history/mappings.
3. Reader runtime: session, progress, annotations, bookmarks, per-book prefs.
4. AI engine: async tasks, provider fallback, embeddings/search, cost controls.
5. Integration API: external sync endpoints, scoped API keys, webhook ingestion.
6. Ops/admin: health, queues, connector failures, AI usage, storage metrics.

## E. Reader module specification
- `ReaderSessionService`: begin/update/end sessions.
- `ReaderPreferenceService`: global + per-book overrides.
- `AnnotationService`: highlights/notes anchor mapping.
- `ProgressPolicy`: status transitions (already seeded by `resolveReadingStatus`).
- APIs:
  - `POST /api/v1/reader/session`
  - `POST /api/v1/reader/annotation`
  - `GET /api/v1/reader/state?book_id=...`

## F. Sync/connectors specification
Connector contract:
- `authenticate()`
- `fetchLibrary()`
- `fetchBookDetails(externalId)`
- `fetchReadingProgress()`
- `fetchCollections()`
- `importHighlights()`
- `exportProgress()`
- `syncStatus()`
- `resolveConflict()`
- `supportsWebhook()`

Add `sync_jobs`, `sync_runs`, `sync_mappings`, `sync_conflicts` tables and queue workers.

## G. AI system specification
Provider abstractions:
- completion/chat
- embeddings
- rerank
- OCR hook

Execution model:
- queued jobs (`ai_jobs`)
- cached outputs (`ai_artifacts`)
- strict budget + provider fallback + privacy mode

## H. Browser extension specification
- Content adapters per supported site.
- Background worker queue + retry.
- Secure handshake endpoint in app:
  - `POST /api/v1/extension/session/start`
  - `POST /api/v1/extension/events`
- Per-site opt-in controls and minimal permissions.

## I. Data model/schema plan
Add/normalize:
- `book_editions`, `book_files`, `annotations`, `highlights`, `note_links`
- `sync_connectors`, `sync_jobs`, `sync_runs`, `sync_mappings`, `sync_conflicts`
- `ai_jobs`, `ai_artifacts`, `recommendations`
- `integration_keys` (scoped + rotated)
- `activity_logs`

Indexing:
- composite indexes on `(user_id, status, updated_at)` and `(connector_id, sync_state)`
- full text/semantic index abstraction in `platform/search`

Migration strategy:
- additive migrations first
- dual-write where needed
- backfill scripts per domain
- progressive route cutover to domain services

## J. UX/UI structure
Primary IA:
- Dashboard
- Library
- Book Detail
- Reader
- Collections
- Notes/Highlights
- Import/Export
- Sync Center
- AI Center
- Settings
- Setup
- FAQ

UX principles:
- progressive disclosure
- bulk actions and saved views
- conflict-resolution wizard
- robust empty/error/retry states

## K. Security, reliability, performance fixes
- Replace single global external token with scoped integration keys.
- Add rate limiting + request size caps on `/api/v1/*`.
- SSRF protections for connector URLs (allowlist + DNS/IP checks).
- Queue retries with exponential backoff and idempotency keys.
- Add pagination defaults to every list endpoint.

## L. Refactor roadmap in phases
1. Domain extraction + repository interfaces.
2. Sync engine tables + worker loop.
3. Connector SDK + migrate existing OPDS/import paths.
4. Reader annotation subsystem.
5. AI queue and artifact caching.
6. Extension handshake + ingestion.
7. Admin/ops dashboards.

## M. Quick wins to implement first
1. Scoped integration keys (`integration_keys`) replacing global token.
2. Sync Center page with run history and conflict queue.
3. API pagination/filter contract unification.
4. Reader annotations table + minimal UI.
5. Connector health pings with last-success timestamps.

## N. Risks / tradeoffs
- Firebase REST compatibility can become expensive and divergent vs Supabase SQL semantics; keep it behind repository contract and feature parity matrix.
- Two-way sync requires per-connector safety rules; default to one-way + dry-run.
- AI features must be asynchronous for reliability/cost control.

## O. Exact folder-level plan (based on current repo)
- Keep current routes/pages; progressively introduce:
  - `lib/domains/library/*`
  - `lib/domains/reader/*`
  - `lib/domains/sync/*`
  - `lib/domains/ai/*`
  - `lib/domains/connectors/*`
  - `lib/platform/data/{supabase,firebase,demo}/*`
  - `lib/platform/jobs/*`
  - `lib/platform/security/*`
- Move logic from:
  - `app/actions/*.ts` -> domain services
  - `app/api/v1/*.ts` -> controller + validator + service
  - `components/ReaderWrapper.tsx` data updates -> `reader` domain service hooks
- Add docs:
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/SYNC_ENGINE.md`
  - `docs/AI_ENGINE.md`
  - `docs/EXTENSION_PROTOCOL.md`
