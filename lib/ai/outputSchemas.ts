import { z } from "zod";

export const aiAnalyzeSchema = z.object({
  purpose: z.string(),
  parties: z.array(z.string()).max(8),
  explanations: z
    .array(
      z.object({
        section: z.string(),
        plainEnglish: z.string(),
        uncertainty: z.string(),
      }),
    )
    .max(12),
});

export const aiClauseSchema = z.object({
  plainEnglish: z.string(),
  obligation: z.string(),
  conditions: z.string(),
  uncertainty: z.string(),
  question: z.string(),
});

export const aiAskSchema = z.object({
  answer: z.string(),
  foundInDocument: z.boolean(),
  usedChunkIds: z.array(z.string()).max(6),
});

export const aiDiffSchema = z.object({
  explanations: z
    .array(
      z.object({
        hunkId: z.string(),
        meaning: z.string(),
        practicalSignificance: z.string(),
      }),
    )
    .max(12),
});

export const aiPrepSchema = z.object({
  summary: z.string(),
  informationToGather: z.array(z.string()).max(8),
  inconsistencies: z.array(z.string()).max(8),
});
