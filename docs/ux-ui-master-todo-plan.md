# OpenBookshelf UX/UI Master TODO Plan

Prepared: March 5, 2026

## Goal
Create a complete UX/UI execution plan that covers:
- Immediate product breakages
- Small polish improvements across every screen
- Mid/long-term feature tracks
- Clear implementation order for shipping
- Social reading and book-tracking features with privacy controls
- PWA-grade speed, offline behavior, and installability
- Deep personalization, customizable modules, and smarter AI tooling

## Audit Summary (Current State)
- UI quality is promising, but behavior is inconsistent across routes.
- Core flows (library -> book -> reader -> tracking) are partially implemented, with mixed local and server data models.
- Design tokens exist, but many screens still use one-off colors/styles.
- Lint reports 84 errors and 29 warnings, which indicates a high risk of regressions and unstable UX.

## Priority Framework
- `P0` Blocker: broken flow, data loss risk, or impossible action.
- `P1` High: major usability pain or frequent friction.
- `P2` Medium: meaningful polish and efficiency improvement.
- `P3` Nice-to-have: delight and advanced UX.

## Research-Based Product Principles
- Fast-first UX: critical flows should feel instant, with optimistic updates and resilient offline behavior.
- Progressive complexity: basic mode is clean; advanced capabilities are opt-in via modules/settings.
- Social by consent: all sharing/activity is explicit opt-in with clear privacy levels.
- Personal library ownership: users can shape metadata, shelves, tags, and reading workflows to match habits.
- Explainable AI: AI suggestions are editable, source-aware, and never forced.

---

## Phase 0: Stabilize Core UX (P0)

### Platform Integrity
- [x] Fix home book links (`/book/$({book.id})` -> `/book/${book.id}`) so cards open correctly.
- [x] Remove broken links to missing `/connections/[id]` route or implement that route.
- [x] Replace non-existent `/api/import-opds` flow with the existing server action import flow.
- [x] Resolve lint/parser blockers first (notably `app/community/page.tsx`, `ai.js`).
- [x] Eliminate React anti-pattern errors (`components created during render`, try/catch JSX boundaries, setState in effect warnings).

### Data Consistency
- [x] Pick one canonical source for library screens (Supabase or local store), then migrate pages consistently.
- [x] Align status enums across DB and UI (`toread`, `plan_to_read`, `reading_state`, etc.).
- [x] Standardize source sync mode naming (`pull_only` vs `pull-only`) in UI and DB.
- [ ] Ensure every page uses authenticated user-scoped queries.

### Actionability Gaps
- [ ] Make alias vote buttons call `voteAliasAction` and update counts/status in UI.
- [ ] Implement global search results page (current navbar search only logs to console).
- [x] Ensure all CTA buttons do real actions or are explicitly marked disabled with explanation.
- [x] Add error toasts and success confirmations for all write actions.

---

## Phase 1: UX Foundations (P1)

### App Shell and Navigation
- [x] Add active state logic for all nested routes (book, reader, connections browse).
- [x] Add breadcrumb support on deep pages.
- [x] Improve mobile nav overflow behavior (horizontal tabs + sticky safe-area padding).
- [x] Add a command palette (`Ctrl/Cmd+K`) for quick navigate/import/search.
- [x] Add keyboard shortcut hints in tooltips for common actions.

### Visual System
- [x] Replace hardcoded grays/blues/purples in pages with tokenized semantic colors.
- [ ] Unify card radii, border style, shadows, spacing scale.
- [x] Create consistent state components: empty/error/loading/success.
- [ ] Add dark-mode parity pass for every route.
- [ ] Add visual regression snapshots for key pages.

### Forms and Feedback
- [x] Replace `alert()` usage with accessible toast notifications.
- [ ] Add inline validation messages and input helper text.
- [ ] Add optimistic UI with rollback on failed mutations.
- [x] Add autosave status label in settings (`saving`, `saved`, `error`).

---

## Phase 2: Screen-by-Screen UX TODO Backlog

