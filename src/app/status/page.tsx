"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Health = { ok: boolean; version: string; runtime: string; time: string; checks: Record<string, { ok: boolean; hint?: string }> };

export default function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  async function check() {
    const t0 = performance.now();
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      setHealth(await r.json());
      setLatency(Math.round(performance.now() - t0));
    } catch {}
  }

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="border-b border-white/10 bg-black/40 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">← OpenCode Cloud</Link>
        <button onClick={check} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/10">إعادة الفحص</button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center">
          <p className="text-5xl">{health ? (health.ok ? "🟢" : "🟡") : "⏳"}</p>
          <h1 className="mt-3 text-2xl font-black">{health ? (health.ok ? "كل الأنظمة الأساسية تعمل" : "يعمل جزئياً — راجع الإعداد") : "جاري الفحص…"}</h1>
          {health && (
            <p className="mt-2 text-xs text-zinc-500">
              الإصدار {health.version} • {health.runtime} • زمن الاستجابة {latency}ms • آخر فحص {new Date(health.time).toLocaleTimeString("ar")} • تحديث تلقائي كل 30 ثانية
            </p>
          )}
        </div>

        <ul className="mt-8 space-y-2">
          {(health ? Object.entries(health.checks) : []).map(([k, v]) => (
            <li key={k} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="font-mono text-sm" dir="ltr">{k}</span>
              {v.ok ? <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-200">تعمل ✓</span> : <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-200">{v.hint ?? "غير مضبوطة"}</span>}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
          <strong className="text-zinc-200">كيف تقرأ هذا؟</strong> ‏`openrouter` و`vercel_token` أساسيان لإنشاء الجلسات. الباقي اختياري: KV للحدود والمشاركة، Postgres لحفظ المشاريع، والتشفير لمفاتيح المستخدمين. دليل الإعداد الكامل في <code dir="ltr">docs/SETUP.md</code> بالمستودع.
        </div>
      </main>
    </div>
  );
}
