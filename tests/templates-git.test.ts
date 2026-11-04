import { describe, it, expect } from "vitest";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { buildGitCommand, isGitAction, GIT_ACTIONS } from "@/lib/git";

describe("templates", () => {
  it("كل قالب له معرّف فريد وملفات/أوامر صالحة", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TEMPLATES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.suggestedModel).toContain("/");
      for (const f of t.files) {
        expect(f.path).not.toMatch(/^\//);
        expect(f.path).not.toContain("..");
      }
    }
  });
  it("getTemplate يرجع الفارغ عند معرّف غير معروف", () => {
    expect(getTemplate("nope").id).toBe("blank");
    expect(getTemplate(undefined).id).toBe("blank");
    expect(getTemplate("fastapi").runtime).toBe("python3.13");
  });
});

describe("git whitelist", () => {
  it("يقبل الإجراءات المسموحة فقط", () => {
    for (const a of GIT_ACTIONS) expect(isGitAction(a)).toBe(true);
    expect(isGitAction("push --force")).toBe(false);
    expect(isGitAction("reset --hard")).toBe(false);
    expect(isGitAction("")).toBe(false);
  });
  it("كل أمر مبني قراءة فقط (بدون كتابة)", () => {
    for (const a of GIT_ACTIONS) {
      const cmd = buildGitCommand(a);
      expect(cmd).not.toMatch(/push|commit|reset|checkout|rm\s/);
    }
  });
});
