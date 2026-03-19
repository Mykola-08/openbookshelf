import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { authorizeExternalApi } from "@/lib/api/external-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_RE.test(value);

export async function GET(request: Request) {
  const auth = await authorizeExternalApi("api:v1:connectors:read");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!isUuid(userId)) {
    return NextResponse.json({ error: "valid user_id query param is required" }, { status: 400 });
  }

  if (auth.userId && auth.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized user scope" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_sources")
    .select("id,user_id,name,type,config,sync_mode,trust_level,automation,conflict_rule,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch connectors" }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