### Home / Library (`/`)
- [x] Real filters: status, rating, source, shelf, language, format.
- [x] Sort controls: recent, title, author, progress, rating.
- [x] Persist filter/sort state in URL query params.
- [x] Add grid/list/dense view toggle.
- [ ] Add bulk selection and bulk actions (status move, shelf assign, delete).
- [ ] Add quick-add book modal (manual + ISBN + OPDS URL).
- [ ] Replace mock inbox with real pending import/merge queue.
- [ ] Add undo for destructive actions.
- [x] Add proper empty-state onboarding for first-time users.

### Book Detail (`/book/[id]`)
- [ ] Replace mock-only details with full DB data.
- [ ] Add editable metadata panel (title, authors, series, tags, notes).
- [ ] Add genres and categories panel (multi-select with user-defined vocabularies).
- [ ] Add emoji-assisted tags (example: `:mystery:`, `:comfort_read:`) with include/exclude filters.
- [ ] Add chapter list with progress markers.
- [ ] Add reading timeline/history section.
- [ ] Add source provenance and sync diagnostics.
- [ ] Add AI summary controls only when module enabled.
- [ ] Add AI actions for rewrite/simplify/expand summary and spoiler-safe mode toggle.
- [ ] Add confirm dialog before delete.
- [ ] Add relation links (author page, series page, similar books).
- [ ] Add book health panel (missing cover, missing description, missing genre, duplicate risk).
- [ ] Add quick actions bar (continue, set status, rate, add tag, add note) pinned on mobile.

### Reader (`/read/[id]` + Reader components)
- [ ] Apply `theme` and `fontSize` props end-to-end in `EpubReader`.
- [ ] Add font family and line-height controls.
- [ ] Add progress HUD (chapter/page/percentage).
- [ ] Add bookmark and highlight actions.
- [ ] Add keyboard navigation (`Arrow`, `Space`, `J/K`).
- [ ] Add tap-zone paging for mobile.
- [ ] Add reader loading skeleton + graceful file failure fallback.
- [ ] Persist all reader preferences in `user_settings` with local fallback.

### Tracker (`/tracker`)
- [ ] Add drag-and-drop columns to change status directly.
- [ ] Add quick progress update controls on cards.
- [ ] Add date-based insights (started/finished streaks).
- [ ] Add personal goals and year challenge widgets.
- [ ] Add filters by shelf/source/author.
- [ ] Add compact mode for large libraries.

### Discover (`/discover`, `/discover/browse`)
- [ ] Improve OPDS card metadata (book count, language, trust indicators).
- [ ] Add OPDS search in-feed where supported.
- [ ] Add pagination UI and cached previous page navigation.
- [ ] Add import preview modal (merge choice/new copy/update).
- [ ] Add duplicate warnings before import.
- [ ] Add better cover fallbacks and broken image handling.

### Connections (`/connections`, `/connections/add`, `/connections/[id]/browse`)
- [ ] Add source settings page (currently linked but missing).
- [ ] Add connection test button and validation before save.
- [ ] Support credentials flow for private OPDS/API endpoints.
- [ ] Show last sync time, last error, and item counts.
- [ ] Add manual sync trigger with progress UI.
- [ ] Add source deletion confirmation with impact summary.
- [ ] Add source edit form (name/url/type/trust/sync mode).

### Authors and Series (`/authors`, `/series`, detail pages)
- [ ] Normalize visual style with the rest of app tokens.
- [ ] Add search and sort within author/series lists.
- [ ] Add richer stats (total books, started, completed, avg rating).
- [ ] Add author and series follow/watch options.
- [ ] Add per-author and per-series reading progress summaries.

### Aliases (`/aliases`)
- [ ] Show full alias card: canonical title, source title, confidence, votes.
- [ ] Wire approve/reject buttons to server action.
- [ ] Add queue filters (`pending`, `approved`, `rejected`).
- [ ] Add conflict explanation text and source provenance.
- [ ] Add batch vote actions for trusted high-confidence items.

