import sys

content = """\"use server\";

import { generateText } from \"ai\";
import { createGoogleGenerativeAI } from \"@ai-sdk/google\";
import { createClient } from \"@/utils/supabase/server\";

export async function generateBookDescription(bookId: string) {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from(\"books\")
    .select(\"id, title, authors\")
    .eq(\"id\", bookId)
    .single();

  if (error || !book) {
    throw new Error(\"Book not found\");
  }

  // Ensure GOOGLE_GENERATIVE_AI_API_KEY is available (configured in env)
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || \"\",
  });

  const prompt = \Provide a short, engaging description (about 150-200 words) for the book \"\\" \. Under no circumstances use markdown or codeblocks. Make it plain text and compelling.\;

  const { text } = await generateText({
    model: google(\"gemini-1.5-pro\"),
    prompt,
  });

  if (text) {
    await supabase
      .from(\"books\")
      .update({ description: text.trim() })
      .eq(\"id\", bookId);
  }

  return text.trim();
}

export async function generateChapterSummary(bookId: string, chapterTitle: string, chapterId: string) {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from(\"books\")
    .select(\"title, authors\")
    .eq(\"id\", bookId)
    .single();

  if (error || !book) {
    throw new Error(\"Book not found\");
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || \"\",
  });

  const prompt = \Provide a brief, concise summary (about 50-75 words) of the chapter \"\\" from the book \"\\" \. Avoid spoilers of the very ending of the chapter if possible, and just give an overview of events. Respond in plain text without markdown.\;

  const { text } = await generateText({
    model: google(\"gemini-1.5-pro\"),
    prompt,
  });

  if (text) {
    // Attempt to update the dynamic schema table. 
    // Types might complain so we cast or suppress.
    const { error: updateError } = await supabase
      .from(\"book_chapters\")
      .update({ summary: text.trim() } as any)
      .eq(\"id\", chapterId);

      if (updateError) {
        console.error(\"Failed to update chapter summary:\", updateError);
      }
  }

  return text.trim();
}
"""

with open('app/actions/ai-generate.ts', 'w', encoding='utf-8') as f:
    f.write(content)
