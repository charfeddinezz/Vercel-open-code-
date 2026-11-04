"use client";
import { useEffect, useState } from "react";

export function LogsViewer({ sandboxId }: { sandboxId: string }) {
  const [log, setLog] = useState("");
  const [source, setSource] = useState<"opencode" | "system">("opencode");
  const [auto, setAuto] = useState(true);

  async function fetchLog() {
    const r = await fetch(`/api/sandbox/logs?sandboxId=${encodeURIComponent(sandboxId)}&lines=200&source=${source}`);
    const j = await r.json();
    setLog(j.log ?? j.error ?? "");
  }

  useEffect(() => {
    fetchLog();
    if (!auto) return;
    const id = setInterval(fetchLog, 5000);
    return () => clearInterval(id);
  }, [sandboxId, source, auto]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">السجلات</h3>
        <div className="flex items-center gap-2">
          <select value={source} onChange={(e) => setSource(e.target.value as never)} className="rounded-full bg-zinc-900 border border-white/10 px-3 py-1 text-xs">
            <option value="opencode">OpenCode</option>
            <option value="system">System</option>
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> تلقائي
          </label>
          <button onClick={fetchLog} className="px-3 py-1 rounded-full border border-white/15 text-xs hover:bg-white/10">تحديث</button>
        </div>
      </div>
      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-zinc-950 border border-white/10 p-3 text-xs font-mono whitespace-pre-wrap" dir="ltr">{log || "— لا توجد سجلات —"}</pre>
    </div>
  );
}
