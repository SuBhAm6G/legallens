"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_CONTEXT, buildDocumentBrief, parseDocumentFromText } from "@/lib/engine/pipeline";
import type {
  ChecklistItem,
  DocumentBrief,
  ParsedDocument,
  UserContext,
} from "@/lib/types";

interface SessionValue {
  context: UserContext;
  setContext: (context: UserContext) => void;
  document: ParsedDocument | null;
  documentB: ParsedDocument | null;
  brief: DocumentBrief | null;
  checklist: ChecklistItem[];
  loadText: (fileName: string, text: string, sourceKind: ParsedDocument["sourceKind"]) => void;
  loadSecondText: (fileName: string, text: string) => void;
  toggleChecklist: (id: string) => void;
  clearAll: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<UserContext>(DEFAULT_CONTEXT);
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [documentB, setDocumentB] = useState<ParsedDocument | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const built = useMemo(() => {
    if (!document) {
      return null;
    }
    return buildDocumentBrief(document, context);
  }, [context, document]);

  const checklist = useMemo(() => {
    if (!built) {
      return [];
    }
    const done = new Set(doneIds);
    return built.checklist.map((item) => ({ ...item, done: done.has(item.id) }));
  }, [built, doneIds]);

  const value = useMemo<SessionValue>(
    () => ({
      context,
      setContext,
      document,
      documentB,
      brief: built?.brief ?? null,
      checklist,
      loadText: (fileName, text, sourceKind) => {
        setDocument(parseDocumentFromText({ fileName, text, sourceKind }));
        setDoneIds([]);
      },
      loadSecondText: (fileName, text) => {
        setDocumentB(parseDocumentFromText({ fileName, text, sourceKind: "upload" }));
      },
      toggleChecklist: (id) => {
        setDoneIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
      },
      clearAll: () => {
        setDocument(null);
        setDocumentB(null);
        setDoneIds([]);
      },
    }),
    [built, checklist, context, document, documentB],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return value;
}
