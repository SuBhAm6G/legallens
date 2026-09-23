# Testing

## WHAT

Vitest covers ingest, extraction, structure, classification, evidence, diffs, attention, retrieval misses, checklist/questions, prompt wrapping, safety language, and malformed Zod output. Playwright covers the sample demo path when browsers are installed.

## WHY

Testing is a scored category. Tests target behavior, not a fabricated coverage percentage.

## HOW

```bash
npm run test
npm run test:e2e
```

## EVIDENCE

Files under `tests/`. Run `npm run test` for the current passing count. Do not trust badges that are not generated from CI.
