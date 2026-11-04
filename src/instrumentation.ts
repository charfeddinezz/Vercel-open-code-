/**
 * Instrumentation — يشتغل مرة واحدة عند إقلاع الخادم
 * يتحقق من البيئة ويسجل تحذيرات واضحة بدل فشل صامت لاحقاً
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getEnv } = await import("./lib/env");
  const env = getEnv();

  const missing: string[] = [];
  if (!env.OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY (مطلوب لتشغيل النماذج)");
  if (!process.env.VERCEL_TOKEN && !process.env.VERCEL_PROJECT_ID) missing.push("VERCEL_TOKEN / VERCEL_PROJECT_ID (مطلوب لإنشاء Sandbox خارج Vercel)");

  if (missing.length) {
    console.warn(`\n[opencode-cloud] ⚠️  متغيرات مفقودة:\n${missing.map((m) => `  - ${m}`).join("\n")}\nراجع docs/SETUP.md\n`);
  } else {
    console.log("[opencode-cloud] ✓ البيئة جاهزة — OpenRouter + Vercel مضبوطان");
  }
}
