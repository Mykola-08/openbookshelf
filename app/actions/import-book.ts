'use server'

import { createClient } from "@/utils/supabase/server";
import { importBookFromOPDS } from "@/lib/sync/import";
import { revalidatePath } from "next/cache";

export async function importBookAction(entry: any, sourceId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const bookId = await importBookFromOPDS(entry, sourceId, user.id);
    if (bookId) {
        revalidatePath('/library');
        revalidatePath(`/connections/${sourceId}/browse`);
        return { success: true, bookId };
    } else {
        return { success: false, error: 'Failed to import book' };
    }
  } catch (e: any) {
    console.error('Import Error:', e);
    return { success: false, error: e.message };
  }
}
