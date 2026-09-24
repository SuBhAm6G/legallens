import { NextResponse } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/generate";
import { guardRequest, jsonError, missingKeyResponse, parseJson } from "@/lib/ai/http";
import { askDocumentWithAi } from "@/lib/ai/tasks";
import { askRequestSchema } from "@/lib/schemas";

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
    const input = parseJson(askRequestSchema, body);
    const result = await askDocumentWithAi({
      question: input.question,
      documentId: input.documentId,
      chunks: input.chunks.map((chunk, index) => ({
        id: chunk.id,
        documentId: input.documentId,
        index,
        section: chunk.section,
        text: chunk.text,
      })),
      context: input.context,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("The question request was not valid.", 400);
    }
    return jsonError("The assistant could not answer right now.", 502);
  }
}
