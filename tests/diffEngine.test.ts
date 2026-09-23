import { describe, expect, it } from "vitest";
import { diffDocuments } from "@/lib/engine/diffEngine";
import { SAMPLE_EMPLOYMENT_V1, SAMPLE_EMPLOYMENT_V2 } from "@/lib/samples/documents";

describe("diffEngine", () => {
  it("detects a changed termination clause", () => {
    const hunks = diffDocuments(SAMPLE_EMPLOYMENT_V1, SAMPLE_EMPLOYMENT_V2);
    const changed = hunks.find(
      (hunk) => hunk.kind === "changed" && /ninety|thirty/i.test(hunk.originalText + hunk.newText),
    );
    expect(changed).toBeTruthy();
    expect(changed?.originalText).toMatch(/ninety/i);
    expect(changed?.newText).toMatch(/thirty/i);
  });

  it("detects an added restriction clause", () => {
    const hunks = diffDocuments(SAMPLE_EMPLOYMENT_V1, SAMPLE_EMPLOYMENT_V2);
    expect(hunks.some((hunk) => hunk.kind === "added" && /non-compete/i.test(hunk.newText))).toBe(
      true,
    );
  });

  it("detects a removed clause", () => {
    const hunks = diffDocuments(SAMPLE_EMPLOYMENT_V2, SAMPLE_EMPLOYMENT_V1);
    expect(
      hunks.some((hunk) => hunk.kind === "removed" && /non-compete/i.test(hunk.originalText)),
    ).toBe(true);
  });
});
