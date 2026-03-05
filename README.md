# OpenBookshelf

OpenBookshelf is a modular, self-hosted personal library, e-reader, and reading progress tracker. It allows you to import OPDS catalogs, upload local EPUBs, read directly in the browser across all your devices, and synchronize your progress seamlessly.

## Core Features
1. **Internal Browser Reader**: Fully customizable e-reader (themes, font scaling, location memory) powered by `epubjs`.
2. **OPDS Discovery Engine**: Built-in support to browse public domain libraries (Project Gutenberg, Standard Ebooks, Feedbooks) and automatically import books to your local storage.
3. **Alias-Aware Merge Import**: Detect near-duplicate titles, propose aliases with source attribution, and support community voting for approval.
4. **Modular Architecture**: Toggle features on and off (e.g., use only the tracker, without the local reader).
5. **Reading Tracking** (Kanban Style): Manage your library states natively (Currently Reading, Completed, Dropped, Plan to Read).

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
```

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
- Database: Supabase (PostgreSQL) + Auth
