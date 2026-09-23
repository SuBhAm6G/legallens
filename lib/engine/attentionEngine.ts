import type { AttentionLabel, ClauseFinding } from "@/lib/types";

interface AttentionRule {
  label: AttentionLabel;
  reason: string;
  test: (finding: ClauseFinding) => boolean;
}

const RULES: AttentionRule[] = [
  {
    label: "High Attention",
    reason: "A post-employment work restriction appears in the document.",
    test: (finding) =>
      finding.category === "restrictions" && /non-compete|shall not work/i.test(finding.originalText),
  },
  {
    label: "High Attention",
    reason: "Liability language does not state a numeric cap.",
    test: (finding) =>
      finding.category === "liability" && !/cap|limited to|not exceed/i.test(finding.originalText),
  },
  {
    label: "High Attention",
    reason: "Indemnity appears one-sided.",
    test: (finding) =>
      finding.category === "indemnity" &&
      /employee shall indemnify/i.test(finding.originalText) &&
      !/employer shall indemnify/i.test(finding.originalText),
  },
  {
    label: "Ambiguous",
    reason: "The text uses undefined or open-ended wording.",
    test: (finding) =>
      /reasonable|not (clearly )?state|not specified|not define/i.test(finding.originalText),
  },
  {
    label: "Review",
    reason: "Termination and notice terms affect how the relationship can end.",
    test: (finding) => finding.category === "termination",
  },
  {
    label: "Review",
    reason: "Intellectual property assignment may be broad.",
    test: (finding) => finding.category === "intellectual_property",
  },
];

export function applyAttention(findings: ClauseFinding[]): ClauseFinding[] {
  return findings.map((finding) => {
    const match = RULES.find((rule) => rule.test(finding));
    if (!match) {
      return finding;
    }
    return {
      ...finding,
      attention: match.label,
      attentionReason: match.reason,
    };
  });
}

export function missingInformationFindings(
  documentId: string,
  text: string,
): ClauseFinding[] {
  const missing: ClauseFinding[] = [];
  if (!/governed by the laws of/i.test(text) && !/governing law/i.test(text)) {
    missing.push({
      id: `${documentId}-missing-governing-law`,
      category: "other",
      title: "Governing law",
      originalText: "No governing-law clause was detected.",
      affectedParty: null,
      evidence: {
        documentId,
        chunkId: "none",
        section: null,
        quote: "No governing-law clause was detected.",
      },
      attention: "Missing Information",
      attentionReason: "A governing law clause was not found in the provided text.",
    });
  }
  return missing;
}
