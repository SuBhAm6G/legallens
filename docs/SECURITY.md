# Security Strategy

LegalLens takes a Defense-in-Depth approach across three main tiers: Prompt Injection Defense, Strict API Rate Limiting, and robust HTTP Security Headers.

## 1. Prompt Injection Defense (OWASP LLM Top 10)
- **`wrapUntrustedDocument` (`lib/engine/promptGuardEngine.ts`)**: User-uploaded documents are treated as untrusted and sandwiched between explicit `<UNTRUSTED_DOCUMENT>` delimiters.
- **Escape Mechanisms:** The engine strips code block delimiters (` ``` ` -> `'''`) to prevent prompt-jailbreaking via markdown injection.
- **`systemGuard`**: Instructions strictly restrict the model from answering questions outside the scope of the document, inventing citations, or giving professional legal advice.

## 2. API Rate Limiting & Abuse Prevention
- **`rateLimitEngine.ts`**: An in-memory rate-limiting engine is enforced across every `/api/*` route.
- Clients are limited to 20 requests per minute based on IP address (`x-forwarded-for`). Requests exceeding the limit immediately receive a `429 Too Many Requests` status, protecting downstream LLM resources from exhaustion (DDoS protection).

## 3. Strict HTTP Security Headers
The application enforces strict headers inside `next.config.ts`, directly aligning with OWASP recommendations:

```typescript
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://generativelanguage.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
```

## 4. No Hardcoded Secrets
Our `scripts/audit.mjs` CI script prevents commits that expose `.env` files or hardcoded credentials. All API keys (e.g., `GEMINI_API_KEY`) are fetched securely via environment variables.
