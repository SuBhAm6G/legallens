import { describe, expect, it } from "vitest";
import { extractDocumentText } from "@/lib/engine/extractEngine";
import { chunkDocument, detectSections } from "@/lib/engine/structureEngine";
import { classifyClauses } from "@/lib/engine/clauseClassifyEngine";
import { SAMPLE_EMPLOYMENT_V1 } from "@/lib/samples/documents";

describe("extract and structure", () => {
  it("extracts utf-8 text", async () => {
    const bytes = new TextEncoder().encode("Section 1. Hello");
    const result = await extractDocumentText({ name: "a.txt", bytes });
    expect(result).toEqual({ text: "Section 1. Hello" });
  });

  it("detects numbered sections", () => {
    const sections = detectSections(SAMPLE_EMPLOYMENT_V1);
    expect(sections.some((section) => section.heading.includes("Section 9"))).toBe(
      true,
    );
  });

  it("maps clauses to evidence chunks", () => {
    const sections = detectSections(SAMPLE_EMPLOYMENT_V1);
    const chunks = chunkDocument("doc-1", sections);
    const clauses = classifyClauses("doc-1", chunks);
    const termination = clauses.find((item) => item.category === "termination");
    expect(termination).toBeTruthy();
    expect(termination?.evidence.quote.toLowerCase()).toContain("terminat");
    expect(termination?.evidence.chunkId).toBeTruthy();
  });
});
