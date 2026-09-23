"use client";

import { useState, type FormEvent } from "react";
import { retrieveChunks } from "@/lib/engine/retrievalEngine";
import { useSession } from "@/components/SessionProvider";
import { groundedAnswerSchema } from "@/lib/schemas";
import type { DocumentChunk, GroundedAnswer } from "@/lib/types";

export function AssistantPanel() {
  const { document, context } = useSession();
  const [question, setQuestion] = useState("What happens if I terminate?");
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!document) {
      setError("Load a document on the Documents page first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          documentId: document.id,
          chunks: document.chunks.map((chunk) => ({
            id: chunk.id,
            section: chunk.section,
            text: chunk.text,
          })),
          context,
        }),
      });
      const payload: unknown = await response.json();
      const parsed = groundedAnswerSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        setAnswer(localFallback(document.chunks, question, document.id));
        setError("Showing a document-only answer because the model call was unavailable.");
        return;
      }
      setAnswer(parsed.data);
    } catch {
      setAnswer(localFallback(document.chunks, question, document.id));
      setError("Showing a document-only answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <form onSubmit={onSubmit} className="rounded-lg border border-stone-300 bg-white p-4">
        <label htmlFor="question" className="block text-sm font-medium text-stone-800">
          Ask this document
        </label>
        <textarea
          id="question"
          className="mt-2 w-full rounded-md border border-stone-400 p-3 text-sm"
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button
          type="submit"
          className="mt-3 rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Searching the document…" : "Ask"}
        </button>
      </form>
      <div aria-live="polite" className="rounded-lg border border-stone-300 bg-white p-4">
        {error ? <p className="mb-2 text-sm text-amber-900">{error}</p> : null}
        {answer ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">
              {answer.kind}
            </p>
            <p className="mt-2 text-stone-900">{answer.answer}</p>
            {answer.citations.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {answer.citations.map((citation) => (
                  <li
                    key={`${citation.chunkId}-${citation.quote}`}
                    className="rounded-md bg-stone-100 p-3 text-sm"
                  >
                    <p className="font-medium">{citation.section ?? "Document"}</p>
                    <p className="mt-1 text-stone-700">{citation.quote}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-stone-600">
            Answers are grounded in the uploaded text. The assistant will not invent statutes
            or cases.
          </p>
        )}
      </div>
    </section>
  );
}

function localFallback(
  chunks: DocumentChunk[],
  question: string,
  documentId: string,
): GroundedAnswer {
  const hits = retrieveChunks(chunks, question);
  if (hits.length === 0) {
    return {
      answer: "I couldn't find that in the provided document.",
      kind: "UNCERTAINTY",
      citations: [],
      insufficientEvidence: true,
    };
  }
  const first = hits[0];
  return {
    answer: `The document states in ${first.section ?? "the provided text"}: ${first.text.slice(0, 280)}`,
    kind: "DOCUMENT_FACT",
    citations: [
      {
        documentId,
        chunkId: first.id,
        section: first.section,
        quote: first.text.slice(0, 280),
      },
    ],
    insufficientEvidence: false,
  };
}
