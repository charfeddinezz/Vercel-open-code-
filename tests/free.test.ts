import { describe, it, expect, afterEach } from "vitest";
import { isFreeModel, assertModelAllowed, nextFreeModel, FREE_FALLBACK_CHAIN, DEFAULT_FREE_MODEL } from "@/lib/free";

afterEach(() => {
  delete process.env.FREE_MODE;
  delete process.env.ALLOW_PAID_MODELS;
});

describe("free mode", () => {
  it("يعتبر :free مجانياً فقط", () => {
    expect(isFreeModel("qwen/qwen-2.5-72b-instruct:free")).toBe(true);
    expect(isFreeModel("anthropic/claude-sonnet-4")).toBe(false);
    expect(isFreeModel("openrouter/auto")).toBe(false);
  });
  it("يرفض المدفوع افتراضياً ويسمح بالمجاني", () => {
    expect(assertModelAllowed("anthropic/claude-sonnet-4").ok).toBe(false);
    const ok = assertModelAllowed("meta-llama/llama-3.3-70b-instruct:free");
    expect(ok.ok).toBe(true);
  });
  it("بدون نموذج يختار المجاني الافتراضي", () => {
    const r = assertModelAllowed(undefined);
    expect(r.ok && r.model).toBe(DEFAULT_FREE_MODEL);
  });
  it("ALLOW_PAID_MODELS يفتح المدفوع", () => {
    process.env.ALLOW_PAID_MODELS = "true";
    expect(assertModelAllowed("anthropic/claude-sonnet-4").ok).toBe(true);
  });
  it("سلسلة الاحتياط كلها مجانية وتتقدم بالترتيب", () => {
    for (const m of FREE_FALLBACK_CHAIN) expect(isFreeModel(m)).toBe(true);
    expect(nextFreeModel(FREE_FALLBACK_CHAIN[0])).toBe(FREE_FALLBACK_CHAIN[1]);
    expect(nextFreeModel(FREE_FALLBACK_CHAIN[FREE_FALLBACK_CHAIN.length - 1])).toBeNull();
  });
});
