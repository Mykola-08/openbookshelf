'use server'

import { createClient } from "@/utils/supabase/server";
import { importBookFromOPDS, type ImportBookResult } from "@/lib/sync/import";
import { revalidatePath } from "next/cache";
import type { OPDSEntry } from "@/lib/connectors/types";

export interface ImportBookActionResponse {
  success: boolean;
  result?: ImportBookResult;
  error?: string;
}

export async function importBookAction(
  entry: OPDSEntry,
  sourceId: string
): Promise<ImportBookActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await importBookFromOPDS(entry, sourceId, user.id);
    if (!result.userBookId) {
      return { success: false, error: "Import completed without a user book mapping." };
    }

    revalidatePath("/");
    revalidatePath(`/book/${result.canonicalBookId}`);
    revalidatePath(`/connections/${sourceId}/browse`);
    revalidatePath("/aliases");
    return { success: true, result };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Failed to import book.";
    return { success: false, error: message };
  }
}
