import { describe, expect, it } from "vitest";
import {
  aiAnalyzeSchema,
  aiAskSchema,
  aiClauseSchema,
  aiDiffSchema,
  aiPrepSchema,
} from "@/lib/ai/outputSchemas";

// ── aiAskSchema ─────────────────────────────────────────────────────────────

describe("aiAskSchema", () => {
  it("accepts a valid answer object", () => {
    const result = aiAskSchema.safeParse({
      answer: "The document states 90 days notice.",
      foundInDocument: true,
      usedChunkIds: ["c1", "c2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when answer is a number", () => {
    expect(
      aiAskSchema.safeParse({ answer: 42, foundInDocument: true, usedChunkIds: [] }).success,
    ).toBe(false);
  });

  it("rejects when foundInDocument is a string 'yes' instead of boolean", () => {
    expect(
      aiAskSchema.safeParse({ answer: "ok", foundInDocument: "yes", usedChunkIds: [] }).success,
    ).toBe(false);
  });

  it("rejects when usedChunkIds is missing", () => {
    expect(
      aiAskSchema.safeParse({ answer: "ok", foundInDocument: false }).success,
    ).toBe(false);
  });

  it("rejects when usedChunkIds contains a non-string", () => {
    expect(
      aiAskSchema.safeParse({ answer: "ok", foundInDocument: true, usedChunkIds: [1, 2] }).success,
    ).toBe(false);
  });

  it("rejects when usedChunkIds exceeds max of 6", () => {
    expect(
      aiAskSchema.safeParse({
        answer: "ok",
        foundInDocument: true,
        usedChunkIds: ["a", "b", "c", "d", "e", "f", "g"],
      }).success,
    ).toBe(false);
  });
});

// ── aiClauseSchema ──────────────────────────────────────────────────────────

describe("aiClauseSchema", () => {
  const valid = {
    plainEnglish: "You can quit with 90 days notice.",
    obligation: "Give 90 days notice.",
    conditions: "Must be in writing.",
    uncertainty: "May be waived by mutual agreement.",
    question: "Can the notice period be shortened?",
  };

  it("accepts a valid clause explanation", () => {
    expect(aiClauseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when plainEnglish is missing", () => {
    const { plainEnglish: _, ...rest } = valid;
    expect(aiClauseSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when obligation is a number", () => {
    expect(aiClauseSchema.safeParse({ ...valid, obligation: 99 }).success).toBe(false);
  });
});

// ── aiDiffSchema ────────────────────────────────────────────────────────────

describe("aiDiffSchema", () => {
  it("accepts valid diff explanations", () => {
    const result = aiDiffSchema.safeParse({
      explanations: [
        {
          hunkId: "diff-001",
          meaning: "Notice period shortened from 90 to 30 days.",
          practicalSignificance: "Reduces time to exit the employment relationship.",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty explanations array", () => {
    expect(aiDiffSchema.safeParse({ explanations: [] }).success).toBe(true);
  });

  it("rejects when meaning is missing from an explanation item", () => {
    expect(
      aiDiffSchema.safeParse({
        explanations: [{ hunkId: "d1", practicalSignificance: "important" }],
      }).success,
    ).toBe(false);
  });

  it("rejects when explanations exceeds max of 12", () => {
    const items = Array.from({ length: 13 }, (_, i) => ({
      hunkId: `d${i}`,
      meaning: "change",
      practicalSignificance: "sig",
    }));
    expect(aiDiffSchema.safeParse({ explanations: items }).success).toBe(false);
  });
});

// ── aiAnalyzeSchema ─────────────────────────────────────────────────────────

describe("aiAnalyzeSchema", () => {
  it("accepts a valid analysis object", () => {
    const result = aiAnalyzeSchema.safeParse({
      purpose: "Employment agreement between employer and employee.",
      parties: ["Acme Corp", "John Smith"],
      explanations: [
        {
          section: "Termination",
          plainEnglish: "Either side can leave with 90 days notice.",
          uncertainty: "Notice may be waivable.",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty parties and explanations arrays", () => {
    expect(
      aiAnalyzeSchema.safeParse({ purpose: "Some agreement.", parties: [], explanations: [] })
        .success,
    ).toBe(true);
  });

  it("rejects when parties exceeds max of 8", () => {
    const parties = Array.from({ length: 9 }, (_, i) => `Party ${i}`);
    expect(
      aiAnalyzeSchema.safeParse({ purpose: "agreement", parties, explanations: [] }).success,
    ).toBe(false);
  });
});

// ── aiPrepSchema ─────────────────────────────────────────────────────────────

describe("aiPrepSchema", () => {
  it("accepts a valid prep pack object", () => {
    const result = aiPrepSchema.safeParse({
      summary: "An employment agreement with standard terms.",
      informationToGather: ["Collect prior offer letters."],
      inconsistencies: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects when summary is missing", () => {
    expect(
      aiPrepSchema.safeParse({ informationToGather: [], inconsistencies: [] }).success,
    ).toBe(false);
  });

  it("rejects when informationToGather exceeds max of 8", () => {
    const items = Array.from({ length: 9 }, (_, i) => `item ${i}`);
    expect(
      aiPrepSchema.safeParse({
        summary: "ok",
        informationToGather: items,
        inconsistencies: [],
      }).success,
    ).toBe(false);
  });

  it("rejects when inconsistencies is not an array", () => {
    expect(
      aiPrepSchema.safeParse({
        summary: "ok",
        informationToGather: [],
        inconsistencies: "none",
      }).success,
    ).toBe(false);
  });
});
