type DemoRow = Record<string, unknown>;

interface DemoUser {
  id: string;
  email: string;
}

interface DemoError {
  message: string;
}

interface DemoQueryResult<T> {
  data: T;
  error: DemoError | null;
  count?: number | null;
}

interface SelectOptions {
  count?: "exact" | "planned" | "estimated";
  head?: boolean;
}

interface OrderOptions {
  ascending?: boolean;
}

interface UpsertOptions {
  onConflict?: string;
}

type RpcParams = DemoRow

interface DemoStore {
  tables: Record<string, DemoRow[]>;
}

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_GLOBAL_KEY = "__openbookshelf_demo_store__";

let isNode = typeof window === 'undefined';
let fs: any = isNode ? require('fs') : null;
let path: any = isNode ? require('path') : null;

const DB_FILENAME = '.demo-db.json';

const saveStore = (store: DemoStore) => {
  try {
    if (isNode && fs) {
        fs.writeFileSync(path.join(process.cwd(), DB_FILENAME), JSON.stringify(store, null, 2));
    } else if (!isNode) {
        window.localStorage.setItem(DEMO_GLOBAL_KEY, JSON.stringify(store));
    }
  } catch (e) {
    console.error('Failed to save local store', e);
  }
};

const normalizeTitle = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .replace(/\s+/g, " ");

const nowIso = () => new Date().toISOString();

