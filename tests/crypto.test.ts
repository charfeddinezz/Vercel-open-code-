import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "node:crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("crypto", () => {
  it("تشفير وفك تشفير دائري", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const plain = "sk-or-v1-secret-key-123";
    const enc = encrypt(plain);
    expect(enc).not.toContain(plain);
    expect(decrypt(enc)).toBe(plain);
  });
  it("كل تشفير مختلف (IV عشوائي)", async () => {
    const { encrypt } = await import("@/lib/crypto");
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });
  it("يرفض نصاً مشفّراً تالفاً", async () => {
    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt("not-valid-format")).toThrow();
  });
  it("يخفي المفاتيح في maskKey", async () => {
    const { maskKey } = await import("@/lib/crypto");
    expect(maskKey("sk-or-v1-abcdef")).toContain("…");
    expect(maskKey("short")).toBe("***");
  });
});
