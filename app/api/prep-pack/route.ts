import { NextResponse } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/generate";
import { guardRequest, jsonError, missingKeyResponse, parseJson } from "@/lib/ai/http";
import { prepPackWithAi } from "@/lib/ai/tasks";
import { prepPackRequestSchema } from "@/lib/schemas";

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
    const input = parseJson(prepPackRequestSchema, body);
    const pack = await prepPackWithAi(input);
    return NextResponse.json(pack);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("The preparation request was not valid.", 400);
    }
    return jsonError("The preparation pack could not be generated.", 502);
  }
}
