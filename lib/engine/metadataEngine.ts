import type { ClauseCategory, EvidenceRef, ExtractedDate } from "@/lib/types";
import { truncate } from "@/lib/utils";

const TYPE_RULES: { type: string; pattern: RegExp }[] = [
  { type: "Employment Agreement", pattern: /employment agreement|employee shall/i },
  { type: "Residential Lease", pattern: /lease agreement|landlord|tenant/i },
  { type: "Service Agreement", pattern: /services agreement|statement of work/i },
  { type: "Vendor Agreement", pattern: /vendor|supplier agreement/i },
  { type: "Confidentiality Agreement", pattern: /non-disclosure|nda\b/i },
];

export function guessDocumentType(text: string): string {
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(text)) {
      return rule.type;
    }
  }
  return "Legal document";
}

export function extractParties(text: string): string[] {
  const parties = new Set<string>();
  const between = text.match(
    /between\s+([^,\n]+?)\s+\([^)]+\)\s+and\s+([^,\n]+?)\s+\([^)]+\)/i,
  );
  if (between) {
    parties.add(cleanParty(between[1]));
    parties.add(cleanParty(between[2]));
  }
  const labeled = [
    ...text.matchAll(
      /\b(Employer|Employee|Landlord|Tenant|Company|Client|Vendor)\b\s*(?:shall|\("|is)/gi,
    ),
  ];
  for (const match of labeled) {
    parties.add(match[1]);
  }
  return [...parties].slice(0, 6);
}

export function extractDates(
  documentId: string,
  text: string,
  chunkId: string,
): ExtractedDate[] {
  const dates: ExtractedDate[] = [];
  const longDates = [...text.matchAll(/\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/g)];
  for (const match of longDates) {
    dates.push({
      label: "Calendar date",
      value: match[1],
      evidence: evidence(documentId, chunkId, match[1], nearby(text, match[1])),
    });
  }
  const dayWindows = [
    ...text.matchAll(/\b(\d{1,3})\s+days?'?\s+(written\s+)?notice\b/gi),
  ];
  for (const match of dayWindows) {
    dates.push({
      label: "Notice period",
      value: `${match[1]} days`,
      evidence: evidence(documentId, chunkId, match[0], nearby(text, match[0])),
    });
  }
  return dedupeDates(dates).slice(0, 8);
}

export function classifyText(text: string): ClauseCategory {
  const rules: { category: ClauseCategory; pattern: RegExp }[] = [
    { category: "termination", pattern: /\bterminat/i },
    { category: "payment", pattern: /\bsalary|rent|pay(able|ment)|bonus|fee\b/i },
    { category: "liability", pattern: /\bliab/i },
    { category: "indemnity", pattern: /\bindemnif/i },
    { category: "confidentiality", pattern: /\bconfidential/i },
    {
      category: "intellectual_property",
      pattern: /\bintellectual property|inventions|assigns to\b/i,
    },
    { category: "dispute_resolution", pattern: /\barbitration|dispute\b/i },
    { category: "renewal", pattern: /\brenew/i },
    {
      category: "restrictions",
      pattern: /\bnon-compete|non-solicitation|shall not work\b/i,
    },
    { category: "privacy", pattern: /\bprivacy|personal data\b/i },
    { category: "deadlines", pattern: /\bwithin \d+ days|deadline\b/i },
    { category: "obligations", pattern: /\bshall\b/i },
  ];
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return rule.category;
    }
  }
  return "other";
}

function cleanParty(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function nearby(text: string, needle: string): string {
  const index = text.indexOf(needle);
  if (index < 0) {
    return truncate(needle, 220);
  }
  const start = Math.max(0, index - 40);
  return truncate(text.slice(start, index + needle.length + 80), 220);
}

function evidence(
  documentId: string,
  chunkId: string,
  sectionHint: string,
  quote: string,
): EvidenceRef {
  return {
    documentId,
    chunkId,
    section: sectionHint.length < 80 ? sectionHint : null,
    quote,
  };
}

function dedupeDates(dates: ExtractedDate[]): ExtractedDate[] {
  const seen = new Set<string>();
  const unique: ExtractedDate[] = [];
  for (const date of dates) {
    const key = `${date.label}:${date.value}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(date);
  }
  return unique;
}
