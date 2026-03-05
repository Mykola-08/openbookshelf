
export type ReadingStatus = 'toread' | 'reading' | 'finished' | 'abandoned';

export type TrustLevel = 'high' | 'medium' | 'low';

export type SyncMode = 'off' | 'pull-only' | 'push-only' | 'two-way';
export type AutomationType = 'auto' | 'ask' | 'manual';
export type ConflictRule = 'app-wins' | 'source-wins' | 'ask';

export interface FieldPolicy {
  status: AutomationType;
  shelves: AutomationType;
  progress: AutomationType;
  rating: AutomationType;
}

export interface SourcePolicy {
  syncMode: SyncMode;
  automation: AutomationType;
  conflictRule: ConflictRule;
  trustLevel: TrustLevel;
}

export interface LibrarySource {
  id: string;
  name: string;
  type: 'private_api' | 'public_url' | 'file_import';
  url: string;
  lastSync?: Date;
  policy: SourcePolicy;
  fieldPolicy: FieldPolicy;
  icon?: React.ReactNode; // For UI
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  
  // User data
  status: ReadingStatus;
  rating?: number; // 0-5
  progress?: number; // percentage or page count
  shelves: string[];
  
  // Sync metadata
  sourceId?: string; // Origin source
  externalIds: Record<string, string>; // sourceId -> externalId
  lastSyncedAt?: Date;
  syncState: 'synced' | 'pending' | 'locked' | 'conflict';
}

export interface Shelf {
  id: string;
  name: string;
  count: number;
}
