# OpenBookshelf External API (v1)

All endpoints require:
- `Authorization: Bearer <token>`
- `Content-Type: application/json` for POST

Auth supports:
- legacy global token: `EXTERNAL_SYNC_TOKEN`
- scoped integration keys from `integration_keys` (recommended)

## 1) List books
`GET /api/v1/books?q=<optional>&limit=<optional>`

Response:
```json
{ "data": [{ "id": "...", "title": "Dune" }] }
```

## 2) Create book
`POST /api/v1/books`

Body:
```json
{
  "title": "Dune",
  "description": "Sci-fi classic",
  "published_year": 1965,
  "user_id": "<uuid>",
  "status": "toread",
  "progress": 0,
  "progress_unit": "percent"
}
```

## 3) Sync user book status
`POST /api/v1/user-books/sync`

Body:
```json
{
  "user_id": "<uuid>",
  "book_id": "<uuid>",
  "progress": 47,
  "progress_unit": "percent",
  "reading_location": "epubcfi(...)"
}
```

Behavior:
- Auto-resolves `status` using progress (toread/reading/finished).
- Auto-updates `started_at`/`finished_at` timestamps.

## 4) List connectors (sources)
`GET /api/v1/connectors?user_id=<uuid>`

Returns OPDS and other connected source records from `user_sources`.

## 5) Runtime health
`GET /api/v1/health`

Returns provider + readiness checks for DB, AI, reader/tracker flags, and token config.

Security guards on v1 endpoints:
- Scope checks per endpoint (`api:v1:*` / granular route scopes).
- Optional key-level `user_id` enforcement for user-scoped calls.
- UUID validation for user/book IDs.
- Input bounds for `limit`, `progress`, `rating`, and large text fields.

---

## Recommended environment variables
- `EXTERNAL_SYNC_TOKEN` (required for API access)
- `NEXT_PUBLIC_DB_PROVIDER` (`supabase` or `firebase` or `demo`)
- DB provider credentials according to your selected provider


## Scoped integration keys (recommended)

OpenBookshelf supports DB-backed API keys via an `integration_keys` table.

Suggested schema:
```sql
create table if not exists integration_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  key_hash text not null unique,
  scopes text[] not null default array['api:v1'],
  user_id uuid,
  is_active boolean not null default true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Token validation order:
1. `EXTERNAL_SYNC_TOKEN` (legacy global token)
2. `integration_keys.key_hash` (sha256 of bearer token)

Recommended scopes:
- `api:v1` (full v1 access)
- `api:v1:*` (wildcard for all v1 granular scopes)
- `api:v1:books:read`, `api:v1:books:write`
- `api:v1:user-books:sync`
- `api:v1:connectors:read`
- `api:v1:health:read`

