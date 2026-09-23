import { generateValidatedObject } from "@/lib/ai/generate";
import {
  aiAnalyzeSchema,
  aiAskSchema,
  aiClauseSchema,
  aiDiffSchema,
  aiPrepSchema,
} from "@/lib/ai/outputSchemas";
import { wrapUntrustedDocument } from "@/lib/engine/promptGuardEngine";
import { retrieveChunks } from "@/lib/engine/retrievalEngine";
import { sanitizeAssistantText } from "@/lib/engine/safetyEngine";
import type {
  ClauseExplanation,
  DiffHunk,
  DocumentChunk,
  GroundedAnswer,
  UserContext,
} from "@/lib/types";

export async function explainClauseWithAi(input: {
  clauseText: string;
  section: string | null;
  category: string;
  context: UserContext;
}): Promise<ClauseExplanation> {
  const object = await generateValidatedObject(
    aiClauseSchema,
    [
      `User role: ${input.context.role}. Goal: ${input.context.goal}.`,
      `Clause category: ${input.category}. Section: ${input.section ?? "unknown"}.`,
      "Explain for a non-lawyer. Do not give legal advice.",
      wrapUntrustedDocument(input.clauseText),
    ].join("\n"),
  );
  return {
    plainEnglish: sanitizeAssistantText(object.plainEnglish),
    obligation: sanitizeAssistantText(object.obligation),
    conditions: sanitizeAssistantText(object.conditions),
    uncertainty: sanitizeAssistantText(object.uncertainty),
    question: sanitizeAssistantText(object.question),
  };
}

export async function askDocumentWithAi(input: {
  question: string;
  documentId: string;
  chunks: DocumentChunk[];
  context: UserContext;
}): Promise<GroundedAnswer> {
  const retrieved = retrieveChunks(input.chunks, input.question);
  if (retrieved.length === 0) {
    return {
      answer: "I couldn't find that in the provided document.",
      kind: "UNCERTAINTY",
      citations: [],
      insufficientEvidence: true,
    };
  }
  const evidenceBlock = retrieved
    .map((chunk) => `[${chunk.id} | ${chunk.section ?? "Document"}]\n${chunk.text}`)
    .join("\n\n");
  const object = await generateValidatedObject(
    aiAskSchema,
    [
      `User role: ${input.context.role}. Goal: ${input.context.goal}.`,
      `Question: ${input.question}`,
      "Answer only from the evidence chunks. If not present, set foundInDocument false.",
      wrapUntrustedDocument(evidenceBlock),
    ].join("\n"),
  );
  if (!object.foundInDocument) {
    return {
      answer: "I couldn't find that in the provided document.",
      kind: "UNCERTAINTY",
      citations: [],
      insufficientEvidence: true,
    };
  }
  const used = retrieved.filter((chunk) => object.usedChunkIds.includes(chunk.id));
  const citations = (used.length > 0 ? used : retrieved.slice(0, 2)).map((chunk) => ({
    documentId: input.documentId,
    chunkId: chunk.id,
    section: chunk.section,
    quote: chunk.text.slice(0, 280),
  }));
  return {
    answer: sanitizeAssistantText(object.answer),
    kind: "DOCUMENT_FACT",
    citations,
    insufficientEvidence: false,
  };
}

export async function explainDiffsWithAi(input: {
  hunks: DiffHunk[];
  context: UserContext;
}) {
  const material = input.hunks.filter((hunk) => hunk.kind !== "unchanged").slice(0, 8);
  const object = await generateValidatedObject(
    aiDiffSchema,
    [
      `User role: ${input.context.role}. Goal: ${input.context.goal}.`,
      "Explain practical meaning of these text changes. Do not call anything illegal.",
      wrapUntrustedDocument(JSON.stringify(material)),
    ].join("\n"),
  );
  return object.explanations.map((item) => ({
    ...item,
    meaning: sanitizeAssistantText(item.meaning),
    practicalSignificance: sanitizeAssistantText(item.practicalSignificance),
  }));
}

export async function analyzeOverviewWithAi(input: {
  text: string;
  context: UserContext;
}) {
  return generateValidatedObject(
    aiAnalyzeSchema,
    [
      `User role: ${input.context.role}. Goal: ${input.context.goal}.`,
      "Summarize purpose and parties from the document only.",
      wrapUntrustedDocument(input.text.slice(0, 14000)),
    ].join("\n"),
  );
}

export async function prepPackWithAi(input: {
  text: string;
  context: UserContext;
  findingTitles: string[];
}) {
  const object = await generateValidatedObject(
    aiPrepSchema,
    [
      `User role: ${input.context.role}. Goal: ${input.context.goal}.`,
      `Known findings: ${input.findingTitles.join("; ")}`,
      "Create a preparation summary. Do not give legal advice.",
      wrapUntrustedDocument(input.text.slice(0, 14000)),
    ].join("\n"),
  );
  return {
    summary: sanitizeAssistantText(object.summary),
    informationToGather: object.informationToGather.map(sanitizeAssistantText),
    inconsistencies: object.inconsistencies.map(sanitizeAssistantText),
  };
}
