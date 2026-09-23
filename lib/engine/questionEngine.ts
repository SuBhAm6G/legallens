import type { ClauseFinding, UserContext } from "@/lib/types";
import { categoryLabel } from "@/lib/engine/clauseClassifyEngine";

export function generateQuestions(
  findings: ClauseFinding[],
  context: UserContext,
): string[] {
  const questions = findings.slice(0, 8).map((finding) => {
    const topic = categoryLabel(finding.category);
    if (finding.attention === "Ambiguous" || finding.attention === "Missing Information") {
      return `Should I ask a legal professional to clarify the ${topic} language before I ${goalVerb(context)}?`;
    }
    if (finding.category === "termination") {
      return "Should I ask a legal professional whether the notice period can be shortened or waived in writing?";
    }
    if (finding.category === "restrictions") {
      return "Should I ask a legal professional how broad this post-relationship restriction is, and whether it is typical for this role?";
    }
    return `What would a legal professional want me to confirm about the ${topic} clause?`;
  });
  return unique(questions);
}

function goalVerb(context: UserContext): string {
  if (context.goal === "understand_before_signing") {
    return "sign";
  }
  if (context.goal === "compare_versions") {
    return "rely on the revised version";
  }
  return "take a next step";
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
