"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { QrCard } from "@/components/QrCard";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FREE_STACK } from "@/lib/free";

type Health = { ok: boolean; checks: Record<string, { ok: boolean; hint?: string }> };

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=" +
  encodeURIComponent("https://github.com/charfeddinezz/Vercel-open-code-") +
  "&env=OPENROUTER_API_KEY,OPENCODE_SERVER_PASSWORD,AUTH_SECRET&envDescription=" +
  encodeURIComponent("OPENROUTER_API_KEY من openrouter.ai/keys (مجاني) — الباقي كلمات سر تختارها") +
  "&project-name=opencode-cloud";

export default function ConnectPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
  }, []);

  const hasKey = health?.checks?.openrouter?.ok ?? false;
  const steps = [
    {
      done: hasKey,
      title: "مفتاح الذكاء الاصطناعي — مجاني",
      desc: "من OpenRouter: سجّل بحساب Google/GitHub، أنشئ مفتاحاً، واختر لاحقاً أي نموذج ينتهي بـ :free. لا بطاقة ائتمان.",
      action: (
        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold">
          احصل على مفتاح مجاني ↗
        </a>
      ),
    },
    {
      done: false,
      title: "حساب GitHub — مجاني",
      desc: "لحفظ مشاريعك واستعادتها بعد انتهاء كل جلسة مؤقتة. تسجيل الدخول هنا يربطه تلقائياً.",
      action: (
        <Link href="/login" className="px-4 py-2 rounded-full border border-white/20 text-xs hover:bg-white/10">
          تسجيل الدخول بـ GitHub
        </Link>
      ),
    },
    {
      done: hasKey,
      title: "النشر على Vercel — مجاني",
      desc: "إن كنت تنشر نسختك الخاصة: زر واحد يستنسخ المشروع وينشره على خطة Hobby المجانية ويطلب منك المفاتيح أثناء الإعداد.",
      action: (
        <a href={DEPLOY_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
          ▲ انشر على Vercel بضغطة واحدة ↗
        </a>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-24 sm:pb-8">
      <header className="border-b border-white/10 bg-black/40 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">← OpenCode Cloud</Link>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">مجاني بالكامل 0$</span>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-black">اربط كل شيء في دقيقتين 🔗</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-7">ثلاث خطوات مجانية تماماً — بدون بطاقة ائتمان في أي خطوة، وبدون كتابة روابط على الهاتف.</p>
        </div>

        <InstallPrompt />

        {/* Steps */}
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex gap-4">
              <span className={`shrink-0 h-9 w-9 rounded-full grid place-items-center font-black text-sm ${s.done ? "bg-emerald-500 text-black" : "bg-white/10 border border-white/15"}`}>{s.done ? "✓" : i + 1}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold">{s.title}</h2>
                <p className="text-sm text-zinc-400 leading-6 mt-1">{s.desc}</p>
                <div className="mt-3">{s.action}</div>
              </div>
            </li>
          ))}
        </ol>

        {health && !hasKey && (
          <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6">
            ⚠️ الخادم الحالي لم يُضبط فيه المفتاح بعد. إن كنت الزائر: صاحب الموقع يحتاج إضافته. إن كنت المالك: أضف <code dir="ltr" className="px-1 rounded bg-black/40">OPENROUTER_API_KEY</code> في Vercel ← Settings ← Environment Variables ثم أعد النشر — أو استخدم زر النشر أعلاه من جديد.
          </p>
        )}

        {/* Phone handoff */}
        <div className="grid sm:grid-cols-2 gap-4">
          {origin && <QrCard url={`${origin}/dashboard`} title="تابع على هاتفك" />}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-bold text-sm">كل شيء مجاني — ما الحزمة؟ 💸🚫</h3>
            <ul className="mt-3 space-y-2.5">
              {FREE_STACK.map((f) => (
                <li key={f.name} className="text-xs leading-5">
                  <a href={f.url} target="_blank" rel="noreferrer" className="font-semibold text-violet-300 hover:underline">{f.name} ↗</a>
                  <span className="text-zinc-400"> — {f.role}. {f.limit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link href="/dashboard" className="block text-center rounded-2xl bg-white text-black font-bold py-4 hover:bg-zinc-100 transition">
          كل شيء جاهز؟ أنشئ جلستك الأولى ←
        </Link>
      </main>
    </div>
  );
}
