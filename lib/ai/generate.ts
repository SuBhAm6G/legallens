import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { ZodType } from "zod";
import { GEMINI_MODEL_ID } from "@/lib/constants";
import { systemGuard } from "@/lib/engine/promptGuardEngine";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export async function generateValidatedObject<T>(
  schema: ZodType<T>,
  prompt: string,
): Promise<T> {
  const { object } = await generateObject({
    model: google(GEMINI_MODEL_ID),
    schema,
    system: systemGuard(),
    prompt,
    maxOutputTokens: 1800,
  });
  return schema.parse(object);
}
