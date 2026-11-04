"use client";
import { useEffect, useState } from "react";
import type { GitAction } from "@/lib/git";

const ACTIONS: { id: GitAction; label: string }[] = [
  { id: "status", label: "الحالة" },
  { id: "log", label: "السجل" },
  { id: "diff", label: "التغييرات" },
  { id: "branches", label: "الفروع" },
  { id: "remotes", label: "المستودعات" },
];

export function GitPanel({ sandboxId }: { sandboxId: string }) {
  const [action, setAction] = useState<GitAction>("status");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(a: GitAction) {
    setAction(a);
    setLoading(true);
    try {
      const r = await fetch(`/api/sandbox/git?sandboxId=${encodeURIComponent(sandboxId)}&action=${a}`);
      const j = await r.json();
      setOut(j.output ?? j.error ?? "");
    } catch (e) {
      setOut(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("status");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandboxId]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-wrap gap-2">
        <h3 className="text-sm font-semibold">🐙 Git — داخل المشروع</h3>
        <div className="flex gap-1 flex-wrap">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => load(a.id)} disabled={loading} className={`px-3 py-1 rounded-full text-xs transition ${action === a.id ? "bg-white text-black font-semibold" : "border border-white/15 hover:bg-white/10"} disabled:opacity-50`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <pre className="p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[420px] min-h-[180px]" dir="ltr">{loading ? "… جاري الجلب" : out || "—"}</pre>
      <p className="px-4 pb-3 text-[11px] text-zinc-500">للعمليات الكاملة (commit/push/pull) استخدم تبويب Terminal — الحفظ التلقائي عند الإيقاف يدفع كل شيء إلى GitHub.</p>
    </div>
  );
}
