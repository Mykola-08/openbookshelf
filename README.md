# OpenBookshelf

OpenBookshelf is a modular, self-hosted personal library, e-reader, and reading progress tracker. It allows you to import OPDS catalogs, upload local EPUBs, read directly in the browser across all your devices, and synchronize your progress seamlessly.

## Core Features
1. **Internal Browser Reader**: Fully customizable e-reader (themes, font scaling, line height, font family, location memory, bookmarks) powered by `epubjs`.
2. **OPDS Discovery & Recommendations Engine**: Built-in support to browse public domain libraries (Project Gutenberg, Standard Ebooks, Feedbooks), integrate custom catalogs, and discover new books based on your reading history and trending open-source data.
3. **Alias-Aware Merge Import**: Detect near-duplicate titles, propose aliases with source attribution, and support community voting for approval.
4. **Modular Architecture & Hyper-Personalization**: Toggle features on and off (e.g., use only the tracker without the local reader, or switch between "Minimalist" and "Power Reader" user presets). Your environment adapts to your workflow.
5. **Reading Tracking & Insights** (Kanban Style): Manage your library states natively with drag-and-drop. View detailed reading insights, yearly goals, reading streaks, and a comprehensive reading timeline.

---

## Design Philosophy

OpenBookshelf is built on a set of core principles that prioritize the reader's focus, privacy, and personal workflow. Inspired by the "Digital Garden" concept, our goal is to provide a powerful yet invisible environment for deep reading. 

Read more in our [Design Philosophy](PHILOSOPHY.md) document.

- **Minimalism by Default**: Interfaces start small. Complexity is a choice, not a mandate.
- **Hyper-Personalization**: From font pairings to database schema, the system adapts to your unique workflow.
- **Privacy and Ownership**: Your data belongs to you. We favor local storage and self-hosted options.
- **Performance over Polish**: A fast, slightly rugged interface is better than a slow, beautiful one.
- **Modular Complexity**: Advanced features are hidden behind modules to reduce mental overhead.
- **Digital Garden**: Cultivate your library over time. It's a place to think, not just a warehouse to store files.

---

## Installation & Setup Options

OpenBookshelf is designed to be easily deployed depending on your infrastructural needs, from a local Docker container to a serverless edge architecture using Supabase and Vercel.

Choose your setup path:
- [Option 1: Supabase + Vercel (Recommended Cloud)](#option-1-supabase--vercel)
- [Option 2: Local Docker (Self-Hosted)](#option-2-local-docker)
- [Option 3: Bare Metal / SQLite (Minimal)](#option-3-bare-metal--sqlite-tracker-only)

---

### Option 1: Supabase + Vercel (Recommended Cloud)
*Best for zero-maintenance anywhere access.*

**1. Database Setup (Supabase):**
1. Create a project on [Supabase](https://supabase.com).
2. Go to SQL Editor and run the schema found in `docs/supabase.schema.sql`.
3. Create a public storage bucket named `books`. Let it allow unauthenticated reads for easiest access, or configure RLS if enabling authentication.

**2. Application Deployment:**
1. Clone this repository.
2. Duplicate `.env.example` to `.env.local` and add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Push to GitHub and connect to Vercel for immediate deployment.

---

### Option 2: Local Docker
*Best for home servers, Unraid, and NAS environments.*

A `docker-compose.yml` file is provided in this repository.
1. Download the repo.
2. Modify the environment variables in `docker-compose.yml`. Keep the Postgres database local.
3. Run: `docker-compose up -d`.
4. Access at `http://localhost:3000`.

---

### Option 3: Bare Metal / SQLite (Tracker Only)
If you disable the heavy `EpubReader` and file storage via Feature Flags, OpenBookshelf natively falls back to simple Progress Tracking.
You can easily swap the Supabase Client in `@/utils/supabase/server` for a local Prisma/SQLite implementation to use it simply as an offline tracker app. (See `docs/sqlite.schema.prisma`).

---

## Configuration Flags

OpenBookshelf's modules can be toggled using environment variables in `.env.local` or Docker. This lets you turn the monolithic library into a simple tracker, or disable public catalogs.

```env
# Set to 'false' to disable EPUB uploads & the browser Reader tab
NEXT_PUBLIC_ENABLE_LOCAL_READER=true

# Set to 'false' to disable the "My Reading Progress" Kanban view
NEXT_PUBLIC_ENABLE_TRACKER=true

# Set to 'false' to hide the 'Discover' OPDS public catalogs tab
NEXT_PUBLIC_ENABLE_OPDS=true

# Set to 'true' for self-hosted deployment behavior:
# - first authenticated user is auto-provisioned as admin
# - /modules marketplace becomes available to admins
NEXT_PUBLIC_SELF_HOSTED=false

# Set to 'true' to run with local in-memory demo Supabase client
# (also auto-enabled if Supabase URL/key are missing)
NEXT_PUBLIC_SUPABASE_DEMO=false
# Optional database provider override: supabase | firebase | demo
# If omitted, app auto-detects from available env vars.
NEXT_PUBLIC_DB_PROVIDER=supabase

# Firebase compatibility env hints (used for provider auto-detection)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

Provider behavior:
- `supabase`: uses Supabase directly (requires URL + anon key).
- `firebase`: currently resolves to the local compatibility engine to keep app APIs consistent while Firebase credentials/settings are surfaced in runtime diagnostics.
- `demo`: forces local demo client mode.

## AI Personalization (New)

In **Settings → Preferences**, you can now customize AI behavior per user (stored in `user_settings`):
- provider preference (`auto`, `openrouter`, `openai`, `google`)
- optional model override
- generation temperature
- chapter summary length (`short`, `balanced`, `detailed`)

These settings are used by AI server actions (`generateBookDescription`, `generateChapterSummary`) and fall back to environment defaults when not configured.

## Local Demo Mode

For local product demos without a running Supabase project:

1. Set `NEXT_PUBLIC_SUPABASE_DEMO=true` in `.env.local`.
2. Start the app normally with `npm run dev`.
3. The app uses an in-memory demo Supabase client with seeded sample data and demo auth user.

Notes:
- Data is non-persistent and intended only for local demos.
- Server-side and browser demo stores are in-memory runtime stores.

## Self-hosted Modules Marketplace

When `NEXT_PUBLIC_SELF_HOSTED=true`, the platform enables instance-level module governance:

- `advanced_reader`: typography/layout controls in reader
- `offline_cache`: local reading position caching controls
- `book_summary`: book-level summary panels
- `chapter_summary`: chapter insight snippets
- `import_automation`: advanced source import/sync policies
- `account_center`: account capabilities surface
- `alias_resolution`: alternate title indexing and alias-based search
- `community_alias_review`: queue-based voting to approve/reject alias candidates
- `settings_sync`: DB-backed synchronization for advanced settings
- `theme_studio`: runtime token color customization
- `merge_assistant`: threshold-driven merge decisions and review routing

Admins can also define custom modules from `/modules`. Custom modules are persisted and toggleable for runtime UX adaptation.

## Tech Stack
- Framework: Next.js 16 (App Router)
- UI: Shadcn UI + Tailwind CSS
- Reader Engine: react-reader (`epubjs`)
- Database: Unified provider runtime (Supabase-first, Firebase-compatible fallback, local demo mode)
## Contributing
We welcome contributions! Feel free to open issues or submit pull requests.
