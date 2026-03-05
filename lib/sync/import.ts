import { createClient } from "@/utils/supabase/server";
import { normalizeUserSettings } from "@/lib/config/user-settings";
import type { UserSettings } from "@/lib/config/user-settings";
import type { OPDSEntry, OPDSLink } from "@/lib/connectors/types";

interface MergeCandidate {
  id: string;
  title: string;
}

interface MergeResult {
  bookId: string | null;
  reason: "exact_title" | "approved_alias" | "similarity" | "new_book";
  similarityScore: number;
  needsReview: boolean;
  candidateForReviewId: string | null;
}

export interface ImportBookResult {
  userBookId: string | null;
  canonicalBookId: string | null;
  mergeReason: MergeResult["reason"];
  similarityScore: number;
  aliasProposalCreated: boolean;
  reviewRequired: boolean;
}

const nowIso = () => new Date().toISOString();

const normalizeAuthor = (name: string): string => {
  if (name.includes(",")) {
    const [last, first] = name.split(",").map((segment) => segment.trim());
    return `${first} ${last}`.trim();
  }
  return name.trim();
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const normalizeTitle = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .replace(/\s+/g, " ");

/**
 * Dice coefficient over character bigrams.
 * Good enough for lightweight fuzzy matching without extra dependencies.
 */
const titleSimilarity = (a: string, b: string): number => {
  const normalizedA = normalizeTitle(a);
  const normalizedB = normalizeTitle(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const bigrams = (value: string) => {
    const output: string[] = [];
    for (let index = 0; index < value.length - 1; index += 1) {
      output.push(value.slice(index, index + 2));
    }
    return output;
  };

  const aBigrams = bigrams(normalizedA);
  const bBigrams = bigrams(normalizedB);
  const bCounts = new Map<string, number>();
  for (const gram of bBigrams) {
    bCounts.set(gram, (bCounts.get(gram) || 0) + 1);
  }

  let overlap = 0;
  for (const gram of aBigrams) {
    const count = bCounts.get(gram) || 0;
    if (count > 0) {
      overlap += 1;
      bCounts.set(gram, count - 1);
    }
  }

  return (2 * overlap) / (aBigrams.length + bBigrams.length);
};

const extractCoverLink = (links: OPDSLink[] | undefined): string | null => {
  if (!links || links.length === 0) return null;
  const withImageRel = links.find((link) => link.rel?.includes("image") || link.type?.startsWith("image/"));
  if (withImageRel?.href) return withImageRel.href;
  const imageByExt = links.find((link) => link.href.endsWith(".jpg") || link.href.endsWith(".png") || link.href.endsWith(".jpeg"));
  return imageByExt?.href || null;
};

const extractEpubLink = (links: OPDSLink[] | undefined): string | null => {
  if (!links || links.length === 0) return null;
  const epubLink = links.find(
    (link) =>
      link.type?.includes("epub") ||
      link.href.endsWith(".epub") ||
      link.rel === "http://opds-spec.org/acquisition"
  );
  return epubLink?.href || null;
};

async function resolveMergeTarget(
  entryTitle: string,
  mergeSimilarityThreshold: number,
  mergeReviewThreshold: number,
  quickImportMode: "ask" | "auto_merge" | "always_new",
  askBeforeAliasMerge: boolean
): Promise<MergeResult> {
  const supabase = await createClient();
  const normalizedEntryTitle = normalizeTitle(entryTitle);

  if (quickImportMode === "always_new") {
    return {
      bookId: null,
      reason: "new_book",
      similarityScore: 0,
      needsReview: false,
      candidateForReviewId: null,
    };
  }

  // Exact title lookup first.
  const exactMatch = await supabase
    .from("books")
    .select("id, title")
    .eq("title", entryTitle.trim())
    .limit(1)
    .maybeSingle();

  if (exactMatch.data?.id) {
    return {
      bookId: exactMatch.data.id as string,
      reason: "exact_title",
      similarityScore: 1,
      needsReview: false,
      candidateForReviewId: null,
    };
  }

  // Approved aliases are treated as exact canonical mappings.
  const aliasMatch = await supabase
    .from("book_aliases")
    .select("canonical_book_id")
    .eq("normalized_alias", normalizedEntryTitle)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (aliasMatch.data?.canonical_book_id) {
    return {
      bookId: aliasMatch.data.canonical_book_id as string,
      reason: "approved_alias",
      similarityScore: 1,
      needsReview: false,
      candidateForReviewId: null,
    };
  }

  const probe = entryTitle.slice(0, 24).trim();
  const candidatesResult = await supabase
    .from("books")
    .select("id, title")
    .ilike("title", `%${probe}%`)
    .limit(60);

  const candidates = (candidatesResult.data || []) as MergeCandidate[];
  if (candidates.length === 0) {
    return {
      bookId: null,
      reason: "new_book",
      similarityScore: 0,
      needsReview: false,
      candidateForReviewId: null,
    };
  }

  let best: { id: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = titleSimilarity(entryTitle, candidate.title);
    if (!best || score > best.score) {
      best = { id: candidate.id, score };
    }
  }

  if (!best) {
    return {
      bookId: null,
      reason: "new_book",
      similarityScore: 0,
      needsReview: false,
      candidateForReviewId: null,
    };
  }

  if (best.score >= mergeSimilarityThreshold) {
    return {
      bookId: best.id,
      reason: "similarity",
      similarityScore: best.score,
      needsReview: false,
      candidateForReviewId: best.id,
    };
  }

  if (best.score >= mergeReviewThreshold) {
    const canAutoMerge = quickImportMode === "auto_merge" || !askBeforeAliasMerge;
    return {
      bookId: canAutoMerge ? best.id : null,
      reason: canAutoMerge ? "similarity" : "new_book",
      similarityScore: best.score,
      needsReview: true,
      candidateForReviewId: best.id,
    };
  }

  return {
    bookId: null,
    reason: "new_book",
    similarityScore: best.score,
    needsReview: false,
    candidateForReviewId: null,
  };
}

async function ensureAuthors(bookId: string, authorNames: string[]) {
  const supabase = await createClient();
  const authorIds: string[] = [];

  for (const rawName of authorNames) {
    const cleanName = normalizeAuthor(rawName);
    if (!cleanName) continue;
    const slug = slugify(cleanName);

    const authorResult = await supabase.from("authors").select("id").eq("slug", slug).maybeSingle();
    if (authorResult.data?.id) {
      authorIds.push(authorResult.data.id as string);
      continue;
    }

    const insertResult = await supabase
      .from("authors")
      .insert({ name: cleanName, slug })
      .select("id")
      .single();
    if (insertResult.data?.id) {
      authorIds.push(insertResult.data.id as string);
    }
  }

  if (authorIds.length === 0) return;

  await supabase.from("book_authors").upsert(
    authorIds.map((authorId) => ({ book_id: bookId, author_id: authorId })),
    { onConflict: "book_id,author_id" }
  );
}

export async function importBookFromOPDS(entry: OPDSEntry, sourceId: string, userId: string): Promise<ImportBookResult> {
  const supabase = await createClient();
  const title = entry.title?.trim() || "Untitled";

  const existingSourceItem = await supabase
    .from("source_items")
    .select("user_book_id, user_books(book_id)")
    .eq("source_id", sourceId)
    .eq("remote_id", entry.id)
    .maybeSingle();

  if (existingSourceItem.data?.user_book_id) {
    return {
      userBookId: existingSourceItem.data.user_book_id as string,
      canonicalBookId: (existingSourceItem.data.user_books as { book_id?: string } | null)?.book_id || null,
      mergeReason: "exact_title",
      similarityScore: 1,
      aliasProposalCreated: false,
      reviewRequired: false,
    };
  }

  const sourceRow = await supabase.from("user_sources").select("name").eq("id", sourceId).maybeSingle();
  const sourceName = (sourceRow.data?.name as string | undefined) || "unknown_source";

  const settingsRow = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();
  const resolvedSettings = normalizeUserSettings(
    (settingsRow.data?.settings as Partial<UserSettings>) || null
  );

  const mergeResult = await resolveMergeTarget(
    title,
    resolvedSettings.mergeSimilarityThreshold,
    resolvedSettings.mergeReviewThreshold,
    resolvedSettings.quickImportMode,
    resolvedSettings.askBeforeAliasMerge
  );

  let canonicalBookId = mergeResult.bookId;
  if (!canonicalBookId) {
    const bookInsert = await supabase
      .from("books")
      .insert({
        title,
        description: entry.summary || entry.content || null,
        published_year: entry.published_year || (entry.updated ? new Date(entry.updated).getFullYear() : null),
        cover_url: extractCoverLink(entry.links),
        updated_at: nowIso(),
      })
      .select("id")
      .single();

    if (!bookInsert.data?.id) {
      throw new Error(bookInsert.error?.message || "Failed to create canonical book.");
    }

    canonicalBookId = bookInsert.data.id as string;
  }

  const authorNames = (entry.authors || []).map((author) => author.name).filter(Boolean);
  await ensureAuthors(canonicalBookId, authorNames);

  let aliasProposalCreated = false;
  const normalizedIncoming = normalizeTitle(title);
  const canonicalTitleRow = await supabase
    .from("books")
    .select("title")
    .eq("id", canonicalBookId)
    .maybeSingle();
  const canonicalTitle = (canonicalTitleRow.data?.title as string | undefined) || title;

  if (normalizedIncoming !== normalizeTitle(canonicalTitle)) {
    const aliasResult = await supabase.rpc("propose_book_alias", {
      p_canonical_book_id: canonicalBookId,
      p_alias_title: title,
      p_origin_source_id: sourceId,
      p_origin_source_name: sourceName,
      p_origin_remote_id: entry.id,
      p_suggested_by: userId,
    });

    aliasProposalCreated = !aliasResult.error;

    // For high-confidence automatic merges, cast an initial yes vote from importer.
    if (
      aliasProposalCreated &&
      mergeResult.reason !== "new_book" &&
      mergeResult.similarityScore >= resolvedSettings.mergeSimilarityThreshold &&
      aliasResult.data
    ) {
      await supabase.rpc("vote_book_alias", {
        p_alias_id: aliasResult.data,
        p_is_same: true,
      });
    }
  }

  // In "ask" mode, we may intentionally create a new canonical book but still collect
  // community feedback for the likely duplicate candidate.
  if (
    !aliasProposalCreated &&
    mergeResult.needsReview &&
    mergeResult.candidateForReviewId &&
    mergeResult.bookId === null
  ) {
    const pendingAliasResult = await supabase.rpc("propose_book_alias", {
      p_canonical_book_id: mergeResult.candidateForReviewId,
      p_alias_title: title,
      p_origin_source_id: sourceId,
      p_origin_source_name: sourceName,
      p_origin_remote_id: entry.id,
      p_suggested_by: userId,
    });
    aliasProposalCreated = !pendingAliasResult.error;
  }

  const userBookResult = await supabase
    .from("user_books")
    .upsert(
      {
        user_id: userId,
        book_id: canonicalBookId,
        status: "toread",
        updated_at: nowIso(),
      },
      { onConflict: "user_id,book_id" }
    )
    .select("id")
    .single();

  if (!userBookResult.data?.id) {
    throw new Error(userBookResult.error?.message || "Failed to create user book record.");
  }

  const userBookId = userBookResult.data.id as string;
  await supabase.from("source_items").upsert(
    {
      source_id: sourceId,
      remote_id: entry.id,
      user_book_id: userBookId,
      sync_state: mergeResult.needsReview ? "pending_review" : "synced",
      last_synced_data: entry,
      last_seen_at: nowIso(),
    },
    { onConflict: "source_id,remote_id" }
  );

  const epubLink = extractEpubLink(entry.links);
  if (epubLink) {
    const existingFile = await supabase
      .from("book_files")
      .select("id")
      .eq("book_id", canonicalBookId)
      .eq("file_url", epubLink)
      .maybeSingle();

    if (!existingFile.data?.id) {
      await supabase.from("book_files").insert({
        book_id: canonicalBookId,
        format: "epub",
        file_url: epubLink,
        source_origin: sourceId,
      });
    }
  }

  return {
    userBookId,
    canonicalBookId,
    mergeReason: mergeResult.reason,
    similarityScore: mergeResult.similarityScore,
    aliasProposalCreated,
    reviewRequired: mergeResult.needsReview,
  };
}
