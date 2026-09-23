"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { ClauseExplorer } from "@/components/ClauseExplorer";
import { categoryLabel } from "@/lib/engine/clauseClassifyEngine";
import type { ClauseFinding } from "@/lib/types";

export function DocumentBriefPanel() {
  const { brief, document } = useSession();
  const [selected, setSelected] = useState<ClauseFinding | null>(null);

  if (!brief || !document) {
    return (
      <section className="rounded-lg border border-dashed border-stone-400 p-6 text-stone-700">
        <h2 className="text-lg font-semibold text-stone-900">Document Brief</h2>
        <p className="mt-2 text-sm">
          Load a sample agreement or upload a document to see type, parties, dates,
          obligations, and attention areas immediately.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
        <h2 className="text-xl font-semibold text-stone-900">Document Brief</h2>
        <p className="mt-1 text-sm text-stone-600">{document.fileName}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Document type" value={brief.documentType} />
          <Stat label="Purpose" value={brief.purpose} />
          <Stat label="Key obligations" value={String(brief.obligations.length)} />
          <Stat label="Important dates" value={String(brief.dates.length)} />
          <Stat label="Attention areas" value={String(brief.attentionAreas.length)} />
          <Stat label="Ambiguities" value={String(brief.ambiguities.length)} />
        </dl>
        <p className="mt-4 text-sm text-stone-700">
          Parties: {brief.parties.length ? brief.parties.join(", ") : "Not clearly named"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-md bg-navy px-3 py-2 text-sm text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-navy/90 hover:shadow-md" href="/assistant">
            Ask this document
          </Link>
          <Link className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:bg-stone-50 hover:shadow-md" href="/compare">
            Compare version
          </Link>
          <Link className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:bg-stone-50 hover:shadow-md" href="/checklist">
            Prepare for lawyer
          </Link>
        </div>
      </div>
      <FindingGroup
        title="Important dates"
        items={brief.dates.map((date) => `${date.label}: ${date.value}`)}
      />
      <ClauseGroup
        title="Key obligations and clauses"
        findings={brief.clauses}
        onSelect={setSelected}
      />
      <ClauseGroup title="Attention areas" findings={brief.attentionAreas} onSelect={setSelected} />
      <ClauseGroup
        title="Potential ambiguities"
        findings={brief.ambiguities}
        onSelect={setSelected}
      />
      <FindingGroup title="Questions to consider" items={brief.questions} />
      {selected ? (
        <ClauseExplorer key={selected.id} finding={selected} onClose={() => setSelected(null)} />
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-100 p-3">
      <dt className="text-xs uppercase tracking-wide text-stone-600">{label}</dt>
      <dd className="text-lg font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function FindingGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <h3 className="font-semibold text-stone-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">None detected in the provided text.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-800">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ClauseGroup({
  title,
  findings,
  onSelect,
}: {
  title: string;
  findings: ClauseFinding[];
  onSelect: (finding: ClauseFinding) => void;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <h3 className="font-semibold text-stone-900">{title}</h3>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">None detected.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {findings.map((finding) => (
            <li key={finding.id}>
              <button
                type="button"
                className="w-full rounded-md border border-stone-200 bg-stone-50/50 px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-sm"
                onClick={() => onSelect(finding)}
              >
                <span className="block font-medium text-stone-900">{finding.title}</span>
                <span className="block text-xs text-stone-600">
                  {categoryLabel(finding.category)} · {finding.attention}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
