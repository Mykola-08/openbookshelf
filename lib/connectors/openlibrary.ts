import { ConnectorManifest, ConnectorResult, LibraryItem } from "./types";

export interface IConnector {
  getManifest(): ConnectorManifest;
  fetchItem(itemId: string): Promise<ConnectorResult<LibraryItem>>;
  fetchLibrary(options?: {
    cursor?: string;
    limit?: number;
    syncSince?: Date;
  }): Promise<ConnectorResult<LibraryItem[]>>;
  testConnection(config: Record<string, any>): Promise<boolean>;
}

export class OpenLibraryConnector implements IConnector {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    this.config = config;
  }

  getManifest(): ConnectorManifest {
    return {
      id: "openlibrary_public_v1",
      name: "Open Library (Public Profile)",
      type: "PUBLIC_URL",
      description: "Syncs a public reading log from an Open Library user profile via JSON API.",
      fields: [
        {
          key: "username",
          label: "Username",
          type: "text",
          required: true,
          placeholder: "e.g., openlibraryuser"
        },
        {
          key: "list_type",
          label: "List to Sync",
          type: "select",
          options: [
            { label: "Reading Log (All)", value: "reading-log" },
            { label: "Specific List", value: "list" }
          ],
          defaultValue: "reading-log"
        }
      ],
      actions: ["fetch_library", "fetch_item"]
    };
  }

  async testConnection(config: Record<string, any>): Promise<boolean> {
    // Mock validation
    if (!config.username) return false;
    // Real implementation would HEAD request the profile URL
    return true;
  }

  async fetchLibrary(options?: { cursor?: string; limit?: number; syncSince?: Date; }): Promise<ConnectorResult<LibraryItem[]>> {
    // MOCK DATA for "Public Library Source" simulation
    // In real implementation:
    // 1. Fetch https://openlibrary.org/people/{username}/books/{list}.json
    // 2. Map JSON response to LibraryItem[]
    
    console.log(`[OpenLibrary] Fetching library for ${this.config.username}...`);

    return {
      success: true,
      data: [
        {
          remoteId: "OL26331930M",
          title: "The Rust Programming Language",
          authors: ["Steve Klabnik", "Carol Nichols"],
          coverUrl: "https://covers.openlibrary.org/b/id/10593023-M.jpg",
          identifiers: { isbn: "9781593278281" },
          status: "currently-reading",
          shelves: ["Technology", "Programming"],
          lastModified: new Date()
        },
        {
          remoteId: "OL17932824M", 
          title: "Project Hail Mary",
          authors: ["Andy Weir"],
          coverUrl: "https://covers.openlibrary.org/b/id/11449339-M.jpg",
          identifiers: { isbn: "9780593135204" },
          status: "read",
          rating: 5,
          lastModified: new Date("2024-02-15")
        }
      ],
      meta: { totalCount: 2 }
    };
  }
  
  async fetchItem(itemId: string): Promise<ConnectorResult<LibraryItem>> {
    // Mock single item fetch
    return {
      success: true,
      data: {
        remoteId: itemId,
        title: "Mock Book",
        authors: ["Mock Author"],
        identifiers: {},
        lastModified: new Date()
      }
    };
  }
}
