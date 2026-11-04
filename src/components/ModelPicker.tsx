"use client";
import { useEffect, useState } from "react";

type ModelOpt = { id: string; label: string; reason?: string };

const CURATED: ModelOpt[] = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B :free", reason: "متوازن" },
  { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B :free", reason: "كود ممتاز" },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash :free", reason: "سريع" },
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 :free", reason: "تفكير عميق" },
  { id: "openrouter/auto", label: "openrouter/auto (مدفوع - يختار أفضل نموذج)" },
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
];

export function ModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [liveFree, setLiveFree] = useState<ModelOpt[] | null>(null);

  useEffect(() => {
    fetch("/api/models").then((r) => r.json()).then((j) => {
      if (j.free?.length) setLiveFree(j.free.slice(0, 10).map((m: { id: string }) => ({ id: m.id, label: m.id })));
    }).catch(() => {});
  }, []);

  const all = liveFree ? [...liveFree, ...CURATED] : CURATED;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold">اختيار النموذج</h3>
      <p className="text-xs text-zinc-400 mt-1">النماذج المجانية تنتهي بـ <code>:free</code> — لا تحتاج رصيداً.</p>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-3 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 text-sm" dir="ltr">
        {all.map((m) => (
          <option key={m.id} value={m.id}>{m.label} {m.reason ? `— ${m.reason}` : ""}</option>
        ))}
      </select>
      <p className="mt-2 text-[11px] text-zinc-500 leading-5">يُحفظ اختيارك لكل جلسة. يمكنك تغييره لاحقاً من <code>opencode.json</code> داخل الـ Sandbox.</p>
    </div>
  );
}
