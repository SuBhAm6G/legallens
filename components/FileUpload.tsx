"use client";

import { useState, type ChangeEvent } from "react";
import { validateFileInput } from "@/lib/engine/ingestEngine";
import { useSession } from "@/components/SessionProvider";
import {
  SAMPLE_EMPLOYMENT_V1,
  SAMPLE_EMPLOYMENT_V2,
  SAMPLE_LEASE,
} from "@/lib/samples/documents";

export function FileUpload({
  target = "primary",
}: {
  target?: "primary" | "secondary";
}) {
  const { loadText, loadSecondText } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const invalid = validateFileInput({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (invalid) {
      setError(invalid.message);
      return;
    }
    setError(null);
    setStatus("Reading document…");
    try {
      const text = await readFile(file);
      apply(file.name, text, "upload");
      setStatus(`Loaded ${file.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read the file.");
      setStatus(null);
    }
  }

  function apply(
    fileName: string,
    text: string,
    sourceKind: "upload" | "sample",
  ) {
    if (target === "secondary") {
      loadSecondText(fileName, text);
      return;
    }
    loadText(fileName, text, sourceKind);
  }

  return (
    <div className="rounded-lg border border-stone-300 bg-white p-4">
      <label htmlFor={`file-${target}`} className="block text-sm font-medium text-stone-800">
        {target === "primary" ? "Upload a document" : "Upload Document B"}
      </label>
      <input
        id={`file-${target}`}
        type="file"
        accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
        className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={onFile}
      />
      {target === "primary" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-stone-400 px-3 py-2 text-sm hover:bg-stone-100"
            onClick={() => apply("employment-v1.txt", SAMPLE_EMPLOYMENT_V1, "sample")}
          >
            Load sample employment agreement
          </button>
          <button
            type="button"
            className="rounded-md border border-stone-400 px-3 py-2 text-sm hover:bg-stone-100"
            onClick={() => apply("lease-sample.txt", SAMPLE_LEASE, "sample")}
          >
            Load sample lease
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mt-3 rounded-md border border-stone-400 px-3 py-2 text-sm hover:bg-stone-100"
          onClick={() => apply("employment-v2.txt", SAMPLE_EMPLOYMENT_V2, "sample")}
        >
          Load sample version B (30-day notice)
        </button>
      )}
      {error ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mt-2 text-sm text-stone-600" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}

async function readFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/ingest", { method: "POST", body: form });
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(errorMessage(payload));
    }
    if (
      typeof payload === "object" &&
      payload &&
      "text" in payload &&
      typeof payload.text === "string"
    ) {
      return payload.text;
    }
    throw new Error("Unexpected ingest response.");
  }
  return file.text();
}

function errorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "The file could not be processed.";
}
