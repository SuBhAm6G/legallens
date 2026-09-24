import { NextResponse } from "next/server";
import { extractDocumentText } from "@/lib/engine/extractEngine";
import { validateFileInput } from "@/lib/engine/ingestEngine";
import { guardRequest, jsonError } from "@/lib/ai/http";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export async function POST(request: Request): Promise<NextResponse> {
  const blocked = guardRequest(request);
  if (blocked) {
    return blocked;
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError("A file is required.", 400);
  }
  const validation = validateFileInput({
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (validation) {
    return jsonError(validation.message, 400);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonError("File is too large.", 400);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractDocumentText({ name: file.name, bytes });
  if ("error" in extracted) {
    return jsonError(extracted.error.message, 400);
  }
  return NextResponse.json({ fileName: file.name, text: extracted.text });
}
