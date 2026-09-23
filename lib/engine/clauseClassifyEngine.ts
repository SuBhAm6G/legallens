import type { ClauseFinding, DocumentChunk } from "@/lib/types";
import { classifyText } from "@/lib/engine/metadataEngine";
import { stableId, truncate } from "@/lib/utils";

export function classifyClauses(
  documentId: string,
  chunks: DocumentChunk[],
): ClauseFinding[] {
  const findings: ClauseFinding[] = [];
  for (const chunk of chunks) {
    const category = classifyText(chunk.text);
    if (category === "other" && chunk.section === "Document") {
      continue;
    }
    const title = chunk.section ?? categoryLabel(category);
    findings.push({
      id: stableId("clause", `${documentId}:${chunk.id}:${category}`),
      category,
      title,
      originalText: truncate(chunk.text, 900),
      affectedParty: guessParty(chunk.text),
      evidence: {
        documentId,
        chunkId: chunk.id,
        section: chunk.section,
        quote: truncate(chunk.text, 280),
      },
      attention: "Review",
      attentionReason: "Identified from document structure and wording.",
    });
  }
  return collapseBySection(findings);
}

export function categoryLabel(category: ClauseFinding["category"]): string {
  return category.replaceAll("_", " ");
}

function guessParty(text: string): string | null {
  if (/\bEmployee\b/.test(text) && /\bEmployer\b/.test(text)) {
    return "Both parties";
  }
  if (/\bEmployee\b/.test(text)) {
    return "Employee";
  }
  if (/\bTenant\b/.test(text)) {
    return "Tenant";
  }
  if (/\bEmployer\b/.test(text)) {
    return "Employer";
  }
  return null;
}

function collapseBySection(findings: ClauseFinding[]): ClauseFinding[] {
  const best = new Map<string, ClauseFinding>();
  for (const finding of findings) {
    const key = `${finding.title}:${finding.category}`;
    const existing = best.get(key);
    if (!existing || finding.originalText.length > existing.originalText.length) {
      best.set(key, finding);
    }
  }
  return [...best.values()];
}