### Settings and Modules (`/settings`, `/modules`)
- [ ] Split settings into user-level and instance-level sections clearly.
- [ ] Add save indicators and failure recovery actions.
- [ ] Add import/merge behavior presets with explanation.
- [ ] Add reader profile presets (focus, relaxed, accessibility).
- [ ] Add module dependency warnings (enable X requires Y).
- [ ] Add module search, grouping, and risk badges.
- [ ] Add personalization presets (Minimalist, Power Reader, Tracker Pro, Social Reader).
- [ ] Add per-device profiles (phone/tablet/desktop) for layout and reader defaults.
- [ ] Add advanced theme editor (tokens for typography scale, density, border radius, and motion intensity).
- [ ] Add module permission levels (`user`, `admin`, `instance`) and lock states.
- [ ] Add import/export settings profile as JSON.
- [ ] Add module conflict resolver when two modules alter the same capability.

### Community (`/community`)
- [ ] Decide scope: keep as experimental module or remove from main app until stable.
- [ ] Fix parse/typing issues and gate route by module flag.
- [ ] Replace mock feed with real backend model or hide behind feature flag.
- [ ] Add privacy controls before public activity rollout.

---

## Small UX/UI Polish Checklist (High-Value Micro Improvements)

### Micro-interactions
- [ ] Add consistent hover/focus/pressed states to all actionable elements.
- [ ] Add skeleton loaders sized to final layout to prevent shifts.
- [ ] Add subtle motion on card entry and filter changes.
- [ ] Add copy-to-clipboard affordances for IDs/URLs.

### Accessibility
- [ ] Ensure all icon-only buttons have `aria-label`.
- [ ] Reach 44x44 minimum touch targets on mobile.
- [ ] Confirm visible focus rings on every interactive control.
- [ ] Add semantic headings and landmarks per page.
- [ ] Add `prefers-reduced-motion` behavior for reader animations.
- [ ] Run keyboard-only pass for all major flows.

### Empty, Error, Loading States
- [ ] Add tailored empty states with next-step CTA per module.
- [ ] Add retry affordance on network failures.
- [ ] Add offline banners and degraded mode hints.
- [ ] Add informative `not found` screens with recovery links.

### Content Quality
- [ ] Improve CTA clarity (`Add`, `Import`, `Browse`, `Sync` verbs).
- [ ] Standardize status labels across pages.
- [ ] Improve helper text for technical fields (OPDS URL, trust level, sync mode).
- [ ] Add user-facing explanations for module toggles.

---

## Phase 3: Feature Expansion Tracks (P2/P3)

### Search and Discovery
- [ ] Full-text search index for title/author/alias/notes.
- [ ] Saved searches and smart shelves.
- [ ] Recommendation rail based on history and similar metadata.

### Reading Intelligence
- [ ] Session stats (time read today/week).
- [ ] Reading streaks and momentum nudges.
- [ ] Summary quality controls and regeneration history.

### Collaboration and Social (Optional)
- [ ] Private sharing links for reading lists.
- [ ] Book reviews and reactions.
- [ ] Friend activity feed with privacy scopes.

### Admin and Self-Hosted Controls
- [ ] Instance diagnostics dashboard.
- [ ] Module change audit trail.
- [ ] Role-based access controls for advanced pages.

---

## Phase 4: Social, PWA, Personalization, and Platform Upgrades

### Social Reading and Book Tracking
- [ ] Introduce social graph primitives: follow, follower, friend request, blocked users.
- [ ] Add social activity feed types: started, finished, rated, reviewed, quote shared, milestone reached.
- [ ] Add privacy levels per event: `private`, `friends`, `followers`, `public`.
- [ ] Add reading clubs: invite-based group shelves, monthly challenge, group discussion thread.
- [ ] Add collaborative shelves (shared curation lists with edit permissions).
- [ ] Add progress reactions (`cheer`, `insightful`, `want-to-read`) and moderation tools.
- [ ] Add social reading goals with weekly leaderboards (opt-in only).
- [ ] Add anti-spam controls: rate limits, report flow, mute/block, content visibility filters.

### PWA, Speed, and Offline Performance
- [ ] Add full installable PWA flow (`manifest`, icons, screenshots, install prompt UX).
- [ ] Add service worker strategy:
- [ ] App shell cache-first.
- [ ] API stale-while-revalidate.
- [ ] Reader/offline critical assets pre-cache.
- [ ] Add offline library mode with queued mutations and conflict resolution UI.
- [ ] Add background sync for deferred imports and reading progress writes.
- [ ] Add network-quality adaptation (reduce image quality/animations on slow connections).
- [ ] Add performance budgets:
- [ ] Home LCP target under 2.5s on 4G.
- [ ] Route transition target under 200ms for cached pages.
- [ ] First reader interaction under 1.5s from click.
- [ ] Add bundle splitting review per route and module.
- [ ] Add list virtualization for very large libraries and feeds.

