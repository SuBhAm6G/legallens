import { CHUNK_TARGET_CHARS } from "@/lib/constants";
import type { DocumentChunk, DocumentSection } from "@/lib/types";
import { stableId } from "@/lib/utils";

const SECTION_PATTERN =
  /^(Section\s+\d+[A-Z]?\.?|ARTICLE\s+\d+\.?|\d+\.\s+[A-Z][^\n]{0,80})/gim;

/**
 * Detects top-level sections in a legal document (e.g., "Section 1", "ARTICLE II").
 * If no sections are found, treats the entire document as a single section.
 *
 * @param text - The raw text of the document.
 * @returns An array of DocumentSection objects.
 */
export function detectSections(text: string): DocumentSection[] {
  const matches = [...text.matchAll(SECTION_PATTERN)];
  if (matches.length === 0) {
    return [{ heading: "Document", startChunkIndex: 0, text }];
  }
  const sections: DocumentSection[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const start = match.index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    const heading = match[0].replace(/\.$/, "").trim();
    sections.push({
      heading,
      startChunkIndex: 0,
      text: text.slice(start, end).trim(),
    });
  }
  return sections;
}

/**
 * Chunks a list of document sections into smaller, target-sized chunks.
 * Ensures that chunks do not break mid-sentence if possible.
 *
 * @param documentId - The unique ID of the document.
 * @param sections - The array of detected document sections.
 * @returns An array of DocumentChunk objects ready for processing.
 */
export function chunkDocument(
  documentId: string,
  sections: DocumentSection[],
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let index = 0;
  for (const section of sections) {
    const pieces = splitToSize(section.text, CHUNK_TARGET_CHARS);
    for (const piece of pieces) {
      chunks.push({
        id: stableId("chunk", `${documentId}:${index}:${piece.slice(0, 40)}`),
        documentId,
        index,
        section: section.heading,
        text: piece,
      });
      index += 1;
    }
  }
  return chunks;
}

function splitToSize(text: string, size: number): string[] {
  if (text.length <= size) {
    return [text];
  }
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > size) {
    let cut = remaining.lastIndexOf("\n", size);
    if (cut < size / 3) {
      cut = remaining.lastIndexOf(" ", size);
    }
    if (cut < size / 3) {
      cut = size;
    }
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) {
    parts.push(remaining);
  }
  return parts;
}
