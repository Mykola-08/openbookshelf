-- OpenBookshelf Database Schema
-- Provides core structures for Books, Users, Reading Logs, and Syncing Sources

-- 1. ENUMS AND TYPES
-- Enums for standard statuses to ensure consistency across the application
CREATE TYPE reading_status AS ENUM (
  'toread',
  'reading',
  'finished',
  'abandoned'
);

CREATE TYPE source_type AS ENUM (
  'public_url',
  'private_api',
  'file_import'
);

CREATE TYPE trust_level AS ENUM (
  'high',
  'medium',
  'low'
);

CREATE TYPE sync_mode AS ENUM (
  'off',
  'pull_only',
  'push_only',
  'two_way'
);

CREATE TYPE conflict_rule AS ENUM (
  'app_wins',
  'source_wins',
  'ask'
);

CREATE TYPE automation_type AS ENUM (
  'auto',
  'ask',
  'manual'
);

CREATE TYPE app_role AS ENUM (
  'admin',
  'member'
);

-- 2. USERS (PROFILES)
-- Extends Supabase auth.users public profile
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2B. APP USER ROLES (Self-hosted Admin Bootstrap)
-- First authenticated user in a self-hosted instance becomes admin.
CREATE TABLE app_user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BOOKS (Canonical Data)
-- Shared catalog of books. In a self-hosted single-user instance, these are just "books".
-- In a multi-user instance, these can be shared references to save space/duplication.
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}', -- Array of author names
  description TEXT,
  cover_url TEXT,
  published_year INTEGER,
  publisher TEXT,
  page_count INTEGER,
  
  -- Identifiers (crucial for matching)
  isbn13 TEXT,
  isbn10 TEXT,
  olid TEXT, -- Open Library ID
  asin TEXT, -- Amazon ID
  goodreads_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups during matching/import
CREATE INDEX idx_books_isbn13 ON books(isbn13);
CREATE INDEX idx_books_olid ON books(olid);
CREATE INDEX idx_books_asin ON books(asin);

-- 3B. BOOK ALIASES (Cross-source title variants)
-- Allows one canonical book to be discoverable by alternate names from any source.
CREATE TABLE book_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  alias_title TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  is_default BOOLEAN DEFAULT FALSE,
  yes_votes INTEGER NOT NULL DEFAULT 0,
  no_votes INTEGER NOT NULL DEFAULT 0,
  origin_source_id UUID,
  origin_source_name TEXT,
  origin_remote_id TEXT,
  suggested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(canonical_book_id, normalized_alias)
);

CREATE INDEX idx_book_aliases_norm ON book_aliases(normalized_alias);
CREATE INDEX idx_book_aliases_canonical ON book_aliases(canonical_book_id);

-- Individual votes to determine whether an alias is truly the same book.
CREATE TABLE book_alias_votes (
  alias_id UUID REFERENCES book_aliases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_same BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY(alias_id, user_id)
);

-- 3C. USER SETTINGS (DB-backed advanced personalization)
CREATE TABLE user_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. USER BOOKS (Personal Collection)
-- Links a user to a book with their personal reading state.
CREATE TABLE user_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  
  status reading_status DEFAULT 'toread',
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  progress INTEGER DEFAULT 0, -- Pages or Percentage
  progress_unit TEXT DEFAULT 'page', -- 'page' or 'percent'
  notes TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  
  is_favorite BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE, -- Hide from public profile if implemented

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, book_id) -- User can only have one entry per book
);

-- 5. SHELVES (Collections)
-- User-created lists like "Summer 2024", "Favorites", etc.
CREATE TABLE shelves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, slug)
);

-- Junction table for Books in Shelves
CREATE TABLE shelf_books (
  shelf_id UUID REFERENCES shelves(id) ON DELETE CASCADE,
  user_book_id UUID REFERENCES user_books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (shelf_id, user_book_id)
);


-- 6. SOURCES (Sync Configuration)
-- Stores the configuration for external connectors (e.g., Open Library profile URL)
CREATE TABLE user_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  type source_type NOT NULL,
  
  -- Configuration (flexibly stored as JSONB)
  -- e.g., { "url": "...", "api_key": "...", "username": "..." }
  config JSONB DEFAULT '{}'::JSONB,
  
  -- Sync Policy (JSONB for flexibility or columns for strictness)
  sync_mode sync_mode DEFAULT 'pull_only',
  trust_level trust_level DEFAULT 'medium',
  automation automation_type DEFAULT 'ask',
  conflict_rule conflict_rule DEFAULT 'ask',
  
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 7. SOURCE ITEMS (Sync State)
-- Tracks the state of items from external sources to manage sync logic (diffs, conflicts).
CREATE TABLE source_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES user_sources(id) ON DELETE CASCADE NOT NULL,
  
  -- The remote ID specific to the source (e.g., "12345" or "OL123M")
  remote_id TEXT NOT NULL,
  
  -- Defines the link to our local library
  user_book_id UUID REFERENCES user_books(id) ON DELETE SET NULL,
  
  -- Current sync state
  sync_state TEXT DEFAULT 'pending', -- 'synced', 'pending_create', 'pending_update', 'conflict', 'ignored'
  
  -- Snapshot of the last successfully synced data to detect changes
  last_data_hash TEXT,
  last_synced_data JSONB,
  
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(source_id, remote_id)
);


