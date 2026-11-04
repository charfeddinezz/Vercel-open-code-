"use client";
import { useEffect, useState } from "react";

export function FileTree({ sandboxId }: { sandboxId: string }) {
  const [path, setPath] = useState("/vercel/sandbox");
  const [data, setData] = useState<{ tree: string[]; ls: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");

  async function load(p = path) {
    setLoading(true);
    try {
      const r = await fetch(`/api/sandbox/files?sandboxId=${encodeURIComponent(sandboxId)}&path=${encodeURIComponent(p)}`);
      const j = await r.json();
      setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [sandboxId]);

  async function readFile(filePath: string) {
    setSelected(filePath);
    const r = await fetch(`/api/sandbox/files/read?sandboxId=${encodeURIComponent(sandboxId)}&path=${encodeURIComponent(filePath)}`);
    const j = await r.json();
    setContent(j.content ?? j.error ?? "");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <input value={path} onChange={(e) => setPath(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="flex-1 rounded-lg bg-zinc-900 border border-white/10 px-2 py-1.5 text-xs font-mono" dir="ltr" />
        <button onClick={() => load()} disabled={loading} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium disabled:opacity-50">
          {loading ? "…" : "تحديث"}
        </button>
      </div>
      <div className="grid md:grid-cols-2 min-h-[300px]">
        <div className="border-l border-white/10 p-3 overflow-auto max-h-[400px]">
          <p className="text-xs text-zinc-400 mb-2">الملفات ({data?.tree.length ?? 0})</p>
          <ul className="space-y-1 text-xs font-mono">
            {(data?.tree ?? []).map((t) => (
              <li key={t} className="flex items-center justify-between gap-2 hover:bg-white/5 px-2 py-1 rounded cursor-pointer" onClick={() => readFile(t)}>
                <span className="truncate" dir="ltr">{t}</span>
                <button className="text-violet-400 text-[11px]">فتح</button>
              </li>
            ))}
          </ul>
          <pre className="mt-3 text-[11px] bg-black/50 p-2 rounded border border-white/10 overflow-auto" dir="ltr">{data?.ls ?? ""}</pre>
        </div>
        <div className="p-3">
          <p className="text-xs text-zinc-400">{selected ? `معاينة: ${selected}` : "اختر ملفاً للمعاينة"}</p>
          <pre className="mt-2 text-xs font-mono bg-zinc-950 border border-white/10 rounded p-3 overflow-auto max-h-[360px] whitespace-pre-wrap" dir="ltr">{content || "—"}</pre>
        </div>
      </div>
    </div>
  );
}
