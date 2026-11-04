"use client";
import { useEffect, useRef, useState } from "react";

type Props = { sandboxId: string };

const QUICK = ["ls -la", "pwd && whoami", "git status", "node -v && npm -v", "cat /tmp/opencode.log | tail -n 50", "df -h && free -m", "opencode --version || ~/.opencode/bin/opencode --version"];

export function SandboxTerminal({ sandboxId }: Props) {
  const [cmd, setCmd] = useState("ls -la");
  const [history, setHistory] = useState<{ cmd: string; out: string; code?: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [cwd, setCwd] = useState("/vercel/sandbox");
  const [histIdx, setHistIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  async function run(command = cmd) {
    const c = command.trim();
    if (!c || busy) return;
    setBusy(true);
    setCmd(c);
    try {
      const r = await fetch("/api/sandbox/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, cmd: c, cwd }),
      });
      const j = await r.json();
      const out = [j.stdout, j.stderr].filter(Boolean).join("\n") || j.error || "(بدون إخراج)";
      setHistory((h) => [...h.slice(-49), { cmd: c, out, code: j.exitCode }]);
    } catch (e) {
      setHistory((h) => [...h, { cmd: c, out: String(e) }]);
    } finally {
      setBusy(false);
      setHistIdx(-1);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-zinc-950">
        <p className="text-xs text-zinc-400">⌨️ Terminal — داخل الـ Sandbox مباشرة (الأوامر الخطرة محظورة)</p>
        <button onClick={() => setHistory([])} className="text-[11px] px-2 py-1 rounded-full border border-white/15 hover:bg-white/10">مسح</button>
      </div>

      <div ref={ref} className="max-h-[380px] overflow-auto p-3 space-y-3" dir="ltr">
        {history.length === 0 && <p className="text-xs font-mono text-zinc-500">$ — لا يوجد إخراج بعد. جرّب: ls -la</p>}
        {history.map((h, i) => (
          <div key={i} className="font-mono text-xs">
            <p className="text-emerald-300">$ {h.cmd} {h.code !== undefined && <span className={h.code === 0 ? "text-zinc-500" : "text-red-400"}>[exit {h.code}]</span>}</p>
            <pre className="mt-1 whitespace-pre-wrap text-zinc-200 bg-zinc-950 border border-white/5 rounded-lg p-2 overflow-auto">{h.out}</pre>
          </div>
        ))}
        {busy && <p className="text-xs font-mono text-amber-300 animate-pulse">… جاري التنفيذ</p>}
      </div>

      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex gap-2">
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            className="w-44 rounded-xl bg-zinc-900 border border-white/10 px-2.5 py-2 font-mono text-[11px] outline-none focus:border-violet-500"
            dir="ltr"
            aria-label="مجلد العمل"
          />
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
              if (e.key === "ArrowUp") {
                e.preventDefault();
                const next = Math.min(histIdx + 1, history.length - 1);
                if (history.length) { setHistIdx(next); setCmd(history[history.length - 1 - next].cmd); }
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = Math.max(histIdx - 1, -1);
                setHistIdx(next);
                setCmd(next === -1 ? "" : history[history.length - 1 - next].cmd);
              }
            }}
            placeholder="اكتب أمراً… Enter للتنفيذ، ↑ للسجل"
            className="flex-1 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 font-mono text-sm outline-none focus:border-violet-500"
            dir="ltr"
          />
          <button onClick={() => run()} disabled={busy} className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-50">{busy ? "…" : "تنفيذ"}</button>
        </div>
        <div className="flex gap-1.5 flex-wrap" dir="ltr">
          {QUICK.map((q) => (
            <button key={q} onClick={() => run(q)} disabled={busy} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] hover:bg-white/10 disabled:opacity-50">{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
