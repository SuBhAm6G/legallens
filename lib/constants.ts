export const APP_NAME = "LegalLens";
export const APP_TAGLINE = "Understand the fine print. Know what to ask next.";
export const LEGAL_DISCLAIMER =
  "LegalLens provides informational assistance, not professional legal advice.";

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_TEXT_CHARS = 120_000;
export const CHUNK_TARGET_CHARS = 900;
export const RETRIEVAL_CHUNK_COUNT = 6;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 20;

export const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf"] as const;

export const ATTENTION_LABELS = [
  "Review",
  "High Attention",
  "Ambiguous",
  "Missing Information",
  "Changed Significantly",
] as const;

export const CLAUSE_CATEGORIES = [
  "termination",
  "payment",
  "liability",
  "indemnity",
  "confidentiality",
  "intellectual_property",
  "dispute_resolution",
  "renewal",
  "restrictions",
  "privacy",
  "obligations",
  "deadlines",
  "other",
] as const;

export const USER_ROLES = [
  "employee",
  "tenant",
  "customer",
  "freelancer",
  "small_business_owner",
  "other",
] as const;

export const USER_GOALS = [
  "understand_before_signing",
  "compare_versions",
  "prepare_for_lawyer",
  "ask_questions",
] as const;

export const GEMINI_MODEL_ID = "gemini-3.5-flash-lite";

export const BANNED_ASSISTANT_PATTERNS: readonly RegExp[] = [
  /\byou will win\b/i,
  /\bdefinitely illegal\b/i,
  /\byou should sue\b/i,
  /\blegally protected\b/i,
  /\bdefinitely sign\b/i,
  /\bdefinitely terminate\b/i,
  /\bthis is legal advice\b/i,
];