### Login and Identity Options
- [ ] Add auth providers: email magic link, Google, GitHub, optional Apple.
- [ ] Add passkey/WebAuthn option for passwordless sign-in.
- [ ] Add optional local-only guest mode with upgrade-to-account flow.
- [ ] Add account linking (merge local guest data into authenticated profile).
- [ ] Add session security settings (device list, revoke sessions, recent login events).
- [ ] Add optional 2FA module for self-hosted deployments.

### Overall Library View and Organization
- [ ] Add unified Library Dashboard:
- [ ] status overview (to-read, reading, completed, dropped).
- [ ] genre/category distribution.
- [ ] reading velocity and completion trend.
- [ ] source health and sync summary.
- [ ] Add advanced taxonomy:
- [ ] canonical genres.
- [ ] custom categories.
- [ ] emoji tags.
- [ ] mood/energy tags.
- [ ] Add smart collections (rules like `genre=scifi AND rating>=4`).
- [ ] Add faceted search panel with include/exclude logic for tags, genres, formats, sources.
- [ ] Add duplicate detector view and merge center.

### Deep Personalization System
- [ ] Add personalization engine with weighted user preferences:
- [ ] preferred genres.
- [ ] preferred length/pace.
- [ ] preferred tone/style.
- [ ] Add customizable home widgets (drag/drop dashboard cards).
- [ ] Add custom quick actions and keyboard shortcut mapping.
- [ ] Add recommendation explainability (`Because you liked...`, `Popular in your tags...`).
- [ ] Add daily/weekly digest preferences per channel (in-app/email/push).

### AI Module Expansion
- [ ] Add AI metadata enrichment: inferred genres, tone, themes, reading level.
- [ ] Add AI shelf suggestions and auto-tagging with human review queue.
- [ ] Add AI reading companion:
- [ ] chapter recap.
- [ ] character tracker.
- [ ] glossary/term explainer.
- [ ] discussion questions.
- [ ] Add AI import assistant to resolve duplicates and alias proposals with rationale.
- [ ] Add AI recommendation engine with configurable confidence thresholds.
- [ ] Add AI safety controls:
- [ ] explicit opt-in per feature.
- [ ] model/provider selector.
- [ ] token/cost usage dashboard.
- [ ] prompt/result history with delete controls.

### Module System 2.0
- [ ] Introduce module manifest v2:
- [ ] capability flags.
- [ ] dependency graph.
- [ ] migration hooks.
- [ ] settings schema.
- [ ] Add module lifecycle states: `installed`, `enabled`, `disabled`, `error`, `deprecated`.
- [ ] Add module marketplace UX with trust badges and version compatibility matrix.
- [ ] Add runtime guardrails so broken modules fail safely without breaking core app.
- [ ] Add module analytics (usage, performance impact, error rate).
- [ ] Add feature rollout controls: user cohort targeting and gradual rollouts.

### Feature Request System
- [ ] Add in-app feature request board route (`/feedback` or `/feature-requests`).
- [ ] Add request submission form with category, impact, urgency, and screenshots.
- [ ] Add voting and prioritization model (upvote, watch, status updates).
- [ ] Add roadmap statuses: `triaged`, `planned`, `in progress`, `shipped`, `declined`.
- [ ] Add changelog auto-linking from shipped requests.
- [ ] Add admin moderation tools and duplicate request merging.
- [ ] Add public API/export for roadmap transparency (self-hosted optional).

### UX/UI Helper Toolkit (Users and Admins)
- [ ] Add one-click quick actions on book cards: `mark finished`, `start`, `add to shelf`, `favorite`.
- [ ] Add bulk admin actions for library hygiene: missing cover scan, duplicate scan, broken source links scan.
- [ ] Add command-bar actions for admins: reindex, resync source, recompute recommendations, clear queue.
- [ ] Add contextual helper hints in complex forms (trust level, merge threshold, sync mode) with examples.
- [ ] Add guided setup checklists for new users and admins (first book, first source, first backup).
- [ ] Add in-app diagnostics panel with copyable debug bundle for support.
- [ ] Add admin-safe destructive action flow with typed confirmation and undo windows.
- [ ] Add per-page activity logs (`who changed status`, `when source updated`, `what module toggled`).

