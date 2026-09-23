import { BANNED_ASSISTANT_PATTERNS } from "@/lib/constants";

export function findUnsafeLanguage(text: string): string | null {
  for (const pattern of BANNED_ASSISTANT_PATTERNS) {
    if (pattern.test(text)) {
      return pattern.source;
    }
  }
  return null;
}

export function sanitizeAssistantText(text: string): string {
  if (!findUnsafeLanguage(text)) {
    return text.trim();
  }
  return "I can only provide informational assistance based on the document. Consider asking a legal professional before you act.";
}

export function looksLikeLegalAdviceClaim(text: string): boolean {
  return /\byou should (definitely )?(sign|terminate|sue)\b/i.test(text);
}
