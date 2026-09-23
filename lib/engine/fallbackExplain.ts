import type { ClauseExplanation, ClauseFinding } from "@/lib/types";

export function fallbackClauseExplanation(finding: ClauseFinding): ClauseExplanation {
  return {
    plainEnglish: `This part of the document discusses ${finding.title.toLowerCase()}. ${finding.originalText.slice(0, 220)}`,
    obligation: finding.affectedParty
      ? `The wording appears to affect ${finding.affectedParty}.`
      : "The affected party is not clearly isolated in this excerpt.",
    conditions: "See the original text for any notice, time, or cause conditions.",
    uncertainty: finding.attentionReason,
    question: `Consider asking a legal professional about the ${finding.title.toLowerCase()} language before you act.`,
  };
}
