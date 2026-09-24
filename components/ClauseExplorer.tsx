"use client";

import { useEffect, useState, memo } from "react";
import { fallbackClauseExplanation } from "@/lib/engine/fallbackExplain";
import { useSession } from "@/components/SessionProvider";
import { clauseExplanationSchema } from "@/lib/schemas";
import type { ClauseExplanation, ClauseFinding } from "@/lib/types";

export function ClauseExplorer({
  finding,
  onClose,
}: {
  finding: ClauseFinding;
  onClose: () => void;
}) {
  const { context } = useSession();
  const [explanation, setExplanation] = useState<ClauseExplanation | null>(null);
  const [status, setStatus] = useState("Requesting a plain-English explanation…");
  const displayed = explanation ?? fallbackClauseExplanation(finding);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/explain-clause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clauseText: finding.originalText,
            section: finding.evidence.section,
            category: finding.category,
            context,
          }),
        });
        const payload: unknown = await response.json();
        if (!response.ok || cancelled) {
          setStatus("Using the deterministic explanation. AI wording is unavailable.");
          return;
        }
        if (typeof payload === "object" && payload && "explanation" in payload) {
          const parsed = clauseExplanationSchema.safeParse(payload.explanation);
          if (parsed.success) {
            setExplanation(parsed.data);
            setStatus("Explanation generated from the selected clause.");
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("Using the deterministic explanation.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [context, finding]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clause-title"
      className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <h2 id="clause-title" className="text-xl font-semibold text-stone-900">
            {finding.title}
          </h2>
          <button
            type="button"
            className="rounded-md border border-stone-400 px-3 py-1 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <p className="mt-1 text-xs text-stone-600" aria-live="polite">
          {status}
        </p>
        <Block kicker="DOCUMENT FACT" title="What the document says">
          {finding.originalText}
        </Block>
        <Block kicker="EXPLANATION" title="In plain English">
          {displayed.plainEnglish}
        </Block>
        <Block kicker="INFERENCE" title="Why it matters / obligation">
          {`${displayed.obligation} ${displayed.conditions}`}
        </Block>
        <Block kicker="SOURCE" title="Source">
          {`${finding.evidence.section ?? "Document"} · ${finding.evidence.quote}`}
        </Block>
        <Block kicker="UNCERTAINTY" title="What is unclear">
          {displayed.uncertainty}
        </Block>
        <Block kicker="QUESTION" title="Question to consider">
          {displayed.question}
        </Block>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-amber-900">
          Attention: {finding.attention} — {finding.attentionReason}
        </p>
      </div>
    </div>
  );
}

const Block = memo(function Block({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: string;
}) {
  return (
    <section className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy">{kicker}</p>
      <h3 className="font-medium text-stone-900">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{children}</p>
    </section>
  );
});
