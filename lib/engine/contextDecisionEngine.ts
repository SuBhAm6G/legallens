import type { ClauseFinding, UserContext } from "@/lib/types";

const ROLE_PRIORITY: Record<UserContext["role"], ClauseFinding["category"][]> = {
  employee: [
    "termination",
    "restrictions",
    "intellectual_property",
    "confidentiality",
    "payment",
    "liability",
  ],
  tenant: ["termination", "payment", "renewal", "deadlines", "obligations"],
  customer: ["termination", "liability", "payment", "dispute_resolution"],
  freelancer: ["payment", "intellectual_property", "termination", "liability"],
  small_business_owner: [
    "indemnity",
    "liability",
    "payment",
    "termination",
    "dispute_resolution",
  ],
  other: ["termination", "payment", "liability"],
};

export function prioritizeFindings(
  findings: ClauseFinding[],
  context: UserContext,
): ClauseFinding[] {
  const order = ROLE_PRIORITY[context.role];
  return [...findings].sort((a, b) => {
    const attentionRank = rankAttention(a.attention) - rankAttention(b.attention);
    if (attentionRank !== 0) {
      return attentionRank;
    }
    return indexOf(order, a.category) - indexOf(order, b.category);
  });
}

function rankAttention(label: ClauseFinding["attention"]): number {
  switch (label) {
    case "High Attention":
      return 0;
    case "Ambiguous":
      return 1;
    case "Missing Information":
      return 2;
    case "Changed Significantly":
      return 3;
    default:
      return 4;
  }
}

function indexOf(
  order: ClauseFinding["category"][],
  category: ClauseFinding["category"],
): number {
  const index = order.indexOf(category);
  return index === -1 ? 50 : index;
}
