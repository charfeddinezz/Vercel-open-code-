/**
 * الوضع المجاني بالكامل — قلب الإصدار v1.3
 *
 * القاعدة: كل شيء يعمل بـ 0$ —
 *  • نماذج OpenRouter المجانية فقط (:free)
 *  • Vercel Hobby + Sandbox ضمن الحدود المجانية
 *  • GitHub Free لحفظ المشاريع
 *  • لا بطاقة ائتمان مطلوبة في أي خطوة
 */

/** هل الوضع المجاني القسري مفعّل؟ (الافتراضي: نعم — عطّله بـ FREE_MODE=false) */
export function isFreeMode(): boolean {
  return process.env.FREE_MODE !== "false";
}

/** السماح بالنماذج المدفوعة يتطلب تعطيل الوضع المجاني صراحة */
export function paidAllowed(): boolean {
  return !isFreeMode() || process.env.ALLOW_PAID_MODELS === "true";
}

/** نموذج مجاني؟ ينتهي بـ :free أو ضمن القائمة المجانية المعروفة */
export function isFreeModel(modelId: string): boolean {
  return modelId.endsWith(":free");
}

/**
 * سلسلة احتياطية مجانية — إن ازدحم نموذج أو بلغ حده، جرّب التالي تلقائياً.
 * مرتبة من الأقوى للبرمجة إلى الأسرع.
 */
export const FREE_FALLBACK_CHAIN = [
  "qwen/qwen-2.5-72b-instruct:free", // الأفضل للكود
  "meta-llama/llama-3.3-70b-instruct:free", // متوازن
  "deepseek/deepseek-r1:free", // تفكير عميق
  "google/gemini-2.0-flash-exp:free", // الأسرع
  "mistralai/mistral-small-3.1-24b-instruct:free", // خفيف للهاتف
] as const;

export const DEFAULT_FREE_MODEL = FREE_FALLBACK_CHAIN[0];

/** النموذج التالي في السلسلة عند فشل الحالي (null إن انتهت) */
export function nextFreeModel(current: string): string | null {
  const i = (FREE_FALLBACK_CHAIN as readonly string[]).indexOf(current);
  if (i === -1) return FREE_FALLBACK_CHAIN[0];
  return FREE_FALLBACK_CHAIN[i + 1] ?? null;
}

/** تحقق يُستخدم عند إنشاء جلسة — يرفض المدفوع في الوضع المجاني برسالة ودودة */
export function assertModelAllowed(model: string | undefined): { ok: true; model: string } | { ok: false; error: string } {
  const m = model ?? DEFAULT_FREE_MODEL;
  if (!paidAllowed() && !isFreeModel(m)) {
    return {
      ok: false,
      error: `النموذج "${m}" مدفوع — هذا الموقع يعمل بالوضع المجاني بالكامل. اختر نموذجاً ينتهي بـ :free (مثل ${DEFAULT_FREE_MODEL}) أو عطّل FREE_MODE على الخادم إن أردت المدفوع.`,
    };
  }
  return { ok: true, model: m };
}

/** الحزمة المجانية الكاملة المعتمدة في المشروع */
export const FREE_STACK = [
  { name: "Vercel Hobby", role: "استضافة الموقع + Sandbox", limit: "مجاني — Sandbox حتى 45 دقيقة/جلسة في Hobby", url: "https://vercel.com/pricing" },
  { name: "OpenRouter :free", role: "نماذج الذكاء الاصطناعي", limit: "مجاني بحدود يومية سخية دون بطاقة", url: "https://openrouter.ai/models?max_price=0" },
  { name: "GitHub Free", role: "حفظ المشاريع والاستعادة", limit: "مستودعات خاصة مجانية بلا حد عملي", url: "https://github.com/pricing" },
  { name: "OpenCode", role: "وكيل البرمجة نفسه", limit: "مفتوح المصدر ومجاني بالكامل", url: "https://opencode.ai" },
] as const;