### Self-Hosted Community and Governance
- [ ] Add community deployment mode with namespace support (`instance slug`, theming, custom rules).
- [ ] Add community roles: `owner`, `admin`, `moderator`, `trusted_member`, `member`, `guest`.
- [ ] Add moderation queue for reports, abusive tags/comments, and spam activity.
- [ ] Add configurable community rule packs (strict, balanced, open) for content visibility.
- [ ] Add federation-ready architecture notes for future multi-instance interactions.
- [ ] Add safe onboarding for communities: invite links, approval queue, code-of-conduct acceptance.
- [ ] Add local backup/restore UX for self-hosted operators with validation preview.

### Community Tagging, Commenting, and Reading Together
- [ ] Add threaded comments per book/chapter with spoiler scopes (`no spoiler`, `chapter-bounded`, `full spoiler`).
- [ ] Add community tags with moderation states: `pending`, `approved`, `blocked`.
- [ ] Add live read-together sessions:
- [ ] host-led reading room.
- [ ] synchronized chapter checkpoints.
- [ ] shared notes timeline.
- [ ] Add buddy reading mode with private chat and progress sync.
- [ ] Add quote highlights that can be private or shared to group feed.
- [ ] Add community challenges (`read 3 sci-fi in 30 days`) with progress badges.

### Reader Excellence (Make It a Very Good Reader)
- [ ] Add advanced typography packs (book-like serif pack, dyslexia-friendly pack, compact technical pack).
- [ ] Add margin/column width controls and one-hand mode for mobile.
- [ ] Add text-to-speech hooks and read-aloud controls (module-gated).
- [ ] Add smart footnote popovers and inline glossary support.
- [ ] Add side-by-side translation mode for multilingual readers.
- [ ] Add session focus mode (hide all chrome, timed breaks, distraction-free stats).
- [ ] Add citation/export snippets for highlights and notes.

### External Integrations (StoryGraph, Goodreads, Author.Today, More)
- [ ] Add import connectors for StoryGraph exports (CSV/JSON mapping to books, ratings, dates).
- [ ] Add import connectors for Goodreads exports with shelf/status mapping and duplicate merge flow.
- [ ] Add Author.Today connector for metadata/sync where API or permitted feed access is available.
- [ ] Add connector architecture docs covering legal/TOS constraints and fallback import strategies.
- [ ] Add scheduled sync adapters with per-provider retry policies and error dashboards.
- [ ] Add connector health status page with last sync, mapped fields, and data-quality score.
- [ ] Add conflict-preference templates per provider (`prefer local`, `prefer provider`, `manual`).

### API Platform and Webhook System
- [ ] Add public API v1 (`/api/v1`) for books, shelves, progress, tags, and feature requests.
- [ ] Add OAuth/token system for third-party integrations and scoped API keys.
- [ ] Add outgoing webhook engine for core events:
- [ ] `book.imported`
- [ ] `book.updated`
- [ ] `reading.progress.updated`
- [ ] `feature_request.created`
- [ ] `alias.approved`
- [ ] Add inbound webhook ingestion endpoint with signature verification and replay protection.
- [ ] Add webhook retries, dead-letter queue, and delivery logs UI.
- [ ] Add self-hosted automation recipes (n8n/Zapier-like examples) for common workflows.

### Setup Versions and Distribution Tiers
- [ ] Define setup tiers clearly in docs and UI onboarding:
- [ ] `Starter` (single user, local mode, no social).
- [ ] `Reader Pro` (cloud sync, AI features, advanced reader).
- [ ] `Community` (multi-user, moderation, clubs, feature requests).
- [ ] `Self-Hosted Enterprise` (RBAC, audit, SSO-ready hooks, backup automation).
- [ ] Add migration path UX between tiers (preserve data and settings).
- [ ] Add setup wizard that recommends tier based on user goals and scale.
- [ ] Add module preset bundles aligned with tiers.

