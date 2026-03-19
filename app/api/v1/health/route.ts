import { NextResponse } from "next/server";
import { getRuntimeHealthReport } from "@/lib/config/runtime-health";
import { authorizeExternalApi } from "@/lib/api/external-auth";

export async function GET() {
  const auth = await authorizeExternalApi("api:v1:health:read");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = getRuntimeHealthReport();
  return NextResponse.json({ data: report });
}
