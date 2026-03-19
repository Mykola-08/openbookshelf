import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { authorizeExternalApi } from "@/lib/api/external-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_RE.test(value);

const parseLimit = (value: string | null, fallback: number) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(Math.trunc(parsed), 200));
};

export async function GET(request: Request) {
  const auth = await authorizeExternalApi("api:v1:books:read");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = parseLimit(searchParams.get("limit"), 50);

  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select("id,title,description,cover_url,published_year,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const auth = await authorizeExternalApi("api:v1:books:write");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (
    body.user_id != null &&
    (!isUuid(body.user_id) || (auth.userId && auth.userId !== body.user_id))
  ) {
    return NextResponse.json({ error: "Invalid or unauthorized user_id" }, { status: 403 });
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const publishedYear = Number(body.published_year);
  const payload = {
    title: String(body.title).trim().slice(0, 500),
    description:
      typeof body.description === "string" ? body.description.slice(0, 10000) : null,
    cover_url: typeof body.cover_url === "string" ? body.cover_url.slice(0, 2000) : null,
    published_year:
      Number.isFinite(publishedYear) && publishedYear >= 0 && publishedYear <= 3000
        ? Math.trunc(publishedYear)
        : null,
    updated_at: nowIso,
  };

  const { data: book, error } = await supabase
    .from("books")
    .insert(payload)
    .select("id,title")
    .single();
  if (error || !book) {
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }

  if (typeof body.user_id === "string" && isUuid(body.user_id)) {
    const rawProgress = Number(body.progress ?? 0);
    const progress = Number.isFinite(rawProgress)
      ? Math.max(0, Math.min(Math.round(rawProgress), 100))
      : 0;

    await supabase.from("user_books").upsert(
      {
        user_id: body.user_id,
        book_id: book.id,
        status: body.status || "toread",
        progress,
        progress_unit: body.progress_unit || "percent",
        updated_at: nowIso,
      },
      { onConflict: "user_id,book_id" }
    );
  }

  return NextResponse.json({ data: book }, { status: 201 });
}
