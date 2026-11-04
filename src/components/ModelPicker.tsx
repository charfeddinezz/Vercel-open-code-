"use client";
import { useEffect, useMemo, useState } from "react";

type ModelOpt = { id: string; label: string; reason?: string; free?: boolean; context?: number };

const CURATED: ModelOpt[] = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B :free", reason: "متوازن", free: true },
  { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B :free", reason: "كود ممتاز", free: true },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash :free", reason: "سريع", free: true },
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 :free", reason: "تفكير عميق", free: true },
  { id: "openrouter/auto", label: "openrouter/auto (مدفوع)", reason: "يختار الأفضل تلقائياً" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", reason: "الأقوى للكود" },
];

export function ModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [live, setLive] = useState<ModelOpt[]>([]);
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (freeOnly) params.set("free", "true");
      fetch(`/api/models?${params}`)
        .then((r) => r.json())
        .then((j) => {
          const fromFree = (j.free ?? []).map((m: { id: string; context_length?: number }) => ({ id: m.id, label: m.id, free: true, context: m.context_length }));
          const fromModels = (j.models ?? []).map((m: { id: string; isFree?: boolean; context_length?: number }) => ({ id: m.id, label: m.id, free: m.isFree, context: m.context_length }));
          const merged = [...fromFree, ...fromModels];
          const seen = new Set<string>();
          setLive(merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true))));
        })
        .catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [query, freeOnly]);

  const all = useMemo(() => {
    const base = live.length ? live : CURATED;
    return base.filter((m) => !freeOnly || m.free);
  }, [live, freeOnly]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">اختيار النموذج</h3>
        <span className="text-[11px] text-zinc-500">{all.length} نموذج</span>
      </div>

      <div className="mt-3 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث: qwen, llama, gemini…" dir="ltr" className="flex-1 rounded-xl bg-black border border-white/10 px-3 py-2 text-xs outline-none focus:border-violet-500" aria-label="بحث النماذج" />
        <button onClick={() => setFreeOnly(!freeOnly)} className={`shrink-0 px-3 rounded-xl text-xs border transition ${freeOnly ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200" : "border-white/15 hover:bg-white/10"}`} aria-pressed={freeOnly}>
          مجاني فقط
        </button>
      </div>

      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm" dir="ltr" size={1}>
        {all.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}{m.context ? ` (${Math.round(m.context / 1000)}k)` : ""}{m.reason ? ` — ${m.reason}` : ""}
          </option>
        ))}
        {all.length === 0 && <option value={value}>لا نتائج — جرّب كلمة أخرى</option>}
      </select>
      <p className="mt-2 text-[11px] text-zinc-500 leading-5">المجانية تنتهي بـ <code dir="ltr">:free</code> ولا تحتاج رصيداً. الرقم (128k) هو حجم سياق النموذج.</p>
    </div>
  );
}
