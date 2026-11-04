"use client";
import { useState } from "react";

export function ShareModal({ sandboxId, onClose }: { sandboxId: string; onClose: () => void }) {
  const [ttl, setTtl] = useState(3600);
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  async function create() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, ttlSec: ttl, maxViews }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "فشل إنشاء الرابط");
      setUrl(j.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="مشاركة الجلسة">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">مشاركة الجلسة</h3>
            <p className="text-xs text-zinc-400 mt-1">رابط مؤقت يفتح نفس الـ Sandbox — ينتهي تلقائياً.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full border border-white/15 hover:bg-white/10" aria-label="إغلاق">✕</button>
        </div>

        {!url ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm">مدة الصلاحية</span>
              <select value={ttl} onChange={(e) => setTtl(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm">
                <option value={3600}>ساعة واحدة</option>
                <option value={21600}>6 ساعات</option>
                <option value={86400}>يوم واحد</option>
                <option value={604800}>7 أيام</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">حد المشاهدات (اختياري)</span>
              <input type="number" min={1} max={1000} value={maxViews ?? ""} onChange={(e) => setMaxViews(e.target.value ? Number(e.target.value) : undefined)} placeholder="بدون حد" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm" />
            </label>
            {err && <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{err}</p>}
            <button onClick={create} disabled={busy} className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-50">{busy ? "جاري الإنشاء…" : "إنشاء رابط المشاركة"}</button>
            <p className="text-[11px] text-zinc-500 leading-5">⚠️ أي شخص لديه الرابط يمكنه الوصول للجلسة طالما الرابط صالح. لا تشاركه علناً إن كان المشروع حساساً.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="flex gap-2">
              <input readOnly value={url} dir="ltr" className="flex-1 rounded-xl bg-black border border-white/10 px-3 py-2.5 text-xs font-mono" />
              <button onClick={copy} className="px-4 rounded-xl bg-white text-black text-sm font-medium">{copied ? "تم ✓" : "نسخ"}</button>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="block text-center text-sm text-violet-300 hover:underline">فتح الرابط للتجربة ↗</a>
            <button onClick={onClose} className="w-full rounded-xl border border-white/15 py-2.5 text-sm hover:bg-white/10">إغلاق</button>
          </div>
        )}
      </div>
    </div>
  );
}
