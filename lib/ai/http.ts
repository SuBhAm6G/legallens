import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest, clientKey } from "@/lib/engine/rateLimitEngine";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function guardRequest(request: Request): NextResponse | null {
  if (!allowRequest(clientKey(request.headers))) {
    return jsonError("Too many requests. Please wait a minute and try again.", 429);
  }
  return null;
}

export function parseJson<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export function missingKeyResponse(): NextResponse {
  return jsonError(
    "Gemini is not configured. You can still use the Document Brief from deterministic analysis.",
    503,
  );
}
