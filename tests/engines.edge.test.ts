import { describe, expect, it } from "vitest";
import {
  applyAttention,
  missingInformationFindings,
} from "@/lib/engine/attentionEngine";
import { classifyClauses } from "@/lib/engine/clauseClassifyEngine";
import {
  extractDates,
  extractParties,
  guessDocumentType,
} from "@/lib/engine/metadataEngine";
import { diffDocuments } from "@/lib/engine/diffEngine";
import { retrieveChunks } from "@/lib/engine/retrievalEngine";
import { generateChecklist } from "@/lib/engine/checklistEngine";
import { generateQuestions } from "@/lib/engine/questionEngine";
import { DEFAULT_CONTEXT, parseDocumentFromText } from "@/lib/engine/pipeline";
import type { ClauseFinding, DocumentChunk } from "@/lib/types";
import { SAMPLE_EMPLOYMENT_V1, SAMPLE_LEASE } from "@/lib/samples/documents";

// ── helpers ────────────────────────────────────────────────────────────────

function makeChunk(
  id: string,
  text: string,
  section: string | null = null,
): DocumentChunk {
  return { id, documentId: "test-doc", index: 0, section, text };
}

function makeFinding(
  overrides: Partial<ClauseFinding> = {},
): ClauseFinding {
  return {
    id: "f1",
    category: "obligations",
    title: "Test clause",
    originalText: "Employee shall perform duties.",
    affectedParty: null,
    evidence: { documentId: "d", chunkId: "c", section: null, quote: "..." },
    attention: "Review",
    attentionReason: "standard",
    ...overrides,
  };
}

// ── guessDocumentType ───────────────────────────────────────────────────────

describe("guessDocumentType", () => {
  it("identifies employment agreements", () => {
    expect(guessDocumentType("This employment agreement is between...")).toBe(
      "Employment Agreement",
    );
  });

  it("identifies residential leases", () => {
    expect(guessDocumentType("This lease agreement grants the Tenant the right...")).toBe(
      "Residential Lease",
    );
  });

  it("identifies service agreements", () => {
    expect(guessDocumentType("This services agreement (Statement of Work) ...")).toBe(
      "Service Agreement",
    );
  });

  it("identifies NDAs", () => {
    expect(guessDocumentType("This non-disclosure (NDA) prohibits...")).toBe(
      "Confidentiality Agreement",
    );
  });

  it("falls back to 'Legal document' for unknown types", () => {
    expect(guessDocumentType("Whereas the parties agree to the following terms...")).toBe(
      "Legal document",
    );
  });
});

// ── extractParties ──────────────────────────────────────────────────────────

describe("extractParties", () => {
  it("extracts named parties from 'between ... and ...' pattern", () => {
    const text =
      "This Agreement is entered into between Acme Corp (the Employer) and John Smith (the Employee).";
    const parties = extractParties(text);
    expect(parties.length).toBeGreaterThan(0);
  });

  it("returns empty array for a document with no party language", () => {
    const parties = extractParties("These are some unrelated clauses.");
    expect(parties).toEqual([]);
  });

  it("caps results at 6 parties", () => {
    const parties = extractParties(SAMPLE_EMPLOYMENT_V1);
    expect(parties.length).toBeLessThanOrEqual(6);
  });
});

// ── extractDates ────────────────────────────────────────────────────────────

