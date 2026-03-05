export const ConnectorType = {
  PUBLIC_URL: 'public_url',
  PRIVATE_API: 'private_api',
  IMPORT: 'file_import',
} as const;

export interface ConnectorManifest {
  id: string;
  name: string;
  type: keyof typeof ConnectorType;
  description: string;
  fields: ConnectorField[];
  actions: string[];
}

export interface ConnectorField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'password' | 'select' | 'boolean';
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | boolean | number;
}

export interface ConnectorResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    nextPageCursor?: string;
    totalCount?: number;
  };
}

export interface LibraryItem {
  remoteId: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  identifiers: {
    isbn?: string;
    asin?: string;
    goodreads?: string;
    [key: string]: string | undefined;
  };
  status?: string; // Raw status from source
  rating?: number;
  progress?: {
    current: number;
    total?: number;
    unit: 'page' | 'percent';
  };
  shelves?: string[];
  lastModified?: Date;
}

export interface OPDSAuthor {
  name: string;
}

export interface OPDSLink {
  rel?: string;
  href: string;
  type?: string;
  title?: string;
}

export interface OPDSEntry {
  id: string;
  title: string;
  authors?: OPDSAuthor[];
  links?: OPDSLink[];
  summary?: string;
  content?: string;
  updated?: string;
  published_year?: number;
}