-- 8. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_alias_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_items ENABLE ROW LEVEL SECURITY;

-- Create policies (Users can only access their own data)

-- Profiles: Users can update their own profile; Public read access (optional, otherwise restrict to auth.uid())
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true); -- Or restrict based on preference

-- App roles: users can read their own role; writes are reserved for RPC logic.
CREATE POLICY "Users can read own app role" ON app_user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Alias visibility is public so aliases can power search and discovery globally.
CREATE POLICY "Public read book_aliases" ON book_aliases
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can propose book_aliases" ON book_aliases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update book_aliases" ON book_aliases
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Public read book_alias_votes" ON book_alias_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on aliases" ON book_alias_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alias vote" ON book_alias_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- User Books: CRUD for owner
CREATE POLICY "Users can fully manage their own books" ON user_books
  FOR ALL USING (auth.uid() = user_id);

-- Shelves: CRUD for owner; Public read if is_public is true
CREATE POLICY "Users can manage own shelves" ON shelves
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public shelves are viewable" ON shelves
  FOR SELECT USING (is_public = true);

-- Shelf Books: Access via shelf ownership
CREATE POLICY "Users can manage shelf items" ON shelf_books
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shelves WHERE id = shelf_books.shelf_id AND user_id = auth.uid())
  );

-- Sources: Private to user
CREATE POLICY "Users can manage own sources" ON user_sources
  FOR ALL USING (auth.uid() = user_id);

-- Source Items: Access via source ownership
CREATE POLICY "Users can manage source items" ON source_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_sources WHERE id = source_items.source_id AND user_id = auth.uid())
  );


