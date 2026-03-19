import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { authorizeExternalApi } from "@/lib/api/external-auth";
import { resolveReadingStatus } from "@/lib/sync/reading-status";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_RE.test(value);

export async function POST(request: Request) {
  const auth = await authorizeExternalApi("api:v1:user-books:sync");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isUuid(body?.user_id) || !isUuid(body?.book_id)) {
    return NextResponse.json(
      { error: "Valid UUID user_id and book_id are required" },
      { status: 400 }
    );
  }

  if (auth.userId && auth.userId !== body.user_id) {
    return NextResponse.json({ error: "Unauthorized user scope" }, { status: 403 });
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const progressNumber = Number(body.progress ?? 0);
  const progress = Number.isFinite(progressNumber)
    ? Math.max(0, Math.min(progressNumber, 100))
    : 0;

  const { data: existing } = await supabase
    .from("user_books")
    .select("status,started_at,finished_at")
    .eq("user_id", body.user_id)
    .eq("book_id", body.book_id)
    .maybeSingle();

  const resolved = resolveReadingStatus({
    currentStatus: body.status || existing?.status,
    progressPercent: progress,
    startedAt: existing?.started_at,
    finishedAt: existing?.finished_at,
  });

  const { data, error } = await supabase
    .from("user_books")
    .upsert(
      {
        user_id: body.user_id,
        book_id: body.book_id,
        status: resolved.nextStatus,
        progress: Math.round(progress),
        progress_unit: body.progress_unit || "percent",
        reading_location:
          typeof body.reading_location === "string"
            ? body.reading_location.slice(0, 4000)
            : null,
        started_at: resolved.startedAt,
        finished_at: resolved.finishedAt,
        rating: Number.isFinite(Number(body.rating))
          ? Math.max(0, Math.min(Number(body.rating), 5))
          : null,
        notes: typeof body.notes === "string" ? body.notes.slice(0, 20000) : null,
        updated_at: nowIso,
      },
      { onConflict: "user_id,book_id" }
    )
    .select("id,user_id,book_id,status,progress,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to sync user book state" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
