import { applyAttention, missingInformationFindings } from "@/lib/engine/attentionEngine";
import { classifyClauses } from "@/lib/engine/clauseClassifyEngine";
import { generateChecklist } from "@/lib/engine/checklistEngine";
import { prioritizeFindings } from "@/lib/engine/contextDecisionEngine";
import { extractDates, extractParties, guessDocumentType } from "@/lib/engine/metadataEngine";
import { generateQuestions } from "@/lib/engine/questionEngine";
import { chunkDocument, detectSections } from "@/lib/engine/structureEngine";
import type {
  ChecklistItem,
  DocumentBrief,
  ParsedDocument,
  UserContext,
} from "@/lib/types";
import { stableId } from "@/lib/utils";

export function parseDocumentFromText(input: {
  fileName: string;
  text: string;
  sourceKind: ParsedDocument["sourceKind"];
}): ParsedDocument {
  const documentId = stableId("doc", `${input.fileName}:${input.text.slice(0, 80)}`);
  const sections = detectSections(input.text);
  const chunks = chunkDocument(documentId, sections);
  const firstChunkId = chunks[0]?.id ?? "none";
  return {
    id: documentId,
    fileName: input.fileName,
    sourceKind: input.sourceKind,
    documentTypeGuess: guessDocumentType(input.text),
    parties: extractParties(input.text),
    dates: extractDates(documentId, input.text, firstChunkId),
    text: input.text,
    chunks,
    sections,
  };
}

export function buildDocumentBrief(
  document: ParsedDocument,
  context: UserContext,
): { brief: DocumentBrief; checklist: ChecklistItem[] } {
  const classified = classifyClauses(document.id, document.chunks);
  const withAttention = applyAttention(classified);
  const missing = missingInformationFindings(document.id, document.text);
  const all = prioritizeFindings([...withAttention, ...missing], context);
  const obligations = all.filter(
    (item) => item.category === "obligations" || /\bshall\b/i.test(item.originalText),
  );
  const attentionAreas = all.filter((item) => item.attention !== "Review");
  const ambiguities = all.filter((item) => item.attention === "Ambiguous");
  const questions = generateQuestions(all, context);
  const brief: DocumentBrief = {
    documentId: document.id,
    documentType: document.documentTypeGuess,
    purpose: purposeFromType(document.documentTypeGuess),
    parties: document.parties,
    dates: document.dates,
    obligations: obligations.slice(0, 10),
    clauses: all,
    attentionAreas,
    ambiguities,
    questions,
  };
  return { brief, checklist: generateChecklist(all, document.dates, questions) };
}

function purposeFromType(documentType: string): string {
  if (documentType.includes("Employment")) {
    return "Employment contract";
  }
  if (documentType.includes("Lease")) {
    return "Residential lease";
  }
  return documentType;
}

export const DEFAULT_CONTEXT: UserContext = {
  role: "employee",
  documentType: "Employment Agreement",
  goal: "understand_before_signing",
  jurisdiction: null,
  urgency: null,
};