### Schema and API Additions (Planning TODO)
- [ ] Add `genres`, `book_genres`, `categories`, `book_categories`, `book_tags` tables.
- [ ] Add `user_profiles_extended` table for personalization vectors/preferences.
- [ ] Add `social_events`, `follows`, `clubs`, `club_members`, `club_posts` tables.
- [ ] Add `feature_requests`, `feature_votes`, `feature_comments` tables.
- [ ] Add `module_registry`, `module_versions`, `module_rollouts` tables.
- [ ] Add `comments`, `comment_threads`, `comment_reactions`, `spoiler_scopes` tables.
- [ ] Add `webhook_endpoints`, `webhook_deliveries`, `api_keys`, `api_audit_logs` tables.
- [ ] Add `community_roles`, `moderation_cases`, `community_rulesets` tables.
- [ ] Add connector mapping tables for StoryGraph/Goodreads/Author.Today import metadata.
- [ ] Add migration and backfill plan for existing books and statuses.

---

## Performance and Reliability Plan
- [ ] Migrate large image lists to `next/image` where practical.
- [ ] Add request-level caching strategy for OPDS browsing.
- [ ] Add pagination/virtualization for large book grids.
- [ ] Add optimistic cache invalidation strategy after imports and votes.
- [ ] Add Sentry (or equivalent) for client/server error visibility.
- [ ] Add Web Vitals tracking dashboard (LCP, CLS, INP, TTFB) per route.
- [ ] Add synthetic performance tests for home, book, reader, and discover pages.
- [ ] Add Lighthouse CI gate for PWA and accessibility regressions.

---

## Suggested Delivery Roadmap

### Sprint 1 (1-2 weeks)
- [ ] Complete all `Phase 0` blocker tasks.
- [x] Ship global toasts, error states, and working search results route.

### Sprint 2 (1-2 weeks)
- [x] Deliver home/library filters + sorting + URL persistence.
- [ ] Deliver book details data correctness and working alias votes.

### Sprint 3 (1-2 weeks)
- [ ] Upgrade reader controls + persistence + keyboard/touch UX.
- [ ] Add tracker drag/drop and quick progress updates.

### Sprint 4 (1-2 weeks)
- [ ] Finish connections settings/sync workflows and discover import UX.
- [ ] Complete accessibility and visual consistency pass.

### Sprint 5+ (ongoing)
- [ ] Build advanced discovery, recommendations, and optional community features.

### Sprint 6 (1-2 weeks)
- [ ] Deliver PWA install/offline baseline and queue-based offline writes.
- [ ] Deliver login provider expansion and account linking flow.

### Sprint 7 (1-2 weeks)
- [ ] Deliver genres/categories/emoji tags and smart collections.
- [ ] Deliver feature request board v1 with voting/status lifecycle.

### Sprint 8+ (ongoing)
- [ ] Deliver AI module expansion, module system v2, and social reading clubs.

### Sprint 9 (1-2 weeks)
- [ ] Deliver API v1 and webhook infrastructure baseline.
- [ ] Deliver UX helper toolkit v1 for users/admins and diagnostics panel.

### Sprint 10+ (ongoing)
- [ ] Deliver external connectors (StoryGraph/Goodreads/Author.Today) and community governance suite.

---

## Definition of Done (UX)
- [ ] Every major page has loading/empty/error/success states.
- [ ] Every critical flow is keyboard-accessible and mobile-usable.
- [ ] No broken links or no-op primary actions.
- [ ] No mixed data truth for same entity in same user journey.
- [ ] Lint passes with zero blocking errors.
- [ ] Core tasks (import -> read -> track -> review alias) can be completed without confusion.
- [ ] App meets baseline PWA installability and offline-read expectations.
- [ ] Users can fully personalize metadata (genres, categories, tags, emoji tags) and see it reflected in search/tracking.
- [ ] Feature requests can be submitted, voted, triaged, and tracked to release notes.
- [ ] Admins can operate a community instance with moderation, audits, and backup confidence.
- [ ] API/webhooks allow reliable bidirectional integrations with external tools.
