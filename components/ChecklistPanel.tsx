"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";

export function ChecklistPanel() {
  const { document, brief, checklist, toggleChecklist, context } = useSession();
  const [pack, setPack] = useState<{
    summary: string;
    informationToGather: string[];
    inconsistencies: string[];
  } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function generatePack() {
    if (!document || !brief) {
      return;
    }
    setStatus("Building the lawyer preparation pack…");
    try {
      const response = await fetch("/api/prep-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          text: document.text,
          context,
          findingTitles: brief.clauses.map((item) => item.title),
        }),
      });
      const payload: unknown = await response.json();
      if (response.ok && payload && typeof payload === "object") {
        setPack(payload as typeof pack);
        setStatus("Preparation pack generated from the document findings.");
      } else {
        setStatus("Showing the deterministic checklist only.");
      }
    } catch {
      setStatus("Showing the deterministic checklist only.");
    }
  }

  if (!brief) {
    return <p className="text-sm text-stone-700">Load a document to generate a preparation pack.</p>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="text-lg font-semibold">Lawyer preparation pack</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>Document summary: {brief.purpose}</li>
          <li>Important clauses: {brief.clauses.length}</li>
          <li>Key obligations: {brief.obligations.length}</li>
          <li>Deadlines: {brief.dates.map((date) => date.value).join(", ") || "none detected"}</li>
          <li>Ambiguities: {brief.ambiguities.length}</li>
          <li>Attention areas: {brief.attentionAreas.length}</li>
          <li>Questions to ask a lawyer: {brief.questions.length}</li>
          <li>Information to gather: related policies, prior versions, and your own notes</li>
        </ol>
        <button
          type="button"
          className="mt-4 rounded-md bg-navy px-3 py-2 text-sm text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-navy/90 hover:shadow-md"
          onClick={() => void generatePack()}
        >
          Generate narrative pack
        </button>
        {status ? (
          <p className="mt-2 text-sm text-stone-600" aria-live="polite">
            {status}
          </p>
        ) : null}
        {pack ? (
          <div className="mt-4 space-y-2 text-sm">
            <p>{pack.summary}</p>
            <p className="font-medium">Possible inconsistencies</p>
            <ul className="list-disc pl-5">
              {pack.inconsistencies.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="font-medium">Information you may want to gather</p>
            <ul className="list-disc pl-5">
              {pack.informationToGather.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="text-lg font-semibold">Checklist</h2>
        <ul className="mt-3 space-y-2">
          {checklist.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklist(item.id)}
                />
                <span>
                  <span className="font-medium">{item.title}</span>
                  <span className="block text-stone-600">{item.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 font-medium">Questions to ask a legal professional</h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {brief.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
