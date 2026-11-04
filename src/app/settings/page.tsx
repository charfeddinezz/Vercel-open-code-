"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePreferences } from "@/lib/preferences";
import { ModelPicker } from "@/components/ModelPicker";

type Health = { ok: boolean; version: string; checks: Record<string, { ok: boolean; hint?: string }> };
type Usage = { totalCostUsd: number; events: unknown[] };

export default function SettingsPage() {
  const prefs = usePreferences();
  const [health, setHealth] = useState<Health | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
    fetch("/api/usage").then((r) => r.json()).then(setUsage).catch(() => {});
  }, []);

  function notify() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="border-b border-white/10 bg-black/40 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">← لوحة التحكم</Link>
        <span className="text-sm text-zinc-400">الإعدادات</span>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-5">
        {/* Defaults */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-bold">القيم الافتراضية للجلسات الجديدة</h2>
          <p className="text-xs text-zinc-400 mt-1">تُحفظ في متصفحك وتُطبق تلقائياً عند إنشاء جلسة.</p>

          <div className="mt-4 space-y-4">
            <ModelPicker value={prefs.defaultModel} onChange={(v) => { prefs.set({ defaultModel: v }); notify(); }} />

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs text-zinc-400">Runtime</span>
                <select value={prefs.defaultRuntime} onChange={(e) => { prefs.set({ defaultRuntime: e.target.value as never }); notify(); }} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-2 py-2.5 text-sm" dir="ltr">
                  <option value="node22">node22</option>
                  <option value="node24">node24</option>
                  <option value="python3.13">python3.13</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">vCPUs</span>
                <select value={prefs.defaultVcpus} onChange={(e) => { prefs.set({ defaultVcpus: Number(e.target.value) }); notify(); }} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-2 py-2.5 text-sm">
                  {[1, 2, 4, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">المدة (دقيقة)</span>
                <select value={prefs.defaultTimeoutMin} onChange={(e) => { prefs.set({ defaultTimeoutMin: Number(e.target.value) }); notify(); }} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-2 py-2.5 text-sm">
                  {[5, 15, 30, 45, 60, 120, 300].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => { prefs.reset(); notify(); }} className="px-4 py-2 rounded-xl border border-white/15 text-sm hover:bg-white/10">إعادة تعيين الكل</button>
              {saved && <span className="text-xs text-emerald-300" role="status">تم الحفظ ✓</span>}
            </div>
          </div>
        </section>

        {/* System */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">حالة النظام {health && <span className="text-xs font-normal text-zinc-500">v{health.version}</span>}</h2>
            <Link href="/status" className="text-xs text-violet-300 hover:underline">صفحة الحالة الكاملة ←</Link>
          </div>
          <ul className="mt-3 space-y-2">
            {(health ? Object.entries(health.checks) : []).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm">
                <span dir="ltr" className="font-mono text-xs">{k}</span>
                {v.ok ? <span className="text-emerald-300 text-xs">متصل ✓</span> : <span className="text-amber-300 text-xs">{v.hint ?? "غير مضبوط"}</span>}
              </li>
            ))}
            {!health && <li className="text-sm text-zinc-500">جاري الفحص…</li>}
          </ul>
        </section>

        {/* Usage */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-bold">استخدام النماذج</h2>
          <p className="mt-2 text-sm text-zinc-400">
            إجمالي التكلفة التقديرية: <span className="font-mono text-zinc-100" dir="ltr">${(usage?.totalCostUsd ?? 0).toFixed(4)}</span> — أحداث مسجلة: {usage?.events.length ?? 0}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">النماذج المجانية (:free) لا تكلف شيئاً. التفاصيل عبر <code dir="ltr">/api/usage</code></p>
        </section>

        <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
          <h2 className="font-bold text-red-200">منطقة الخطر</h2>
          <p className="text-sm text-zinc-400 mt-1 leading-6">إيقاف جلسة يحفظ Snapshot + يدفع إلى GitHub أولاً. حذف مشروع نهائياً يتم من GitHub نفسه — التطبيق لا يحذف مستودعاتك أبداً.</p>
        </section>
      </main>
    </div>
  );
}