-- 9. TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Shared normalization helper used by aliases and import matching.
CREATE OR REPLACE FUNCTION normalize_book_title(input_title TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT trim(regexp_replace(lower(coalesce(input_title, '')), '[^a-z0-9а-яё]+', ' ', 'gi'));
$$;

-- Self-hosted bootstrap:
-- Ensures profile exists and assigns first authenticated user admin role.
CREATE OR REPLACE FUNCTION bootstrap_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role app_role;
  assigned_role app_role;
  role_count BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Cannot bootstrap role for another user';
  END IF;

  INSERT INTO profiles (id)
  VALUES (p_user_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT role
    INTO existing_role
    FROM app_user_roles
   WHERE user_id = p_user_id;

  IF existing_role IS NOT NULL THEN
    RETURN existing_role::TEXT;
  END IF;

  SELECT COUNT(*)
    INTO role_count
    FROM app_user_roles;

  assigned_role := CASE
    WHEN role_count = 0 THEN 'admin'::app_role
    ELSE 'member'::app_role
  END;

  INSERT INTO app_user_roles (user_id, role)
  VALUES (p_user_id, assigned_role)
  ON CONFLICT (user_id) DO UPDATE SET role = app_user_roles.role
  RETURNING role INTO assigned_role;

  RETURN assigned_role::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION bootstrap_user_role(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION propose_book_alias(
  p_canonical_book_id UUID,
  p_alias_title TEXT,
  p_origin_source_id UUID DEFAULT NULL,
  p_origin_source_name TEXT DEFAULT NULL,
  p_origin_remote_id TEXT DEFAULT NULL,
  p_suggested_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alias_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO book_aliases (
    canonical_book_id,
    alias_title,
    normalized_alias,
    origin_source_id,
    origin_source_name,
    origin_remote_id,
    suggested_by,
    status
  )
  VALUES (
    p_canonical_book_id,
    p_alias_title,
    normalize_book_title(p_alias_title),
    p_origin_source_id,
    p_origin_source_name,
    p_origin_remote_id,
    coalesce(p_suggested_by, auth.uid()),
    'pending'
  )
  ON CONFLICT (canonical_book_id, normalized_alias)
  DO UPDATE SET
    updated_at = NOW(),
    origin_source_id = coalesce(EXCLUDED.origin_source_id, book_aliases.origin_source_id),
    origin_source_name = coalesce(EXCLUDED.origin_source_name, book_aliases.origin_source_name),
    origin_remote_id = coalesce(EXCLUDED.origin_remote_id, book_aliases.origin_remote_id)
  RETURNING id INTO alias_id;

  RETURN alias_id;
END;
$$;

GRANT EXECUTE ON FUNCTION propose_book_alias(UUID, TEXT, UUID, TEXT, TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION vote_book_alias(
  p_alias_id UUID,
  p_is_same BOOLEAN
)
RETURNS TABLE (
  alias_id UUID,
  yes_votes INTEGER,
  no_votes INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical_id UUID;
  current_yes INTEGER;
  current_no INTEGER;
  current_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO book_alias_votes(alias_id, user_id, is_same)
  VALUES (p_alias_id, auth.uid(), p_is_same)
  ON CONFLICT (alias_id, user_id)
  DO UPDATE SET
    is_same = EXCLUDED.is_same,
    updated_at = NOW();

  SELECT
    coalesce(sum(CASE WHEN is_same THEN 1 ELSE 0 END), 0)::INTEGER,
    coalesce(sum(CASE WHEN is_same THEN 0 ELSE 1 END), 0)::INTEGER
  INTO current_yes, current_no
  FROM book_alias_votes
  WHERE alias_id = p_alias_id;

  SELECT canonical_book_id, status
  INTO canonical_id, current_status
  FROM book_aliases
  WHERE id = p_alias_id;

  IF canonical_id IS NULL THEN
    RAISE EXCEPTION 'Alias not found';
  END IF;

  IF current_yes >= 3 AND current_yes > current_no THEN
    UPDATE book_aliases
      SET is_default = FALSE
      WHERE canonical_book_id = canonical_id AND id <> p_alias_id;

    current_status := 'approved';

    UPDATE book_aliases
      SET
        yes_votes = current_yes,
        no_votes = current_no,
        status = current_status,
        is_default = TRUE,
        updated_at = NOW()
      WHERE id = p_alias_id;
  ELSIF current_no >= 3 AND current_no >= current_yes THEN
    current_status := 'rejected';

    UPDATE book_aliases
      SET
        yes_votes = current_yes,
        no_votes = current_no,
        status = current_status,
        updated_at = NOW()
      WHERE id = p_alias_id;
  ELSE
    current_status := 'pending';

    UPDATE book_aliases
      SET
        yes_votes = current_yes,
        no_votes = current_no,
        status = current_status,
        updated_at = NOW()
      WHERE id = p_alias_id;
  END IF;

  RETURN QUERY
  SELECT p_alias_id, current_yes, current_no, current_status;
END;
$$;

GRANT EXECUTE ON FUNCTION vote_book_alias(UUID, BOOLEAN) TO authenticated;

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_app_user_roles_modtime
    BEFORE UPDATE ON app_user_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_books_modtime
    BEFORE UPDATE ON books FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_book_aliases_modtime
    BEFORE UPDATE ON book_aliases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_book_alias_votes_modtime
    BEFORE UPDATE ON book_alias_votes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_settings_modtime
    BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_books_modtime
    BEFORE UPDATE ON user_books FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- 10. AUTHORS (Normalized)
-- Supports multiple authors per book and detailed author profiles
CREATE TABLE authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT, -- For pretty URLs /library/author/name-slug
  bio TEXT,
  photo_url TEXT,
  olid TEXT UNIQUE, -- Open Library ID
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SERIES (Normalized)
-- Supports books belonging to a series with volume numbers
CREATE TABLE series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  source_url TEXT, -- Link to series page on external site
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. BOOK_AUTHORS (Relationship)
CREATE TABLE book_authors (
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'author', -- 'author', 'illustrator', 'translator'
  position INTEGER DEFAULT 0, -- Order of authors
  PRIMARY KEY (book_id, author_id)
);

-- 13. BOOK_SERIES (Relationship)
CREATE TABLE book_series (
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  volume_number NUMERIC, -- Supports 1.5 etc.
  display_order INTEGER, -- For sorting without gaps
  PRIMARY KEY (book_id, series_id)
);

-- 14. BOOK_FILES (Epub Storage)
-- Link specific files (S3 URLs or local paths) to books for reading
CREATE TABLE book_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  format TEXT NOT NULL DEFAULT 'epub', -- 'epub', 'pdf', 'mobi'
  file_url TEXT NOT NULL, -- S3 Bucket URL or local path
  source_origin TEXT, -- Where did this file come from? (e.g. 'flibusta', 'upload')
  size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for new tables
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_files ENABLE ROW LEVEL SECURITY;

-- Public read access for metadata tables (Assuming shared catalog model)
-- Otherwise, restrict to authenticated users only via consistent policies
CREATE POLICY "Public read authors" ON authors FOR SELECT USING (true);
CREATE POLICY "Public read series" ON series FOR SELECT USING (true);
CREATE POLICY "Public read book_authors" ON book_authors FOR SELECT USING (true);
CREATE POLICY "Public read book_series" ON book_series FOR SELECT USING (true);

-- Files should be protected! Only users who uploaded or admins, or anyone if "Open Content" model
-- For personal self-hosted:
CREATE POLICY "Users can access all files" ON book_files FOR ALL USING (auth.role() = 'authenticated');

-- Schema Update Triggers
CREATE TRIGGER update_authors_modtime
    BEFORE UPDATE ON authors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_series_modtime
    BEFORE UPDATE ON series FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 15. BOOK_CHAPTERS (TOC / Chapter Index)
-- Optional chapter metadata used for chapter lists on book detail pages.
CREATE TABLE book_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  chapter_number NUMERIC,
  title TEXT,
  chapter_url TEXT,
    summary TEXT,
  word_count INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_book_chapters_book_id ON book_chapters(book_id);
CREATE INDEX idx_book_chapters_book_order ON book_chapters(book_id, chapter_number DESC);

ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read book_chapters" ON book_chapters FOR SELECT USING (true);

