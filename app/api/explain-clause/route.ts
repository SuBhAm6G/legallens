import { NextResponse } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/generate";
import { guardRequest, jsonError, missingKeyResponse, parseJson } from "@/lib/ai/http";
import { explainClauseWithAi } from "@/lib/ai/tasks";
import { explainClauseRequestSchema } from "@/lib/schemas";

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
    const input = parseJson(explainClauseRequestSchema, body);
    const explanation = await explainClauseWithAi(input);
    return NextResponse.json({ explanation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("The request was not valid.", 400);
    }
    return jsonError("The explanation could not be generated.", 502);
  }
}
