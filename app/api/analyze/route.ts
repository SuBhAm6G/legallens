import { NextResponse } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/generate";
import { guardRequest, jsonError, missingKeyResponse, parseJson } from "@/lib/ai/http";
import { analyzeOverviewWithAi } from "@/lib/ai/tasks";
import { analyzeRequestSchema } from "@/lib/schemas";

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
    const input = parseJson(analyzeRequestSchema, body);
    const overview = await analyzeOverviewWithAi(input);
    return NextResponse.json({ overview });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("The analyze request was not valid.", 400);
    }
    return jsonError("Document overview enrichment is unavailable.", 502);
  }
}
