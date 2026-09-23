import { MAX_TEXT_CHARS } from "@/lib/constants";
import type { IngestError } from "@/lib/types";
import { fileExtension, normalizeWhitespace } from "@/lib/utils";

export async function extractDocumentText(input: {
  name: string;
  bytes: Uint8Array;
}): Promise<{ text: string } | { error: IngestError }> {
  const extension = fileExtension(input.name);
  if (extension === ".pdf") {
    return extractPdf(input.bytes);
  }
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(input.bytes);
  return finalizeText(decoded);
}

async function extractPdf(
  bytes: Uint8Array,
): Promise<{ text: string } | { error: IngestError }> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    const raw = Array.isArray(extracted.text)
      ? extracted.text.join("\n")
      : extracted.text;
    return finalizeText(raw);
  } catch {
    return {
      error: {
        code: "EXTRACT_FAILED",
        message:
          "PDF text could not be extracted. Use a text-based PDF, or upload a .txt file.",
      },
    };
  }
}

function finalizeText(
  raw: string,
): { text: string } | { error: IngestError } {
  const text = normalizeWhitespace(raw);
  if (!text) {
    return {
      error: {
        code: "EMPTY",
        message: "No readable text was found in the document.",
      },
    };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return {
      error: {
        code: "TOO_LONG",
        message: "The extracted text is too long to process in this demo.",
      },
    };
  }
  return { text };
}
