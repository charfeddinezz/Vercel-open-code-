"use client";
import { useEffect, useRef, useState } from "react";

type Props = { sandboxId: string };

export function SandboxTerminal({ sandboxId }: Props) {
  const [cmd, setCmd] = useState("ls -la");
  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLPreElement>(null);

  async function run() {
    setBusy(true);
    try {
      const r = await fetch("/api/sandbox/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, cmd }),
      });
      const j = await r.json();
      setOut(j.stdout ?? j.stderr ?? j.error ?? "");
    } catch (e) {
      setOut(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-400">Terminal — تنفيذ مباشر داخل Sandbox</p>
      <div className="mt-2 flex gap-2">
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} className="flex-1 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 font-mono text-sm outline-none focus:border-violet-500" dir="ltr" />
        <button onClick={run} disabled={busy} className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? "…" : "تنفيذ"}</button>
      </div>
      <pre ref={ref} className="mt-3 max-h-64 overflow-auto rounded-xl bg-zinc-950 border border-white/10 p-3 text-xs font-mono whitespace-pre-wrap" dir="ltr">{out || "— لا يوجد إخراج بعد —"}</pre>
    </div>
  );
}