describe("extractDates", () => {
  it("extracts calendar dates from text", () => {
    const text = "The contract starts on January 15, 2025 and ends March 1, 2026.";
    const dates = extractDates("doc1", text, "c1");
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].label).toBeDefined();
    expect(dates[0].evidence).toBeDefined();
  });

  it("extracts notice period in days", () => {
    const text = "Either party may terminate with 90 days written notice.";
    const dates = extractDates("doc1", text, "c1");
    const noticePeriod = dates.find((d) => d.label === "Notice period");
    expect(noticePeriod).toBeDefined();
    expect(noticePeriod?.value).toMatch(/90/);
  });

  it("returns empty array when no dates are present", () => {
    const dates = extractDates("doc1", "No dates here whatsoever.", "c1");
    expect(dates).toEqual([]);
  });

  it("deduplicates identical dates", () => {
    const text =
      "Start date: January 15, 2025. Also confirmed: January 15, 2025.";
    const dates = extractDates("doc1", text, "c1");
    const calendarDates = dates.filter((d) => d.label === "Calendar date");
    const values = calendarDates.map((d) => d.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("caps at 8 dates", () => {
    const many =
      "January 1, 2020 February 1, 2020 March 1, 2020 April 1, 2020 May 1, 2020 June 1, 2020 July 1, 2020 August 1, 2020 September 1, 2020";
    const dates = extractDates("doc1", many, "c1");
    expect(dates.length).toBeLessThanOrEqual(8);
  });
});

// ── attentionEngine ─────────────────────────────────────────────────────────

describe("attentionEngine — each rule", () => {
  it("marks non-compete restrictions as High Attention", () => {
    const finding = makeFinding({
      category: "restrictions",
      originalText: "Employee shall not work for any competitor under non-compete.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("High Attention");
  });

  it("marks uncapped liability as High Attention", () => {
    const finding = makeFinding({
      category: "liability",
      originalText: "The party shall be liable for all losses including indirect damages.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("High Attention");
  });

  it("does NOT mark capped liability as High Attention", () => {
    const finding = makeFinding({
      category: "liability",
      originalText: "Liability shall not exceed the fees paid in the prior 12 months.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).not.toBe("High Attention");
  });

  it("marks one-sided employee indemnity as High Attention", () => {
    const finding = makeFinding({
      category: "indemnity",
      originalText:
        "Employee shall indemnify the Employer for any losses or claims arising from employee's actions.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("High Attention");
  });

  it("does NOT mark mutual indemnity as High Attention", () => {
    const finding = makeFinding({
      category: "indemnity",
      originalText:
        "Employee shall indemnify the Employer. Employer shall indemnify the Employee.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).not.toBe("High Attention");
  });

  it("marks vague 'reasonable' language as Ambiguous", () => {
    const finding = makeFinding({
      originalText: "The party shall give reasonable notice before termination.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("Ambiguous");
  });

  it("marks termination clauses as Review", () => {
    const finding = makeFinding({
      category: "termination",
      originalText: "Either party may terminate with 30 days notice.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("Review");
  });

  it("marks IP clauses as Review", () => {
    const finding = makeFinding({
      category: "intellectual_property",
      originalText: "All inventions created during employment are assigned to the Employer.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("Review");
  });

  it("does not change attention for unmatched findings", () => {
    const finding = makeFinding({
      category: "payment",
      originalText: "Employee shall receive a salary of $80,000 per year.",
    });
    const [result] = applyAttention([finding]);
    expect(result.attention).toBe("Review");
  });

  it("missingInformationFindings flags absent governing law", () => {
    const missing = missingInformationFindings("doc1", "No jurisdictional clause here.");
    expect(missing[0]?.attention).toBe("Missing Information");
    expect(missing[0]?.title).toMatch(/governing law/i);
  });

  it("missingInformationFindings returns empty when governing law is present", () => {
    const missing = missingInformationFindings(
      "doc1",
      "This Agreement shall be governed by the laws of California.",
    );
    expect(missing).toEqual([]);
  });
});

// ── diffEngine ──────────────────────────────────────────────────────────────

describe("diffDocuments — all hunk kinds", () => {
  it("returns unchanged hunks for identical documents", () => {
    const text = "Section 1\nThis is the first clause.\n\nSection 2\nThis is the second.";
    const hunks = diffDocuments(text, text);
    expect(hunks.every((h) => h.kind === "unchanged")).toBe(true);
  });

  it("detects an added block", () => {
    const original = "Section 1\nOriginal clause.";
    const updated =
      "Section 1\nOriginal clause.\n\nSection 2\nThis is brand new.";
    const hunks = diffDocuments(original, updated);
    expect(hunks.some((h) => h.kind === "added")).toBe(true);
  });

  it("detects a removed block", () => {
    const original =
      "Section 1\nFirst clause.\n\nSection 2\nRemoved clause.";
    const updated = "Section 1\nFirst clause.";
    const hunks = diffDocuments(original, updated);
    expect(hunks.some((h) => h.kind === "removed")).toBe(true);
  });

  it("detects a changed block when headings match but body differs", () => {
    const original = "Section 1\nEmployee may terminate with 90 days notice.";
    const updated = "Section 1\nEmployee may terminate with 30 days notice.";
    const hunks = diffDocuments(original, updated);
    const changed = hunks.find((h) => h.kind === "changed");
    expect(changed).toBeDefined();
  });

  it("returns empty array for two empty documents", () => {
    expect(diffDocuments("", "")).toEqual([]);
  });

  it("every hunk has an id and kind", () => {
    const hunks = diffDocuments(
      "Section 1\nFirst.\n\nSection 2\nSecond.",
      "Section 1\nModified.\n\nSection 3\nNew block.",
    );
    for (const hunk of hunks) {
      expect(hunk.id).toBeTruthy();
      expect(["added", "removed", "changed", "unchanged"]).toContain(hunk.kind);
    }
  });
});

// ── retrievalEngine ─────────────────────────────────────────────────────────

describe("retrieveChunks", () => {
  const chunks: DocumentChunk[] = [
    makeChunk("c1", "The employee shall receive a salary of eighty thousand.", "Payment"),
    makeChunk("c2", "Either party may terminate with 90 days written notice.", "Termination"),
    makeChunk("c3", "All inventions during employment are assigned to the employer.", "IP"),
    makeChunk("c4", "The employee agrees to maintain strict confidentiality.", "Confidentiality"),
  ];

  it("returns chunks that match query terms", () => {
    const result = retrieveChunks(chunks, "salary payment");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe("c1");
  });

  it("returns chunks matching termination query", () => {
    const result = retrieveChunks(chunks, "terminate notice period");
    expect(result.some((c) => c.id === "c2")).toBe(true);
  });

  it("returns empty array when no chunks match", () => {
    const result = retrieveChunks(chunks, "intergalactic warp drive clause xyz");
    expect(result).toEqual([]);
  });

  it("returns top chunks (without filter) when query is blank", () => {
    const result = retrieveChunks(chunks, "");
    expect(result.length).toBeGreaterThan(0);
  });

  it("respects the limit parameter", () => {
    const result = retrieveChunks(chunks, "employee", 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("gives section-name matches a scoring boost", () => {
    const result = retrieveChunks(chunks, "Termination");
    expect(result[0].id).toBe("c2");
  });
});

// ── checklistEngine ─────────────────────────────────────────────────────────

describe("generateChecklist", () => {
  it("always includes the 'Read the Document Brief' item", () => {
    const checklist = generateChecklist([], [], []);
    expect(checklist.some((i) => i.id === "prep-read-brief")).toBe(true);
  });

  it("always includes the 'gather related documents' item", () => {
    const checklist = generateChecklist([], [], []);
    expect(checklist.some((i) => i.id === "prep-gather")).toBe(true);
  });

  it("generates items from dates", () => {
    const dates = [
      {
        label: "Notice period",
        value: "90 days",
        evidence: { documentId: "d", chunkId: "c", section: null, quote: "..." },
      },
    ];
    const checklist = generateChecklist([], dates, []);
    expect(checklist.some((i) => i.title.includes("Confirm"))).toBe(true);
  });

  it("generates items from high-attention findings", () => {
    const findings = [
      makeFinding({
        attention: "High Attention",
        attentionReason: "Uncapped liability clause.",
      }),
    ];
    const checklist = generateChecklist(findings, [], []);
    expect(checklist.some((i) => i.title.includes("Review"))).toBe(true);
  });

  it("generates items from questions", () => {
    const checklist = generateChecklist([], [], ["Should I ask about the notice period?"]);
    expect(checklist.some((i) => i.title === "Prepare a lawyer question")).toBe(true);
  });

  it("caps date items at 4", () => {
    const dates = Array.from({ length: 10 }, (_, i) => ({
      label: `Date ${i}`,
      value: `2025-0${(i % 9) + 1}-01`,
      evidence: { documentId: "d", chunkId: "c", section: null, quote: "..." },
    }));
    const checklist = generateChecklist([], dates, []);
    const dateItems = checklist.filter((i) => i.title.startsWith("Confirm"));
    expect(dateItems.length).toBeLessThanOrEqual(4);
  });

  it("all items have done:false initially", () => {
    const findings = [makeFinding({ attention: "High Attention" })];
    const checklist = generateChecklist(findings, [], ["Ask about this."]);
    expect(checklist.every((i) => i.done === false)).toBe(true);
  });
});

// ── questionEngine ──────────────────────────────────────────────────────────

describe("generateQuestions", () => {
  it("returns unique questions", () => {
    const findings = [
      makeFinding({ category: "termination" }),
      makeFinding({ id: "f2", category: "termination" }),
    ];
    const questions = generateQuestions(findings, DEFAULT_CONTEXT);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("generates a clarification question for Ambiguous findings", () => {
    const finding = makeFinding({
      attention: "Ambiguous",
      category: "obligations",
    });
    const questions = generateQuestions([finding], DEFAULT_CONTEXT);
    expect(questions[0]).toMatch(/clarify/i);
  });

  it("generates a termination-specific question", () => {
    const finding = makeFinding({ category: "termination" });
    const questions = generateQuestions([finding], DEFAULT_CONTEXT);
    expect(questions[0]).toMatch(/notice period|terminat/i);
  });

  it("generates a restrictions-specific question", () => {
    const finding = makeFinding({ category: "restrictions" });
    const questions = generateQuestions([finding], DEFAULT_CONTEXT);
    expect(questions[0]).toMatch(/restriction/i);
  });

  it("returns empty array for no findings", () => {
    expect(generateQuestions([], DEFAULT_CONTEXT)).toEqual([]);
  });

  it("uses goal-specific language for compare_versions goal", () => {
    const ctx = { ...DEFAULT_CONTEXT, goal: "compare_versions" as const };
    const finding = makeFinding({ attention: "Ambiguous" });
    const questions = generateQuestions([finding], ctx);
    expect(questions[0]).toMatch(/revised version/i);
  });
});

// ── clauseClassifyEngine ────────────────────────────────────────────────────

describe("classifyClauses", () => {
  it("classifies termination text", () => {
    const parsed = parseDocumentFromText({
      fileName: "t.txt",
      text: "Section 9 Termination\n\nEither party may terminate this agreement with 90 days written notice.",
      sourceKind: "sample",
    });
    const findings = classifyClauses(parsed.id, parsed.chunks);
    expect(findings.some((f) => f.category === "termination")).toBe(true);
  });

  it("classifies payment text", () => {
    const parsed = parseDocumentFromText({
      fileName: "t.txt",
      text: "Section 3 Compensation\n\nEmployee shall receive a salary of $80,000 per year.",
      sourceKind: "sample",
    });
    const findings = classifyClauses(parsed.id, parsed.chunks);
    expect(findings.some((f) => f.category === "payment" || f.category === "obligations")).toBe(true);
  });

  it("returns unique findings per section (collapsed)", () => {
    const parsed = parseDocumentFromText({
      fileName: "t.txt",
      text: SAMPLE_EMPLOYMENT_V1,
      sourceKind: "sample",
    });
    const findings = classifyClauses(parsed.id, parsed.chunks);
    const seen = new Set(findings.map((f) => `${f.title}:${f.category}`));
    expect(seen.size).toBe(findings.length);
  });
});

// ── pipeline integration ────────────────────────────────────────────────────

describe("parseDocumentFromText + buildDocumentBrief integration", () => {
  it("fully processes the sample employment agreement", () => {
    const parsed = parseDocumentFromText({
      fileName: "emp.txt",
      text: SAMPLE_EMPLOYMENT_V1,
      sourceKind: "sample",
    });
    expect(parsed.documentTypeGuess).toContain("Employment");
    expect(parsed.chunks.length).toBeGreaterThan(0);
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.id).toBeTruthy();
  });

  it("fully processes the sample lease", () => {
    const parsed = parseDocumentFromText({
      fileName: "lease.txt",
      text: SAMPLE_LEASE,
      sourceKind: "sample",
    });
    expect(parsed.documentTypeGuess).toContain("Lease");
    expect(parsed.chunks.length).toBeGreaterThan(0);
  });

  it("handles a completely empty document without throwing", () => {
    expect(() =>
      parseDocumentFromText({
        fileName: "empty.txt",
        text: "",
        sourceKind: "upload",
      }),
    ).not.toThrow();
    const parsed = parseDocumentFromText({
      fileName: "empty.txt",
      text: "",
      sourceKind: "upload",
    });
    expect(parsed.parties).toEqual([]);
    expect(parsed.dates).toEqual([]);
    // Engine creates at most 1 structural chunk for empty input
    expect(parsed.chunks.length).toBeLessThanOrEqual(1);
  });

  it("handles a single-line document", () => {
    const parsed = parseDocumentFromText({
      fileName: "tiny.txt",
      text: "This is a basic agreement.",
      sourceKind: "upload",
    });
    expect(parsed).toBeDefined();
    expect(parsed.chunks.length).toBeGreaterThanOrEqual(0);
  });
});
