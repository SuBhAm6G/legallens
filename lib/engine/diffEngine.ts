import type { DiffHunk } from "@/lib/types";
import { stableId } from "@/lib/utils";

/**
 * Detects structural and semantic differences between two versions of a legal document.
 * Groups changes into hunks (added, removed, changed, unchanged) based on block headings.
 * 
 * @param original - The original text of the document.
 * @param updated - The updated text of the document.
 * @returns An array of diff hunks representing the changes.
 */
export function diffDocuments(original: string, updated: string): DiffHunk[] {
  const left = splitBlocks(original);
  const right = splitBlocks(updated);
  const leftSet = new Map(left.map((block) => [normalize(block), block]));
  const rightSet = new Map(right.map((block) => [normalize(block), block]));

  const hunks: DiffHunk[] = [];
  const usedRight = new Set<string>();

  for (const [key, block] of leftSet) {
    if (rightSet.has(key)) {
      hunks.push(makeHunk("unchanged", block, block));
      usedRight.add(key);
      continue;
    }
    const counterpart = findClosest(block, right, usedRight);
    if (counterpart) {
      hunks.push(makeHunk("changed", block, counterpart.text));
      usedRight.add(counterpart.key);
    } else {
      hunks.push(makeHunk("removed", block, ""));
    }
  }

  for (const [key, block] of rightSet) {
    if (usedRight.has(key) || leftSet.has(key)) {
      continue;
    }
    hunks.push(makeHunk("added", "", block));
  }

  return hunks;
}

function splitBlocks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function findClosest(
  block: string,
  candidates: string[],
  used: Set<string>,
): { key: string; text: string } | null {
  const head = heading(block);
  if (!head) {
    return null;
  }
  for (const candidate of candidates) {
    const key = normalize(candidate);
    if (used.has(key)) {
      continue;
    }
    if (heading(candidate) === head) {
      return { key, text: candidate };
    }
  }
  return null;
}

function heading(block: string): string | null {
  const match = block.match(/^(Section\s+\d+[A-Z]?|ARTICLE\s+\d+)/i);
  return match ? match[1].toLowerCase() : null;
}

function makeHunk(
  kind: DiffHunk["kind"],
  originalText: string,
  newText: string,
): DiffHunk {
  const seed = `${kind}:${originalText.slice(0, 40)}:${newText.slice(0, 40)}`;
  return {
    id: stableId("diff", seed),
    kind,
    originalText,
    newText,
    sectionHint: heading(originalText || newText),
  };
}
