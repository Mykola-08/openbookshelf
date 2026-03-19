"use server";

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";
import type { AIProvider, AISummaryLength, UserSettings } from "@/lib/config/user-settings";

interface AIRuntimeSettings {
  provider: AIProvider;
  model: string;
  temperature: number;
  summaryLength: AISummaryLength;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

async function getAIRuntimeSettings(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AIRuntimeSettings> {
  const fallback: AIRuntimeSettings = {
    provider: "auto",
    model: process.env.AI_MODEL || "",
    temperature: 0.4,
    summaryLength: "balanced",
  };

  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;
  if (!user) return fallback;

  const settingsResult = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", user.id)
    .maybeSingle();

  const stored = settingsResult.data?.settings as Partial<UserSettings> | undefined;
  if (!stored) return fallback;

  return {
    provider:
      stored.aiProvider === "auto" ||
      stored.aiProvider === "openrouter" ||
      stored.aiProvider === "openai" ||
      stored.aiProvider === "google"
        ? stored.aiProvider
        : fallback.provider,
    model: typeof stored.aiModel === "string" ? stored.aiModel.trim().slice(0, 120) : fallback.model,
    temperature: clamp(Number(stored.aiTemperature ?? fallback.temperature), 0, 1),
    summaryLength:
      stored.aiSummaryLength === "short" ||
      stored.aiSummaryLength === "balanced" ||
      stored.aiSummaryLength === "detailed"
        ? stored.aiSummaryLength
        : fallback.summaryLength,
  };
}

function getAIModel(settings: AIRuntimeSettings) {
  const tryOpenRouter = settings.provider === "auto" || settings.provider === "openrouter";
  const tryOpenAI = settings.provider === "auto" || settings.provider === "openai";
  const tryGoogle = settings.provider === "auto" || settings.provider === "google";

  if (tryOpenRouter && process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    return openrouter(settings.model || process.env.AI_MODEL || "openai/gpt-4o-mini");
  }

  if (tryOpenAI && process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(settings.model || process.env.AI_MODEL || "gpt-4o-mini");
  }

  if (tryGoogle && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return google(settings.model || process.env.AI_MODEL || "gemini-1.5-pro");
  }

  throw new Error("No AI API keys configured for selected AI provider.");
}

function getChapterSummaryLengthInstruction(mode: AISummaryLength): string {
  if (mode === "short") return "around 40-60 words";
  if (mode === "detailed") return "around 120-170 words";
  return "around 70-100 words";
}

export async function generateBookDescription(bookId: string) {
  const supabase = await createClient();
  const aiSettings = await getAIRuntimeSettings(supabase);

  const { data: book, error } = await supabase
    .from("books")
    .select("id, title, authors")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    throw new Error("Book not found");
  }

  const model = getAIModel(aiSettings);

  const prompt = `Provide a short, engaging description (about 150-200 words) for the book "${book.title}" ${book.authors?.name ? "by " + book.authors.name : ""}. Under no circumstances use markdown or codeblocks. Make it plain text and compelling.`;

  const { text } = await generateText({
    model,
    prompt,
    temperature: aiSettings.temperature,
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
  const aiSettings = await getAIRuntimeSettings(supabase);

  const { data: book, error } = await supabase
    .from("books")
    .select("title, authors")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    throw new Error("Book not found");
  }

  const model = getAIModel(aiSettings);

  const prompt = `Provide a brief, concise summary (${getChapterSummaryLengthInstruction(aiSettings.summaryLength)}) of the chapter "${chapterTitle}" from the book "${book.title}". Avoid spoilers of the very ending of the chapter if possible, and just give an overview of events. Respond in plain text without markdown.`;

  const { text } = await generateText({
    model,
    prompt,
    temperature: aiSettings.temperature,
  });

  if (text) {
    const { error: updateError } = await supabase
      .from("book_chapters")
      .update({ summary: text.trim() })
      .eq("id", chapterId);

    if (updateError) {
      console.error("Failed to update chapter summary:", updateError);
    }
  }

  return text.trim();
}
