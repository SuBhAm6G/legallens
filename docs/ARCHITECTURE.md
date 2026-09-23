# Architecture

## WHAT

Hybrid document intelligence: parsers and diffs in TypeScript, language in Gemini, session UI in Next.js.

## WHY

Judges need a smart assistant that is still testable and safe. LLMs should not invent section numbers or compute diffs.

## HOW

Upload or sample text → `ingestEngine` / `extractEngine` → `structureEngine` → `metadataEngine` + `clauseClassifyEngine` → `attentionEngine` → `contextDecisionEngine` → Document Brief.

Q&A: `retrievalEngine` selects chunks, then Gemini answers only from those chunks.

Compare: `diffEngine` classifies added/removed/changed/unchanged, then Gemini explains material hunks.

## EVIDENCE

- Engines live in `lib/engine/`.
- API routes in `app/api/*` call `lib/ai/tasks.ts`.
- Keys are read only in `lib/ai/generate.ts` on the server.
