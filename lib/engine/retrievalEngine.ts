import { RETRIEVAL_CHUNK_COUNT } from "@/lib/constants";
import type { DocumentChunk } from "@/lib/types";

export function retrieveChunks(
  chunks: DocumentChunk[],
  query: string,
  limit = RETRIEVAL_CHUNK_COUNT,
): DocumentChunk[] {
  const terms = tokenize(query);
  if (terms.length === 0) {
    return chunks.slice(0, limit);
  }
  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, terms, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) {
    return [];
  }
  return ranked.slice(0, limit).map((item) => item.chunk);
}

function scoreChunk(chunk: DocumentChunk, terms: string[], query: string): number {
  const haystack = `${chunk.section ?? ""} ${chunk.text}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += 1;
    }
  }
  if (chunk.section && query.toLowerCase().includes(chunk.section.toLowerCase())) {
    score += 3;
  }
  return score;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
}
