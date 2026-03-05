-- Supabase Schema for OpenBookshelf

-- 1. Authors Table
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Series Table
CREATE TABLE series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Books Table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    published_date DATE,
    publisher TEXT,
    isbn TEXT,
    language TEXT,
    primary_author_id UUID REFERENCES authors(id),
    series_id UUID REFERENCES series(id),
    series_number DECIMAL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. User Connections / OPDS Sources
CREATE TABLE user_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'public_url', 'calibre', 'komga'
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    trust_level TEXT DEFAULT 'moderate',
    sync_mode TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Physical Files mapped to Books (EPUBs, PDFs)
CREATE TABLE book_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    source_id UUID REFERENCES user_sources(id), -- Where this file came from (null = local upload)
    format TEXT NOT NULL, -- 'epub', 'pdf', 'mobi'
    file_url TEXT NOT NULL, -- URL to Supabase Storage or external link
    size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. User Tracking Data (The Tracker Module)
CREATE TABLE user_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    reading_state TEXT NOT NULL DEFAULT 'plan_to_read', -- 'plan_to_read', 'reading', 'finished', 'dropped'
    reading_location TEXT, -- EPUB CFI string for resuming reading
    progress INTEGER DEFAULT 0, -- Reading progress (%)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id)
);

-- 7. Chapter Index (Optional, for serial fiction / TOC view)
CREATE TABLE book_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    chapter_number DECIMAL,
    title TEXT,
    chapter_url TEXT,
    word_count INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Self-hosted Roles (first authenticated user becomes admin)
CREATE TYPE app_role AS ENUM ('admin', 'member');

CREATE TABLE app_user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own app role" ON app_user_roles
    FOR SELECT USING (auth.uid() = user_id);

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

  SELECT role INTO existing_role FROM app_user_roles WHERE user_id = p_user_id;
  IF existing_role IS NOT NULL THEN
    RETURN existing_role::TEXT;
  END IF;

  SELECT COUNT(*) INTO role_count FROM app_user_roles;
  assigned_role := CASE WHEN role_count = 0 THEN 'admin'::app_role ELSE 'member'::app_role END;

  INSERT INTO app_user_roles (user_id, role)
  VALUES (p_user_id, assigned_role)
  ON CONFLICT (user_id) DO UPDATE SET role = app_user_roles.role
  RETURNING role INTO assigned_role;

  RETURN assigned_role::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION bootstrap_user_role(UUID) TO authenticated;

-- 9. Book Aliases and community voting
CREATE TABLE book_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    suggested_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(canonical_book_id, normalized_alias)
);

CREATE TABLE book_alias_votes (
    alias_id UUID REFERENCES book_aliases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    is_same BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY(alias_id, user_id)
);

ALTER TABLE book_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_alias_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read book_aliases" ON book_aliases FOR SELECT USING (true);
CREATE POLICY "Authenticated users can propose book_aliases" ON book_aliases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update book_aliases" ON book_aliases FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Public read book_alias_votes" ON book_alias_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on aliases" ON book_alias_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alias vote" ON book_alias_votes FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION normalize_book_title(input_title TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT trim(regexp_replace(lower(coalesce(input_title, '')), '[^a-z0-9а-яё]+', ' ', 'gi'));
$$;

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
  DO UPDATE SET updated_at = timezone('utc'::text, now())
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
  DO UPDATE SET is_same = EXCLUDED.is_same, updated_at = timezone('utc'::text, now());

  SELECT
    coalesce(sum(CASE WHEN is_same THEN 1 ELSE 0 END), 0)::INTEGER,
    coalesce(sum(CASE WHEN is_same THEN 0 ELSE 1 END), 0)::INTEGER
  INTO current_yes, current_no
  FROM book_alias_votes
  WHERE alias_id = p_alias_id;

  IF current_yes >= 3 AND current_yes > current_no THEN
    current_status := 'approved';
  ELSIF current_no >= 3 AND current_no >= current_yes THEN
    current_status := 'rejected';
  ELSE
    current_status := 'pending';
  END IF;

  UPDATE book_aliases
    SET yes_votes = current_yes,
        no_votes = current_no,
        status = current_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_alias_id;

  RETURN QUERY
  SELECT p_alias_id, current_yes, current_no, current_status;
END;
$$;

GRANT EXECUTE ON FUNCTION vote_book_alias(UUID, BOOLEAN) TO authenticated;

-- 10. User Settings (database persistence for advanced preferences)
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
