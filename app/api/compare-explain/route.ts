import { NextResponse } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/generate";
import { guardRequest, jsonError, missingKeyResponse, parseJson } from "@/lib/ai/http";
import { explainDiffsWithAi } from "@/lib/ai/tasks";
import { compareExplainRequestSchema } from "@/lib/schemas";

export const runtime = "edge";

export async function POST(request: Request): Promise<NextResponse> {
  const blocked = guardRequest(request);
  if (blocked) {
    return blocked;
  }
  if (!hasGeminiKey()) {
    return missingKeyResponse();
  }
  try {
    const body: unknown = await request.json();
    const input = parseJson(compareExplainRequestSchema, body);
    const explanations = await explainDiffsWithAi(input);
    return NextResponse.json({ explanations });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("The compare request was not valid.", 400);
    }
    return jsonError("Semantic explanations are unavailable.", 502);
  }
}
