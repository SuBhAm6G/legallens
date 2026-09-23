import { z } from "zod";
import {
  CLAUSE_CATEGORIES,
  USER_GOALS,
  USER_ROLES,
} from "@/lib/constants";

export const clauseCategorySchema = z.enum(CLAUSE_CATEGORIES);
export const userRoleSchema = z.enum(USER_ROLES);
export const userGoalSchema = z.enum(USER_GOALS);

export const groundedAnswerSchema = z.object({
  answer: z.string(),
  kind: z.enum([
    "DOCUMENT_FACT",
    "EXPLANATION",
    "INFERENCE",
    "UNCERTAINTY",
    "QUESTION",
  ]),
  citations: z.array(
    z.object({
      documentId: z.string(),
      chunkId: z.string(),
      section: z.string().nullable(),
      quote: z.string(),
    }),
  ),
  insufficientEvidence: z.boolean(),
});

export const userContextSchema = z.object({
  role: userRoleSchema,
  documentType: z.string().min(1).max(80),
  goal: userGoalSchema,
  jurisdiction: z.string().max(80).nullable(),
  urgency: z.string().max(120).nullable(),
});

export const askRequestSchema = z.object({
  question: z.string().trim().min(3).max(500),
  documentId: z.string().min(1),
  chunks: z
    .array(
      z.object({
        id: z.string(),
        section: z.string().nullable(),
        text: z.string().max(4000),
      }),
    )
    .max(80),
  context: userContextSchema,
});

export const analyzeRequestSchema = z.object({
  documentId: z.string().min(1),
  fileName: z.string().min(1).max(200),
  text: z.string().min(1).max(120_000),
  context: userContextSchema,
});

export const clauseExplanationSchema = z.object({
  plainEnglish: z.string(),
  obligation: z.string(),
  conditions: z.string(),
  uncertainty: z.string(),
  question: z.string(),
});

export const explainClauseRequestSchema = z.object({
  clauseText: z.string().min(1).max(4000),
  section: z.string().nullable(),
  category: clauseCategorySchema,
  context: userContextSchema,
});

export const compareExplainRequestSchema = z.object({
  hunks: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["added", "removed", "changed", "unchanged"]),
        originalText: z.string().max(2500),
        newText: z.string().max(2500),
        sectionHint: z.string().nullable(),
      }),
    )
    .max(24),
  context: userContextSchema,
});

export const prepPackRequestSchema = z.object({
  documentId: z.string().min(1),
  text: z.string().min(1).max(120_000),
  context: userContextSchema,
  findingTitles: z.array(z.string().max(200)).max(40),
});
