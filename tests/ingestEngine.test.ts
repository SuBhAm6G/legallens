import { describe, expect, it } from "vitest";
import { validateFileInput } from "@/lib/engine/ingestEngine";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

describe("ingestEngine", () => {
  it("accepts a valid text file", () => {
    expect(
      validateFileInput({ name: "contract.txt", size: 120, type: "text/plain" }),
    ).toBeNull();
  });

  it("rejects an empty file", () => {
    const error = validateFileInput({ name: "empty.txt", size: 0, type: "text/plain" });
    expect(error?.code).toBe("EMPTY");
  });

  it("rejects an oversized file", () => {
    const error = validateFileInput({
      name: "huge.pdf",
      size: MAX_FILE_SIZE_BYTES + 1,
      type: "application/pdf",
    });
    expect(error?.code).toBe("TOO_LARGE");
  });

  it("rejects an invalid file type", () => {
    const error = validateFileInput({
      name: "notes.exe",
      size: 50,
      type: "application/octet-stream",
    });
    expect(error?.code).toBe("INVALID_TYPE");
  });
});
