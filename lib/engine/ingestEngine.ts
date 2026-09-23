import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import type { FileInput, IngestError } from "@/lib/types";
import { fileExtension } from "@/lib/utils";

export function validateFileInput(file: FileInput): IngestError | null {
  if (file.size <= 0) {
    return {
      code: "EMPTY",
      message: "The file is empty. Choose a text, Markdown, or PDF document.",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: "TOO_LARGE",
      message: `The file exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit.`,
    };
  }
  const extension = fileExtension(file.name);
  const allowed = (ALLOWED_EXTENSIONS as readonly string[]).includes(extension);
  if (!allowed) {
    return {
      code: "INVALID_TYPE",
      message: "Only .txt, .md, and .pdf files are accepted.",
    };
  }
  return null;
}
