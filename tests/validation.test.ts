import { describe, it, expect } from "vitest";
import { projectNameSchema, sandboxCreateSchema, execSchema, githubUrlSchema } from "@/lib/validation";

describe("projectNameSchema", () => {
  it("يقبل أسماء صالحة", () => {
    expect(projectNameSchema.parse("my-app_1")).toBe("my-app_1");
  });
  it("يرفض مسافات ورموزاً", () => {
    expect(() => projectNameSchema.parse("my app")).toThrow();
    expect(() => projectNameSchema.parse("a/b")).toThrow();
    expect(() => projectNameSchema.parse("")).toThrow();
  });
  it("يرفض أسماء طويلة", () => {
    expect(() => projectNameSchema.parse("a".repeat(65))).toThrow();
  });
});

describe("sandboxCreateSchema", () => {
  it("يقبل حداً أدنى فارغاً", () => {
    expect(sandboxCreateSchema.parse({})).toEqual({});
  });
  it("يرفض vcpus خارج النطاق", () => {
    expect(() => sandboxCreateSchema.parse({ vcpus: 99 })).toThrow();
    expect(() => sandboxCreateSchema.parse({ vcpus: 0 })).toThrow();
  });
  it("يرفض runtime غير معروف", () => {
    expect(() => sandboxCreateSchema.parse({ runtime: "go1.22" })).toThrow();
  });
  it("يرفض منافذ محظورة", () => {
    expect(() => sandboxCreateSchema.parse({ ports: [22] })).toThrow();
  });
  it("يرفض timeout أكبر من 5 ساعات", () => {
    expect(() => sandboxCreateSchema.parse({ timeoutMs: 6 * 3600 * 1000 })).toThrow();
  });
});

describe("execSchema", () => {
  it("يرفض أوامر فارغة أو طويلة جداً", () => {
    expect(() => execSchema.parse({ sandboxId: "x", cmd: "" })).toThrow();
    expect(() => execSchema.parse({ sandboxId: "x", cmd: "a".repeat(4001) })).toThrow();
  });
});

describe("githubUrlSchema", () => {
  it("يقبل روابط GitHub وفارغاً", () => {
    expect(githubUrlSchema.parse("https://github.com/a/b")).toContain("github.com");
    expect(githubUrlSchema.parse("")).toBe("");
  });
  it("يرفض روابط غير GitHub", () => {
    expect(() => githubUrlSchema.parse("https://example.com/a")).toThrow();
  });
});
