'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface AliasVoteResult {
  success: boolean;
  yesVotes?: number;
  noVotes?: number;
  status?: string;
  error?: string;
}

export async function voteAliasAction(aliasId: string, isSame: boolean): Promise<AliasVoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const voteResult = await supabase.rpc("vote_book_alias", {
    p_alias_id: aliasId,
    p_is_same: isSame,
  });

  if (voteResult.error) {
    return { success: false, error: voteResult.error.message };
  }

  const firstRow = Array.isArray(voteResult.data) ? voteResult.data[0] : null;
  revalidatePath("/aliases");

  return {
    success: true,
    yesVotes: firstRow?.yes_votes ?? 0,
    noVotes: firstRow?.no_votes ?? 0,
    status: firstRow?.status ?? "pending",
  };
}
