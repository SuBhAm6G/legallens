import type { ChecklistItem, ClauseFinding, ExtractedDate } from "@/lib/types";
import { stableId } from "@/lib/utils";

export function generateChecklist(
  findings: ClauseFinding[],
  dates: ExtractedDate[],
  questions: string[],
): ChecklistItem[] {
  const items: ChecklistItem[] = [
    {
      id: "prep-read-brief",
      title: "Read the Document Brief",
      detail: "Review obligations, dates, and attention areas before asking questions.",
      done: false,
      sourceFindingId: null,
    },
  ];

  for (const date of dates.slice(0, 4)) {
    items.push({
      id: stableId("check-date", date.value),
      title: `Confirm ${date.label.toLowerCase()}: ${date.value}`,
      detail: "Check the source quote and calendar this date if it still applies.",
      done: false,
      sourceFindingId: null,
    });
  }

  for (const finding of findings.filter((item) => item.attention !== "Review").slice(0, 5)) {
    items.push({
      id: stableId("check-find", finding.id),
      title: `Review: ${finding.title}`,
      detail: finding.attentionReason,
      done: false,
      sourceFindingId: finding.id,
    });
  }

  for (const question of questions.slice(0, 4)) {
    items.push({
      id: stableId("check-q", question),
      title: "Prepare a lawyer question",
      detail: question,
      done: false,
      sourceFindingId: null,
    });
  }

  items.push({
    id: "prep-gather",
    title: "Gather related documents",
    detail:
      "Collect offer letters, prior versions, policies, or emails referenced by this agreement.",
    done: false,
    sourceFindingId: null,
  });

  return items;
}
