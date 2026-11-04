import { describe, it, expect } from "vitest";
import { Errors, toResponse, AppError } from "@/lib/errors";
import { estimateCost, estimateModelCost } from "@/lib/metrics";
import { createShareId } from "@/lib/share";

describe("errors", () => {
  it("يحول AppError لاستجابة صحيحة", () => {
    const { status, body } = toResponse(Errors.notFound("جلسة غير موجودة"));
    expect(status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });
  it("يحول أخطاء عادية إلى 500", () => {
    const { status, body } = toResponse(new Error("boom"));
    expect(status).toBe(500);
    expect(body.error).toBe("boom");
  });
  it("AppError يحمل الكود والحالة", () => {
    const e = Errors.rateLimited(30);
    expect(e).toBeInstanceOf(AppError);
    expect(e.status).toBe(429);
  });
});

describe("metrics", () => {
  it("تكلفة صفرية بدون CPU", () => {
    expect(estimateCost({ sandboxId: "s", durationMs: 1000, vcpus: 4 })).toBe(0);
  });
  it("تكلفة موجبة مع CPU", () => {
    const c = estimateCost({ sandboxId: "s", activeCpuMs: 60_000, durationMs: 60_000, vcpus: 4 });
    expect(c).toBeGreaterThan(0);
  });
  it("النماذج المجانية تكلفتها صفر", () => {
    expect(estimateModelCost("meta-llama/llama-3.3-70b-instruct:free", { prompt: 10000, completion: 10000 })).toBe(0);
  });
});

describe("share", () => {
  it("يولد معرّفات فريدة بالبادئة الصحيحة", () => {
    const a = createShareId();
    const b = createShareId();
    expect(a).toMatch(/^sh_[a-f0-9]{16}$/);
    expect(a).not.toBe(b);
  });
});
