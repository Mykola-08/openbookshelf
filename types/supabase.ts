export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          authors: string[] | null
          description: string | null
          cover_url: string | null
          published_year: number | null
          publisher: string | null
          page_count: number | null
          isbn13: string | null
          isbn10: string | null
          olid: string | null
          asin: string | null
          goodreads_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          authors?: string[] | null
          description?: string | null
          cover_url?: string | null
          published_year?: number | null
          publisher?: string | null
          page_count?: number | null
          isbn13?: string | null
          isbn10?: string | null
          olid?: string | null
          asin?: string | null
          goodreads_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          authors?: string[] | null
          description?: string | null
          cover_url?: string | null
          published_year?: number | null
          publisher?: string | null
          page_count?: number | null
          isbn13?: string | null
          isbn10?: string | null
          olid?: string | null
          asin?: string | null
          goodreads_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_books: {
        Row: {
          id: string
          user_id: string
          book_id: string
          status: 'toread' | 'reading' | 'finished' | 'abandoned'
          rating: number | null
          progress: number | null
          progress_unit: string | null
          notes: string | null
          started_at: string | null
          finished_at: string | null
          is_favorite: boolean
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          status?: 'toread' | 'reading' | 'finished' | 'abandoned'
          rating?: number | null
          progress?: number | null
          progress_unit?: string | null
          notes?: string | null
          started_at?: string | null
          finished_at?: string | null
          is_favorite?: boolean
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          status?: 'toread' | 'reading' | 'finished' | 'abandoned'
          rating?: number | null
          progress?: number | null
          progress_unit?: string | null
          notes?: string | null
          started_at?: string | null
          finished_at?: string | null
          is_favorite?: boolean
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shelves: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
        }
      }
      user_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'public_url' | 'private_api' | 'file_import'
          config: Json
          sync_mode: 'off' | 'pull_only' | 'push_only' | 'two_way'
          trust_level: 'high' | 'medium' | 'low'
          automation: 'auto' | 'ask' | 'manual'
          conflict_rule: 'app_wins' | 'source_wins' | 'ask'
          last_synced_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'public_url' | 'private_api' | 'file_import'
          config?: Json
          sync_mode?: 'off' | 'pull_only' | 'push_only' | 'two_way'
          trust_level?: 'high' | 'medium' | 'low'
          automation?: 'auto' | 'ask' | 'manual'
          conflict_rule?: 'app_wins' | 'source_wins' | 'ask'
          last_synced_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'public_url' | 'private_api' | 'file_import'
          config?: Json
          sync_mode?: 'off' | 'pull_only' | 'push_only' | 'two_way'
          trust_level?: 'high' | 'medium' | 'low'
          automation?: 'auto' | 'ask' | 'manual'
          conflict_rule?: 'app_wins' | 'source_wins' | 'ask'
          last_synced_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      source_items: {
        Row: {
          id: string
          source_id: string
          remote_id: string
          user_book_id: string | null
          sync_state: string
          last_data_hash: string | null
          last_synced_data: Json | null
          first_seen_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          source_id: string
          remote_id: string
          user_book_id?: string | null
          sync_state?: string
          last_data_hash?: string | null
          last_synced_data?: Json | null
          first_seen_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          remote_id?: string
          user_book_id?: string | null
          sync_state?: string
          last_data_hash?: string | null
          last_synced_data?: Json | null
          first_seen_at?: string
          last_seen_at?: string
        }
      }
      shelf_books: {
        Row: {
          shelf_id: string
          user_book_id: string
          added_at: string
        }
        Insert: {
          shelf_id: string
          user_book_id: string
          added_at?: string
        }
        Update: {
          shelf_id?: string
          user_book_id?: string
          added_at?: string
        }
      }
    }
  }
}
