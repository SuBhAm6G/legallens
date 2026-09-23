import type {
  ATTENTION_LABELS,
  CLAUSE_CATEGORIES,
  USER_GOALS,
  USER_ROLES,
} from "@/lib/constants";

export type AttentionLabel = (typeof ATTENTION_LABELS)[number];
export type ClauseCategory = (typeof CLAUSE_CATEGORIES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type UserGoal = (typeof USER_GOALS)[number];

export type ClaimKind =
  | "DOCUMENT_FACT"
  | "EXPLANATION"
  | "INFERENCE"
  | "UNCERTAINTY"
  | "QUESTION";

export interface EvidenceRef {
  documentId: string;
  chunkId: string;
  section: string | null;
  quote: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  index: number;
  section: string | null;
  text: string;
}

export interface DocumentSection {
  heading: string;
  startChunkIndex: number;
  text: string;
}

export interface ExtractedDate {
  label: string;
  value: string;
  evidence: EvidenceRef;
}

export interface ParsedDocument {
  id: string;
  fileName: string;
  sourceKind: "upload" | "sample";
  documentTypeGuess: string;
  parties: string[];
  dates: ExtractedDate[];
  text: string;
  chunks: DocumentChunk[];
  sections: DocumentSection[];
}

export interface ClauseFinding {
  id: string;
  category: ClauseCategory;
  title: string;
  originalText: string;
  affectedParty: string | null;
  evidence: EvidenceRef;
  attention: AttentionLabel;
  attentionReason: string;
}

export interface UserContext {
  role: UserRole;
  documentType: string;
  goal: UserGoal;
  jurisdiction: string | null;
  urgency: string | null;
}

export interface DocumentBrief {
  documentId: string;
  documentType: string;
  purpose: string;
  parties: string[];
  dates: ExtractedDate[];
  obligations: ClauseFinding[];
  clauses: ClauseFinding[];
  attentionAreas: ClauseFinding[];
  ambiguities: ClauseFinding[];
  questions: string[];
}

export type DiffKind = "added" | "removed" | "changed" | "unchanged";

export interface DiffHunk {
  id: string;
  kind: DiffKind;
  originalText: string;
  newText: string;
  sectionHint: string | null;
}

export interface ChecklistItem {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  sourceFindingId: string | null;
}

export type IngestErrorCode =
  | "EMPTY"
  | "TOO_LARGE"
  | "INVALID_TYPE"
  | "EXTRACT_FAILED"
  | "TOO_LONG";

export interface IngestError {
  code: IngestErrorCode;
  message: string;
}

export interface FileInput {
  name: string;
  size: number;
  type: string;
}

export interface ClauseExplanation {
  plainEnglish: string;
  obligation: string;
  conditions: string;
  uncertainty: string;
  question: string;
}

export interface GroundedAnswer {
  answer: string;
  kind: ClaimKind;
  citations: EvidenceRef[];
  insufficientEvidence: boolean;
}
