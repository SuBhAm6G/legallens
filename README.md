# LegalLens

> Understand the fine print. Know what to ask next.

LegalLens is a context-aware legal document copilot for non-lawyers. It turns an uploaded agreement into a **Document Brief**, lets you inspect clauses with source quotes, answers questions from the document, compares versions with a deterministic diff, and prepares a checklist for a conversation with a legal professional.

**LegalLens provides informational assistance, not professional legal advice.**

## Problem statement

Legal information is hard to navigate without help. This project helps people **understand**, **compare**, and **navigate** documents: simplify language, highlight obligations and uncertainties, answer questions from the provided text, and prepare next steps — without replacing a lawyer.

## Chosen persona

A **non-lawyer** reviewing an important document before deciding what to do next (employee, tenant, customer, freelancer, or small-business owner).

## Why LegalLens is different

It is not “upload PDF → one summary.” After processing, the product already shows type, parties, dates, obligations, attention areas, and questions. Every important claim is tied to document evidence. Comparison is calculated in code; Gemini only explains meaning.

## Core workflow

1. Set role and goal.
2. Load a sample or upload `.txt` / `.md` / `.pdf`.
3. Read the Document Brief.
4. Open a clause (plain English + source + uncertainty + question).
5. Ask a grounded question.
6. Compare a second version.
7. Generate a lawyer preparation checklist.

## AI architecture

- **Deterministic engines** parse, chunk, classify, diff, label attention, retrieve evidence, and generate checklist/question templates.
- **Gemini 2.5 Flash** (Vercel AI SDK, server-only) writes plain-English explanations and grounded answers.
- **Zod** validates model output. Invalid JSON is dropped; the UI keeps the engine-based brief.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security and privacy

API keys never ship to the browser. Documents stay in **session memory**. Uploaded files are treated as untrusted data. See [docs/SECURITY.md](docs/SECURITY.md).

## Accessibility and testing

See [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) and [docs/TESTING.md](docs/TESTING.md).

## Assumptions

- Users provide their own documents or the synthetic samples in this repo.
- Native-text PDFs extract; scanned image PDFs will fail with a clear error.
- Jurisdiction is used only if the user types it. The app does not infer personal facts.
- Model providers that receive document text have their own retention policies.

## Limitations

- Not a lawyer and not jurisdiction-specific legal research.
- English-first samples and prompts.
- No document database; refresh clears the session.
- Attention labels are heuristic, not legal conclusions.

## Setup

```bash
npm install
cp .env.example .env.local
# set GOOGLE_GENERATIVE_AI_API_KEY
npm run dev
```

The Document Brief works without a key. Explanations and grounded Q&A require Gemini.

```bash
npm run type-check
npm run lint
npm run test
npm run audit:repo
```

Optional: `npx playwright install chromium` then `npm run test:e2e`.

## Repository structure

```
app/            pages and API routes
components/     accessible workspace UI
lib/engine/     deterministic engines
lib/ai/         Gemini + Zod
lib/samples/    synthetic agreements
tests/          Vitest + Playwright
docs/           architecture and rubric notes
scripts/audit.mjs
```

## How this solves the problem statement

See [docs/ALIGNMENT.md](docs/ALIGNMENT.md).
