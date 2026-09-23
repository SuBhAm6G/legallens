# Security

## WHAT

Server-side model calls, upload limits, rate limits, untrusted-document wrapping, banned-phrase filtering, security headers, no document database.

## WHY

Legal documents are sensitive and may contain prompt-injection text.

## HOW

- `GOOGLE_GENERATIVE_AI_API_KEY` is server-only (`.env.local`, gitignored).
- `validateFileInput` enforces type and 2 MB size.
- `wrapUntrustedDocument` fences document text.
- `sanitizeAssistantText` strips banned legal-advice phrasing.
- `allowRequest` rate-limits API routes.
- `next.config.ts` sets nosniff, frame deny, referrer, permissions policy.
- Errors returned to the client are generic.

## EVIDENCE

See `lib/engine/ingestEngine.ts`, `lib/engine/promptGuardEngine.ts`, `lib/engine/safetyEngine.ts`, `lib/engine/rateLimitEngine.ts`, `app/api/*/route.ts`.

This project does not claim enterprise certification or zero provider-side retention.
