import { describe, expect, it } from "vitest";
import { applyAttention, missingInformationFindings } from "@/lib/engine/attentionEngine";
import { classifyClauses } from "@/lib/engine/clauseClassifyEngine";
import { generateChecklist } from "@/lib/engine/checklistEngine";
import { generateQuestions } from "@/lib/engine/questionEngine";
import { DEFAULT_CONTEXT, buildDocumentBrief, parseDocumentFromText } from "@/lib/engine/pipeline";
import { retrieveChunks } from "@/lib/engine/retrievalEngine";
import { SAMPLE_EMPLOYMENT_V1 } from "@/lib/samples/documents";

describe("attention, questions, checklist", () => {
  it("classifies liability as high attention when uncapped", () => {
    const parsed = parseDocumentFromText({
      fileName: "e.txt",
      text: SAMPLE_EMPLOYMENT_V1,
      sourceKind: "sample",
    });
    const findings = applyAttention(classifyClauses(parsed.id, parsed.chunks));
    expect(findings.some((item) => item.attention === "High Attention")).toBe(true);
    expect(findings.some((item) => item.attention === "Ambiguous")).toBe(true);
  });

  it("flags missing governing law on sparse documents", () => {
    const missing = missingInformationFindings("doc", "This is a short note with no clauses.");
    expect(missing[0]?.attention).toBe("Missing Information");
  });

  it("generates questions and checklist items", () => {
    const { brief, checklist } = buildDocumentBrief(
      parseDocumentFromText({
        fileName: "e.txt",
        text: SAMPLE_EMPLOYMENT_V1,
        sourceKind: "sample",
      }),
      DEFAULT_CONTEXT,
    );
    expect(generateQuestions(brief.clauses, DEFAULT_CONTEXT).length).toBeGreaterThan(0);
    expect(generateChecklist(brief.clauses, brief.dates, brief.questions).length).toBeGreaterThan(2);
    expect(checklist.length).toBeGreaterThan(2);
  });

  it("returns no chunks when evidence is missing", () => {
    const parsed = parseDocumentFromText({
      fileName: "e.txt",
      text: SAMPLE_EMPLOYMENT_V1,
      sourceKind: "sample",
    });
    expect(retrieveChunks(parsed.chunks, "intergalactic warp clause xyz")).toEqual([]);
  });
});
