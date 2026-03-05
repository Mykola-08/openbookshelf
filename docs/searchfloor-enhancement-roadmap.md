# Searchfloor Feature Roadmap for OpenBookshelf

Prepared: March 5, 2026

## Goal
Upgrade existing pages with high-impact features from the Searchfloor analysis while keeping compatibility with current OpenBookshelf architecture.

## Implemented in This Batch (Phase 1)
- Library page (`/`):
  - URL-persistent filters (`q`, `status`, `sort`, `cover`, `completed`)
  - Completed-only toggle and status quick filters
  - Sorting by updated/title/progress/rating
  - Card upgrades with rating badge and direct Continue Reading button
- Book detail (`/book/[id]`):
  - Chapter index section with newest/oldest ordering toggle
  - Safe fallback if chapter data is not available
  - Improved reading status/progress block
- Reader (`/read/[id]` + `ReaderWrapper`):
  - Resume from saved `reading_location`
  - Persistent reader preferences in localStorage (theme, font size, font family, line height)
  - Local fallback resume for non-authenticated sessions
- Tracker (`/tracker`):
  - Real cover thumbnails on board cards
  - Status normalization across schema variants
  - Reading progress bar and quick Continue link

## Phase 2 (Next)
1. Advanced search panel:
   - Genre multiselect, locked/free, with/without series, min readers, date range
2. Ratings upgrade:
   - 1-5 star submissions, average rating display, anti-brigade constraints
3. Completed discovery:
   - Dedicated completed feed/section and one-click navigation in top nav
4. Author pages expansion:
   - Bio, all books, aggregated reader counts, external links

## Phase 3
1. Notifications:
   - Web push opt-in and weekly email digest
2. Comments:
   - Book-level comments with moderation
3. Personalized recommendations:
   - Collaborative filtering block on home page
4. Social shelf features:
   - Public/private lists and follows

## Required DB Additions
1. `book_chapters` table for chapter index (TOC on book page)
2. Optional `user_reader_preferences` table if moving prefs from localStorage to account-level sync
3. Optional `book_ratings` table if adding global aggregate ratings

## Delivery Strategy
1. Keep Phase 1 live behind existing pages (already done).
2. Implement Phase 2 behind feature flags.
3. Add migrations + backfill scripts before enabling global recommendations/notifications.
