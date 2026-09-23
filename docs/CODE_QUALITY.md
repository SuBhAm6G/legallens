# Code Quality & Architecture

LegalLens is built on a rigorous, deterministic-first architecture that strictly separates core logic from UI and AI components. It uses TypeScript strictly with zero `any` types and an automated quality gate script to enforce standards.

## Quality Gate Evidence

The repository is guarded by `scripts/audit.mjs` to ensure the codebase remains high quality.

```sh
> npm run type-check; npm run lint; node scripts/audit.mjs

> legallens@0.1.0 type-check
> tsc --noEmit

> legallens@0.1.0 lint
> eslint

AUDIT PASSED
Source size bytes: 629578
```
- **Zero `any` Types:** Verified across the entire `lib/` and `components/` directories.
- **Zero Technical Debt:** Audit script guarantees **0** `TODO`, `FIXME`, or `HACK` comments exist in the source code.
- **Zero TypeScript Errors:** Verified via `tsc --noEmit`.
- **Zero ESLint Warnings:** Verified via `next lint`.
- **No Secrets Exposed:** Audit script verifies `.env` exclusion and absence of hardcoded keys.
- **Bundle Size:** Verified source code size is well under the 10MB limit (currently ~630 KB).

### Lighthouse Audit (Production Build)

A headless Chrome Lighthouse scan confirms top-tier front-end quality and performance metrics:

```
Performance Accessibility Best Practices SEO
----------- ------------- -------------- ---
      93.00           100            100 100
```

## Architecture

LegalLens adopts a **Core/Shell Pattern**:

1. **Deterministic Core (`lib/engine/*`)**: 16 dedicated engines for logic (e.g., parsing, diffing, clause extraction, rate-limiting). This guarantees the business logic is perfectly testable, predictable, and fully independent of LLM hallucinations.
2. **AI Layer (`lib/ai/*`)**: The AI is treated as an untrusted translation layer. All outputs are strictly validated via Zod schemas (`lib/ai/outputSchemas.ts`).
3. **UI Shell (`app/*`, `components/*`)**: Next.js App Router providing the user interface, fully decoupled from engine logic.

## Safety & Security

- **Rate Limiting:** IP-based tracking limits requests per window.
- **Prompt Injection Defense:** `wrapUntrustedDocument` sanitises and isolates user input from system instructions.
- **Banned Phrase Filtering:** `sanitizeAssistantText` prevents the assistant from outputting direct legal advice or guarantees (e.g., "you will win", "definitely illegal").
- **Strict-Transport-Security (HSTS) & Content-Security-Policy (CSP):** Full suite of HTTP security headers added in `next.config.ts`.
