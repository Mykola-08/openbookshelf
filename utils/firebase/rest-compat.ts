type Primitive = string | number | boolean | null;
type Row = Record<string, Primitive | Primitive[] | Record<string, unknown> | unknown>;

interface AuthUser {
  id: string;
  email: string;
}

interface CompatResult<T> {
  data: T;
  error: { message: string } | null;
}

interface SelectOptions {
  head?: boolean;
  count?: "exact" | "planned" | "estimated";
}

interface UpsertOptions {
  onConflict?: string;
}

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_AUTH_EMAIL = process.env.FIREBASE_AUTH_EMAIL;
const FIREBASE_AUTH_PASSWORD = process.env.FIREBASE_AUTH_PASSWORD;
const FIREBASE_SERVER_USER_ID = process.env.FIREBASE_SERVER_USER_ID || "firebase-server-user";
const FIREBASE_SERVER_USER_EMAIL = process.env.FIREBASE_SERVER_USER_EMAIL || "firebase@openbookshelf.local";
const FIREBASE_AUTO_ANON = process.env.NEXT_PUBLIC_FIREBASE_AUTO_ANON !== "false";

const IDENTITY_BASE = "https://identitytoolkit.googleapis.com/v1";
const FIRESTORE_BASE = FIREBASE_PROJECT_ID
  ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`
  : "";

const TOKEN_KEY = "__openbookshelf_firebase_token__";
const USER_KEY = "__openbookshelf_firebase_user__";

const isServer = typeof window === "undefined";

const readBrowserSession = (): { token: string; user: AuthUser } | null => {
  if (isServer) return null;
  try {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    const raw = window.sessionStorage.getItem(USER_KEY);
    if (!token || !raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return { token, user: parsed };
  } catch {
    return null;
  }
};

const writeBrowserSession = (token: string, user: AuthUser) => {
  if (isServer) return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

const jsonHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const parseFirestoreValue = (value: any): unknown => {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue as string;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map((entry: any) => parseFirestoreValue(entry));
  }
  if ("mapValue" in value) {
    const fields = value.mapValue.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseFirestoreValue(v)]));
  }
  return null;
};

const toFirestoreValue = (value: unknown): any => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((entry) => toFirestoreValue(entry)) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toFirestoreValue(v)])),
      },
    };
  }
  return { stringValue: String(value) };
};

const docToRow = (doc: any): Row => {
  const fields = doc.fields || {};
  const row = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseFirestoreValue(v)]));
  const name = String(doc.name || "");
  const docId = name.split("/").pop();
  if (docId && !row.id) row.id = docId;
  return row;
};

const rowToFields = (row: Row): any =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k, toFirestoreValue(v)]));

class FirebaseQueryBuilder implements PromiseLike<CompatResult<unknown>> {
  private filters: Array<{ column: string; value: unknown }> = [];
  private selected: string | null = null;
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row[] = [];
  private _single = false;
  private _maybeSingle = false;
  private _limit: number | null = null;
  private orderBy: { column: string; ascending: boolean } | null = null;

  constructor(private readonly client: FirebaseRestCompatClient, private readonly table: string) {}

  select(columns?: string, _options?: SelectOptions): this {
    this.op = "select";
    this.selected = columns || null;
    return this;
  }

  insert(values: Row | Row[]): this {
    this.op = "insert";
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values: Row): this {
    this.op = "update";
    this.payload = [values];
    return this;
  }

  upsert(values: Row | Row[], _options?: UpsertOptions): this {
    this.op = "upsert";
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  delete(): this {
    this.op = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(value: number): this {
    this._limit = value;
    return this;
  }

  single(): this {
    this._single = true;
    return this;
  }

  maybeSingle(): this {
    this._maybeSingle = true;
    return this;
  }

  then<TResult1 = CompatResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: CompatResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<CompatResult<unknown>> {
    try {
      if (this.op === "insert") return { data: await this.client.insert(this.table, this.payload), error: null };
      if (this.op === "upsert") return { data: await this.client.upsert(this.table, this.payload, this.filters), error: null };
      if (this.op === "update") return { data: await this.client.update(this.table, this.payload[0], this.filters), error: null };
      if (this.op === "delete") return { data: await this.client.delete(this.table, this.filters), error: null };

      let rows = await this.client.select(this.table);
      for (const rule of this.filters) {
        rows = rows.filter((row) => row[rule.column] === rule.value);
      }

      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        rows.sort((a, b) => {
          const av = a[column] as any;
          const bv = b[column] as any;
          if (av === bv) return 0;
          return av > bv ? (ascending ? 1 : -1) : ascending ? -1 : 1;
        });
      }

      if (this._limit !== null) rows = rows.slice(0, this._limit);

      if (this.selected && this.selected !== "*") {
        const fields = this.selected.split(",").map((f) => f.trim()).filter(Boolean);
        rows = rows.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
      }

      if (this._single) {
        if (!rows.length) return { data: null, error: { message: "No rows found" } };
        return { data: rows[0], error: null };
      }

      if (this._maybeSingle) {
        return { data: rows[0] ?? null, error: null };
      }

      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "Firebase query failed" } };
    }
  }
}

class FirebaseRestCompatClient {
  private token: string | null = null;
  private user: AuthUser | null = null;

  async ensureAuth() {
    if (this.token && this.user) return;

    if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) {
      throw new Error("Firebase is not configured. Missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
    }

    const cached = readBrowserSession();
    if (cached) {
      this.token = cached.token;
      this.user = cached.user;
      return;
    }

    if (isServer) {
      this.token = null;
      this.user = { id: FIREBASE_SERVER_USER_ID, email: FIREBASE_SERVER_USER_EMAIL };
      return;
    }

    let endpoint = `${IDENTITY_BASE}/accounts:signUp?key=${FIREBASE_API_KEY}`;
    let body: Record<string, unknown> = { returnSecureToken: true };

    if (FIREBASE_AUTH_EMAIL && FIREBASE_AUTH_PASSWORD) {
      endpoint = `${IDENTITY_BASE}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
      body = {
        email: FIREBASE_AUTH_EMAIL,
        password: FIREBASE_AUTH_PASSWORD,
        returnSecureToken: true,
      };
    } else if (!FIREBASE_AUTO_ANON) {
      throw new Error("Firebase auth requires FIREBASE_AUTH_EMAIL/FIREBASE_AUTH_PASSWORD or NEXT_PUBLIC_FIREBASE_AUTO_ANON=true.");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok || !data?.idToken) {
      throw new Error(data?.error?.message || "Firebase auth failed");
    }

    this.token = data.idToken as string;
    this.user = {
      id: String(data.localId || "firebase-user"),
      email: String(data.email || `${data.localId}@firebase.local`),
    };

    writeBrowserSession(this.token, this.user);
  }

  auth = {
    getUser: async (): Promise<CompatResult<{ user: AuthUser | null }>> => {
      try {
        await this.ensureAuth();
        return { data: { user: this.user }, error: null };
      } catch (error) {
        return {
          data: { user: null },
          error: { message: error instanceof Error ? error.message : "Firebase auth error" },
        };
      }
    },
  };

  from(table: string) {
    return new FirebaseQueryBuilder(this, table);
  }

  async rpc(functionName: string, _params: Record<string, unknown>): Promise<CompatResult<unknown>> {
    if (functionName === "bootstrap_user_role") {
      return { data: "admin", error: null };
    }
    return { data: null, error: { message: `RPC not supported in Firebase mode: ${functionName}` } };
  }

  async select(table: string): Promise<Row[]> {
    await this.ensureAuth();
    const response = await fetch(`${FIRESTORE_BASE}/${table}?pageSize=1000`, {
      headers: jsonHeaders(this.token || undefined),
    });
    if (response.status === 404) return [];
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Failed to read documents");
    }
    return Array.isArray(data.documents) ? data.documents.map((doc: any) => docToRow(doc)) : [];
  }

  async insert(table: string, payload: Row[]) {
    await this.ensureAuth();
    const created: Row[] = [];
    for (const row of payload) {
      const id = typeof row.id === "string" ? row.id : crypto.randomUUID();
      const response = await fetch(`${FIRESTORE_BASE}/${table}?documentId=${id}`, {
        method: "POST",
        headers: jsonHeaders(this.token || undefined),
        body: JSON.stringify({ fields: rowToFields({ ...row, id }) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Insert failed");
      created.push(docToRow(data));
    }
    return created;
  }

  async upsert(table: string, payload: Row[], filters: Array<{ column: string; value: unknown }>) {
    if (!payload.length) return [];
    const rows = await this.select(table);
    const updated: Row[] = [];

    for (const row of payload) {
      const keyFilter = filters.length ? filters : [{ column: "id", value: row.id }];
      const match = rows.find((candidate) => keyFilter.every((f) => candidate[f.column] === (row[f.column] ?? f.value)));

      if (match?.id) {
        const result = await this.patchDoc(table, String(match.id), { ...match, ...row });
        updated.push(result);
      } else {
        const [inserted] = (await this.insert(table, [row])) as Row[];
        updated.push(inserted);
      }
    }

    return updated;
  }

  async update(table: string, patch: Row, filters: Array<{ column: string; value: unknown }>) {
    const rows = await this.select(table);
    const matches = rows.filter((candidate) => filters.every((f) => candidate[f.column] === f.value));
    const updated: Row[] = [];
    for (const row of matches) {
      if (!row.id) continue;
      updated.push(await this.patchDoc(table, String(row.id), { ...row, ...patch }));
    }
    return updated;
  }

  async delete(table: string, filters: Array<{ column: string; value: unknown }>) {
    await this.ensureAuth();
    const rows = await this.select(table);
    const matches = rows.filter((candidate) => filters.every((f) => candidate[f.column] === f.value));
    for (const row of matches) {
      if (!row.id) continue;
      await fetch(`${FIRESTORE_BASE}/${table}/${row.id}`, {
        method: "DELETE",
        headers: jsonHeaders(this.token || undefined),
      });
    }
    return null;
  }

  private async patchDoc(table: string, id: string, row: Row): Promise<Row> {
    await this.ensureAuth();
    const response = await fetch(`${FIRESTORE_BASE}/${table}/${id}`, {
      method: "PATCH",
      headers: jsonHeaders(this.token || undefined),
      body: JSON.stringify({ fields: rowToFields({ ...row, id }) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Update failed");
    return docToRow(data);
  }
}

export const createFirebaseCompatClient = () => new FirebaseRestCompatClient();
