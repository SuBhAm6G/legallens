"use client";

import { useMemo, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { useSession } from "@/components/SessionProvider";
import { diffDocuments } from "@/lib/engine/diffEngine";
import type { DiffHunk } from "@/lib/types";

interface DiffExplanation {
  hunkId: string;
  meaning: string;
  practicalSignificance: string;
}

export function CompareView() {
  const { document, documentB, context } = useSession();
  const hunks = useMemo(() => {
    if (!document || !documentB) {
      return [];
    }
    return diffDocuments(document.text, documentB.text);
  }, [document, documentB]);
  const [explanations, setExplanations] = useState<DiffExplanation[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function explain() {
    const material = hunks.filter((hunk) => hunk.kind !== "unchanged").slice(0, 8);
    setStatus("Explaining material changes…");
    try {
      const response = await fetch("/api/compare-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hunks: material, context }),
      });
      const payload: unknown = await response.json();
      if (
        response.ok &&
        typeof payload === "object" &&
        payload &&
        "explanations" in payload &&
        Array.isArray(payload.explanations)
      ) {
        setExplanations(payload.explanations as DiffExplanation[]);
        setStatus("Semantic explanations are based on the detected text changes.");
      } else {
        setStatus("Deterministic diff is shown. Semantic explanation is unavailable.");
      }
    } catch {
      setStatus("Deterministic diff is shown. Semantic explanation is unavailable.");
    }
  }

  const counts = countKinds(hunks);

  return (
    <div className="space-y-4">
      <FileUpload target="secondary" />
      {!document ? (
        <p className="text-sm text-stone-700">Load Document A on the Documents page first.</p>
      ) : null}
      {document && documentB ? (
        <>
          <p className="text-sm text-stone-700">
            Added {counts.added} · Removed {counts.removed} · Changed {counts.changed} ·
            Unchanged {counts.unchanged}
          </p>
          <button
            type="button"
            className="rounded-md bg-navy px-3 py-2 text-sm text-white"
            onClick={() => void explain()}
          >
            Explain material changes
          </button>
          {status ? (
            <p className="text-sm text-stone-600" aria-live="polite">
              {status}
            </p>
          ) : null}
          <ul className="space-y-3">
            {hunks
              .filter((hunk) => hunk.kind !== "unchanged")
              .map((hunk) => (
                <li key={hunk.id} className="rounded-lg border border-stone-300 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy">
                    {hunk.kind}
                  </p>
                  <DiffBody hunk={hunk} />
                  <Explanation hunkId={hunk.id} items={explanations} />
                </li>
              ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function DiffBody({ hunk }: { hunk: DiffHunk }) {
  if (hunk.kind === "added") {
    return <p className="mt-2 whitespace-pre-wrap text-sm">{hunk.newText}</p>;
  }
  if (hunk.kind === "removed") {
    return <p className="mt-2 whitespace-pre-wrap text-sm">{hunk.originalText}</p>;
  }
  return (
    <div className="mt-2 grid gap-3 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium">Original</h3>
        <p className="whitespace-pre-wrap text-sm text-stone-800">{hunk.originalText}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium">New</h3>
        <p className="whitespace-pre-wrap text-sm text-stone-800">{hunk.newText}</p>
      </div>
    </div>
  );
}

function Explanation({
  hunkId,
  items,
}: {
  hunkId: string;
  items: DiffExplanation[];
}) {
  const match = items.find((item) => item.hunkId === hunkId);
  if (!match) {
    return null;
  }
  return (
    <div className="mt-3 rounded-md bg-stone-100 p-3 text-sm">
      <p>
        <strong>Meaning:</strong> {match.meaning}
      </p>
      <p className="mt-1">
        <strong>Practical significance:</strong> {match.practicalSignificance}
      </p>
    </div>
  );
}

function countKinds(hunks: DiffHunk[]) {
  return {
    added: hunks.filter((hunk) => hunk.kind === "added").length,
    removed: hunks.filter((hunk) => hunk.kind === "removed").length,
    changed: hunks.filter((hunk) => hunk.kind === "changed").length,
    unchanged: hunks.filter((hunk) => hunk.kind === "unchanged").length,
  };
}
