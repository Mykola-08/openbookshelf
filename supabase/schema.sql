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

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_books_modtime
    BEFORE UPDATE ON books FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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

