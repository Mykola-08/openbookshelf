"use server";

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";

function getAIModel() {
  if (process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    // OpenRouter uses specialized model strings or standard ones
    return openrouter(process.env.AI_MODEL || "openai/gpt-4o-mini");
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(process.env.AI_MODEL || "gpt-4o-mini");
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return google(process.env.AI_MODEL || "gemini-1.5-pro");
  }

  throw new Error("No AI API keys configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY in your environment.");
}

export async function generateBookDescription(bookId: string) {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("id, title, authors")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    throw new Error("Book not found");
  }

  const model = getAIModel();

  const prompt = `Provide a short, engaging description (about 150-200 words) for the book "${book.title}" ${book.authors?.name ? "by " + book.authors.name : ""}. Under no circumstances use markdown or codeblocks. Make it plain text and compelling.`;

  const { text } = await generateText({
    model,
    prompt,
  });

  if (text) {
    await supabase
      .from("books")
      .update({ description: text.trim() })
      .eq("id", bookId);
  }

  return text.trim();
}

export async function generateChapterSummary(bookId: string, chapterTitle: string, chapterId: string) {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("title, authors")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    throw new Error("Book not found");
  }

  const model = getAIModel();

  const prompt = `Provide a brief, concise summary (about 50-75 words) of the chapter "${chapterTitle}" from the book "${book.title}". Avoid spoilers of the very ending of the chapter if possible, and just give an overview of events. Respond in plain text without markdown.`;

  const { text } = await generateText({
    model,
    prompt,
  });

  if (text) {
    const { error: updateError } = await supabase
      .from("book_chapters")
      .update({ summary: text.trim() } as any)
      .eq("id", chapterId);

      if (updateError) {
        console.error("Failed to update chapter summary:", updateError);
      }
  }

  return text.trim();
}