const getGlobalStore = (): DemoStore => {
  const runtimeGlobal = globalThis as unknown as Record<string, unknown>;

  let loaded: DemoStore | null = null;
  try {
      if (isNode && fs) {
          const dbPath = path.join(process.cwd(), DB_FILENAME);
          if (fs.existsSync(dbPath)) {
              loaded = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          }
      } else if (!isNode) {
          const items = window.localStorage.getItem(DEMO_GLOBAL_KEY);
          if (items) loaded = JSON.parse(items);
      }
  } catch(e) {
      console.error(e);
  }

  if (loaded && loaded.tables) {
      runtimeGlobal[DEMO_GLOBAL_KEY] = loaded;
      return loaded;
  }

  const existing = runtimeGlobal[DEMO_GLOBAL_KEY];
  if (existing && typeof existing === "object") {
    return existing as DemoStore;
  }

  const seededStore: DemoStore = {
    tables: {
      profiles: [
        {
          id: DEMO_USER_ID,
          username: "demo",
          full_name: "Demo User",
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
      app_user_roles: [
        {
          user_id: DEMO_USER_ID,
          role: "admin",
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
      authors: [
        { id: crypto.randomUUID(), name: "Frank Herbert", slug: "frank-herbert", created_at: nowIso(), updated_at: nowIso() },
        { id: crypto.randomUUID(), name: "Isaac Asimov", slug: "isaac-asimov", created_at: nowIso(), updated_at: nowIso() },
      ],
      series: [],
      books: [],
      book_authors: [],
      book_series: [],
      book_files: [],
      book_chapters: [],
      user_books: [],
      user_sources: [
        {
          id: crypto.randomUUID(),
          user_id: DEMO_USER_ID,
          name: "Demo OPDS Source",
          type: "public_url",
          config: { url: "https://standardebooks.org/opds/all" },
          sync_mode: "pull_only",
          trust_level: "medium",
          automation: "ask",
          conflict_rule: "ask",
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ],
      source_items: [],
      book_aliases: [],
      book_alias_votes: [],
      user_settings: [],
    },
  };

  const duneId = crypto.randomUUID();
  const foundationId = crypto.randomUUID();
  const frank = seededStore.tables.authors[0];
  const isaac = seededStore.tables.authors[1];

  seededStore.tables.books.push(
    {
      id: duneId,
      title: "Dune",
      description: "A demo seeded title.",
      cover_url: null,
      published_year: 1965,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: foundationId,
      title: "Foundation",
      description: "A demo seeded title.",
      cover_url: null,
      published_year: 1951,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
  );

  seededStore.tables.book_authors.push(
    { book_id: duneId, author_id: frank.id },
    { book_id: foundationId, author_id: isaac.id }
  );

  seededStore.tables.user_books.push(
    {
      id: crypto.randomUUID(),
      user_id: DEMO_USER_ID,
      book_id: duneId,
      status: "reading",
      progress: 34,
      reading_location: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      user_id: DEMO_USER_ID,
      book_id: foundationId,
      status: "toread",
      progress: 0,
      reading_location: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
  );

  runtimeGlobal[DEMO_GLOBAL_KEY] = seededStore;
  saveStore(seededStore);
  return seededStore;
};

const cloneRow = (row: DemoRow): DemoRow => JSON.parse(JSON.stringify(row)) as DemoRow;

const ensureTable = (store: DemoStore, tableName: string): DemoRow[] => {
  if (!store.tables[tableName]) {
    store.tables[tableName] = [];
  }
  return store.tables[tableName];
};

const readCell = (row: DemoRow, column: string): unknown => row[column];

const matchesIlike = (value: unknown, pattern: string): boolean => {
  if (typeof value !== "string") return false;
  const regex = new RegExp(`^${pattern.replace(/[%]/g, ".*").replace(/_/g, ".")}$`, "i");
  return regex.test(value);
};

const addDefaultColumns = (row: DemoRow): DemoRow => {
  const next = { ...row };
  if (!next.id) next.id = crypto.randomUUID();
  if (!next.created_at) next.created_at = nowIso();
  if (!next.updated_at) next.updated_at = nowIso();
  return next;
};

class DemoQueryBuilder implements PromiseLike<DemoQueryResult<unknown>> {
  private readonly store: DemoStore;
  private readonly tableName: string;
  private operation: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private payload: DemoRow[] = [];
  private filters: Array<(row: DemoRow) => boolean> = [];
  private orderRule: { column: string; ascending: boolean } | null = null;
  private takeLimit: number | null = null;
  private selectOptions: SelectOptions | null = null;
  private selectedColumns: string | null = null;

  constructor(store: DemoStore, tableName: string) {
    this.store = store;
    this.tableName = tableName;
  }

  select(columns?: string, options?: SelectOptions): this {
    this.operation = "select";
    this.selectedColumns = columns || null;
    this.selectOptions = options || null;
    return this;
  }

  insert(values: DemoRow | DemoRow[]): this {
    this.operation = "insert";
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: DemoRow | DemoRow[], options?: UpsertOptions): this {
    void options;
    this.operation = "upsert";
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values: DemoRow): this {
    this.operation = "update";
    this.payload = [values];
    return this;
  }

  delete(): this {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => readCell(row, column) === value);
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push((row) => readCell(row, column) !== value);
    return this;
  }

  is(column: string, value: unknown): this {
    return this.eq(column, value);
  }

  in(column: string, values: unknown[]): this {
    this.filters.push((row) => {
      const val = readCell(row, column);
      return values.includes(val);
    });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push((row) => matchesIlike(readCell(row, column), pattern));
    return this;
  }

  or(expression: string): this {
    const parts = expression.split(",").map((part) => part.trim());
    const conditions = parts
      .map((part) => part.match(/^([a-zA-Z0-9_]+)\.eq\."?(.*?)"?$/))
      .filter(Boolean)
      .map((match) => ({ column: match![1], value: match![2] }));
    this.filters.push((row) => conditions.some((condition) => readCell(row, condition.column) === condition.value));
    return this;
  }

  order(column: string, options?: OrderOptions): this {
    this.orderRule = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number): this {
    this.takeLimit = count;
    return this;
  }

  async maybeSingle(): Promise<DemoQueryResult<unknown>> {
    const result = await this.execute();
    if (result.error) return result;
    const rows = Array.isArray(result.data) ? result.data : [];
    return { data: rows[0] || null, error: null };
  }

  async single(): Promise<DemoQueryResult<unknown>> {
    const result = await this.execute();
    if (result.error) return result;
    const rows = Array.isArray(result.data) ? result.data : [];
    if (rows.length === 0) {
      return { data: null, error: { message: "No rows found." } };
    }
    return { data: rows[0], error: null };
  }

  then<TResult1 = DemoQueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DemoQueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled || undefined, onrejected || undefined);
  }

  private applyFilters(rows: DemoRow[]): DemoRow[] {
    let nextRows = [...rows];
    for (const filter of this.filters) {
      nextRows = nextRows.filter(filter);
    }
    if (this.orderRule) {
      const { column, ascending } = this.orderRule;
      nextRows.sort((left, right) => {
        const leftValue = readCell(left, column);
        const rightValue = readCell(right, column);
        if (leftValue === rightValue) return 0;
        if (leftValue === null || leftValue === undefined) return 1;
        if (rightValue === null || rightValue === undefined) return -1;
        if (leftValue < rightValue) return ascending ? -1 : 1;
        return ascending ? 1 : -1;
      });
    }
    if (this.takeLimit !== null) {
      nextRows = nextRows.slice(0, this.takeLimit);
    }
    return nextRows;
  }

  private withRelationships(row: DemoRow): DemoRow {
    if (this.tableName === "user_books") {
      const books = ensureTable(this.store, "books");
      const bookSeries = ensureTable(this.store, "book_series");
      const bookFiles = ensureTable(this.store, "book_files");
      const bookAuthors = ensureTable(this.store, "book_authors");
      const authors = ensureTable(this.store, "authors");

      const book = books.find((candidate) => candidate.id === row.book_id);
      if (!book) return row;

      const linkedAuthors = bookAuthors
        .filter((link) => link.book_id === book.id)
        .map((link) => ({
          ...link,
          authors: authors.find((author) => author.id === link.author_id) || null,
        }));

      return {
        ...row,
        books: {
          ...book,
          book_series: bookSeries.filter((series) => series.book_id === book.id),
          book_files: bookFiles.filter((file) => file.book_id === book.id),
          book_authors: linkedAuthors,
        },
      };
    }

    if (this.tableName === "books") {
      const bookAuthors = ensureTable(this.store, "book_authors");
      const authors = ensureTable(this.store, "authors");
      const bookSeries = ensureTable(this.store, "book_series");
      const series = ensureTable(this.store, "series");
      const userBooks = ensureTable(this.store, "user_books");
      const bookFiles = ensureTable(this.store, "book_files");

      return {
        ...row,
        book_authors: bookAuthors
          .filter((link) => link.book_id === row.id)
          .map((link) => ({ ...link, authors: authors.find((author) => author.id === link.author_id) || null })),
        book_series: bookSeries
          .filter((link) => link.book_id === row.id)
          .map((link) => ({ ...link, series: series.find((item) => item.id === link.series_id) || null })),
        user_books: userBooks.filter((item) => item.book_id === row.id),
        book_files: bookFiles.filter((item) => item.book_id === row.id),
      };
    }

    if (this.tableName === "source_items") {
      const userBooks = ensureTable(this.store, "user_books");
      const userSources = ensureTable(this.store, "user_sources");
      return {
        ...row,
        user_books: userBooks.find((book) => book.id === row.user_book_id) || null,
        user_sources: userSources.find((s) => s.id === row.source_id) || null,
      };
    }

    if (this.tableName === "book_aliases") {
      const books = ensureTable(this.store, "books");
      return {
        ...row,
        books: books.find((book) => book.id === row.canonical_book_id) || null,
      };
    }

    return row;
  }

  private async execute(): Promise<DemoQueryResult<unknown>> {
    const table = ensureTable(this.store, this.tableName);

    if (this.operation === "select") {
      const filteredRows = this.applyFilters(table).map((row) => this.withRelationships(cloneRow(row)));
      if (this.selectOptions?.head) {
        return { data: null, error: null, count: filteredRows.length };
      }
      return { data: filteredRows, error: null, count: this.selectOptions?.count ? filteredRows.length : null };
    }

    if (this.operation === "insert") {
      const insertedRows = this.payload.map((row) => addDefaultColumns(cloneRow(row)));
      table.push(...insertedRows);
      saveStore(this.store);
      return { data: insertedRows.map((row) => this.withRelationships(cloneRow(row))), error: null };
    }

    if (this.operation === "upsert") {
      const upsertedRows: DemoRow[] = [];
      for (const row of this.payload) {
        const prepared = addDefaultColumns(cloneRow(row));
        const primaryCandidate = prepared.id ? table.find((existing) => existing.id === prepared.id) : null;
        if (primaryCandidate) {
          Object.assign(primaryCandidate, prepared, { updated_at: nowIso() });
          upsertedRows.push(cloneRow(primaryCandidate));
          saveStore(this.store);
          continue;
        }

        const simpleConflictKeys = Object.keys(prepared).filter((key) => key.endsWith("_id") || key === "id");
        const conflictRow = table.find((existing) =>
          simpleConflictKeys.length > 0 && simpleConflictKeys.every((key) => existing[key] === prepared[key])
        );

        if (conflictRow) {
          Object.assign(conflictRow, prepared, { updated_at: nowIso() });
          upsertedRows.push(cloneRow(conflictRow));
          saveStore(this.store);
        } else {
          table.push(prepared);
          upsertedRows.push(cloneRow(prepared));
          saveStore(this.store);
        }
      }
      return { data: upsertedRows.map((row) => this.withRelationships(row)), error: null };
    }

    if (this.operation === "update") {
      const updatedRows: DemoRow[] = [];
      const changes = this.payload[0] || {};
      for (const row of table) {
        const matches = this.filters.every((filter) => filter(row));
        if (!matches) continue;
        Object.assign(row, changes, { updated_at: nowIso() });
        updatedRows.push(cloneRow(row));
      saveStore(this.store);
      }
      return { data: updatedRows.map((row) => this.withRelationships(row)), error: null };
    }

    if (this.operation === "delete") {
      const keep = table.filter((row) => !this.filters.every((filter) => filter(row)));
      const removed = table.length - keep.length;
      this.store.tables[this.tableName] = keep;
      saveStore(this.store);
      return { data: removed, error: null };
    }

    return { data: [], error: null };
  }
}

class DemoSupabaseClient {
  private readonly store: DemoStore;

  constructor(store: DemoStore) {
    this.store = store;
  }

  auth = {
    getUser: async (): Promise<DemoQueryResult<{ user: DemoUser | null }>> => ({
      data: { user: { id: DEMO_USER_ID, email: "demo@openbookshelf.local" } },
      error: null,
    }),
  };

  from(tableName: string): DemoQueryBuilder {
    return new DemoQueryBuilder(this.store, tableName);
  }

  async rpc(functionName: string, params: RpcParams): Promise<DemoQueryResult<unknown>> {
    if (functionName === "bootstrap_user_role") {
      return { data: "admin", error: null };
    }

    if (functionName === "propose_book_alias") {
      const canonicalBookId = params.p_canonical_book_id as string;
      const aliasTitle = params.p_alias_title as string;
      const sourceId = (params.p_origin_source_id as string | null) || null;
      const sourceName = (params.p_origin_source_name as string | null) || null;
      const remoteId = (params.p_origin_remote_id as string | null) || null;
      const suggestedBy = (params.p_suggested_by as string | null) || DEMO_USER_ID;

      const aliases = ensureTable(this.store, "book_aliases");
      const normalized = normalizeTitle(aliasTitle);
      const existing = aliases.find(
        (alias) => alias.canonical_book_id === canonicalBookId && alias.normalized_alias === normalized
      );

      if (existing) {
        existing.updated_at = nowIso();
        return { data: existing.id as string, error: null };
      }

      const newAlias: DemoRow = {
        id: crypto.randomUUID(),
        canonical_book_id: canonicalBookId,
        alias_title: aliasTitle,
        normalized_alias: normalized,
        status: "pending",
        is_default: false,
        yes_votes: 0,
        no_votes: 0,
        origin_source_id: sourceId,
        origin_source_name: sourceName,
        origin_remote_id: remoteId,
        suggested_by: suggestedBy,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      aliases.push(newAlias);
      saveStore(this.store);
      return { data: newAlias.id as string, error: null };
    }

    if (functionName === "vote_book_alias") {
      const aliasId = params.p_alias_id as string;
      const isSame = Boolean(params.p_is_same);
      const aliasVotes = ensureTable(this.store, "book_alias_votes");
      const aliases = ensureTable(this.store, "book_aliases");
      const alias = aliases.find((item) => item.id === aliasId);
      if (!alias) {
        return { data: null, error: { message: "Alias not found." } };
      }

      const existingVote = aliasVotes.find(
        (vote) => vote.alias_id === aliasId && vote.user_id === DEMO_USER_ID
      );
      if (existingVote) {
        existingVote.is_same = isSame;
        existingVote.updated_at = nowIso();
      saveStore(this.store);
      } else {
        aliasVotes.push({
          alias_id: aliasId,
          user_id: DEMO_USER_ID,
          is_same: isSame,
          created_at: nowIso(),
          updated_at: nowIso(),
        });
      }
      saveStore(this.store);

      const votes = aliasVotes.filter((vote) => vote.alias_id === aliasId);
      const yesVotes = votes.filter((vote) => Boolean(vote.is_same)).length;
      const noVotes = votes.filter((vote) => !Boolean(vote.is_same)).length;

      alias.yes_votes = yesVotes;
      alias.no_votes = noVotes;
      alias.status = yesVotes >= 3 && yesVotes > noVotes ? "approved" : noVotes >= 3 ? "rejected" : "pending";
      alias.is_default = alias.status === "approved";
      alias.updated_at = nowIso();
      saveStore(this.store);

      return {
        data: [
          {
            alias_id: aliasId,
            yes_votes: yesVotes,
            no_votes: noVotes,
            status: alias.status,
          },
        ],
        error: null,
      };
    }

    return { data: null, error: null };
  }
}

export const isDemoSupabaseEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_SUPABASE_DEMO === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createDemoSupabaseClient = (): DemoSupabaseClient =>
  new DemoSupabaseClient(getGlobalStore());

export const getDemoUserId = () => DEMO_USER_ID;
