"use client";
import { useCallback, useEffect, useState } from "react";
import { SandboxTerminal } from "./SandboxTerminal";
import { FileTree } from "./FileTree";
import { LogsViewer } from "./LogsViewer";
import { MetricsCard } from "./MetricsCard";
import { ShareModal } from "./ShareModal";

type Tab = "opencode" | "terminal" | "files" | "logs" | "metrics";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "opencode", label: "OpenCode", icon: "🤖" },
  { id: "terminal", label: "Terminal", icon: "⌨️" },
  { id: "files", label: "الملفات", icon: "📁" },
  { id: "logs", label: "السجلات", icon: "📜" },
  { id: "metrics", label: "المقاييس", icon: "📊" },
];

export function SessionWorkspace({ sandboxId }: { sandboxId: string }) {
  const [tab, setTab] = useState<Tab>("opencode");
  const [status, setStatus] = useState<{ status?: string; opencode?: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  const proxyUrl = `/api/sandbox/proxy/${encodeURIComponent(sandboxId)}/`;

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/sandbox/status?sandboxId=${encodeURIComponent(sandboxId)}`);
      const j = await r.json();
      if (r.ok) setStatus(j);
    } catch {}
  }, [sandboxId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [poll]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function action(name: string, path: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(name);
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "فشل");
      notify(okMsg + (j.snapshotId ? ` — Snapshot: ${String(j.snapshotId).slice(0, 16)}…` : ""));
      if (name === "stop") setTimeout(() => (window.location.href = "/dashboard"), 1200);
    } catch (e) {
      notify(`خطأ: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy("");
    }
  }

  const isUp = status?.opencode === "UP";

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a0a0a] text-zinc-100">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 bg-black/50 backdrop-blur px-3 py-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isUp ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
            <span className="font-mono text-xs truncate" dir="ltr">{sandboxId.slice(0, 20)}…</span>
            <span className="hidden md:inline text-xs text-zinc-400">OpenCode الأصلية • port 4096 • {status?.status ?? "…"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button disabled={!!busy} onClick={() => action("extend", "/api/sandbox/extend", { sandboxId, extraMs: 15 * 60 * 1000 }, "تم التمديد 15 دقيقة ✓")} className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10 disabled:opacity-50">{busy === "extend" ? "…" : "+15د"}</button>
            <button disabled={!!busy} onClick={() => action("snapshot", "/api/sandbox/snapshot", { sandboxId }, "تم حفظ Snapshot ✓")} className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10 disabled:opacity-50">{busy === "snapshot" ? "…" : "Snapshot"}</button>
            <button onClick={() => setSharing(true)} className="px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 text-xs hover:bg-violet-500/20">مشاركة</button>
            <a href={proxyUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold">تبويب جديد ↗</a>
            <button disabled={!!busy} onClick={() => { if (confirm("إيقاف الجلسة؟ سيُحفظ Snapshot + Git push تلقائياً قبل الإيقاف.")) action("stop", "/api/sandbox/stop", { sandboxId }, "تم الإيقاف والحفظ ✓"); }} className="px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-200 text-xs hover:bg-red-500/20 disabled:opacity-50">{busy === "stop" ? "…" : "إيقاف"}</button>
            <a href="/dashboard" className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10">رجوع</a>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-2 flex gap-1 overflow-x-auto pb-0.5" aria-label="أدوات الجلسة">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${tab === t.id ? "bg-white text-black" : "border border-white/15 text-zinc-300 hover:bg-white/10"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Body — iframe يبقى مركّباً دائماً حتى لا تُفقد حالة OpenCode عند التنقل */}
      <div className="flex-1 relative min-h-0">
        <div className={tab === "opencode" ? "absolute inset-0" : "absolute inset-0 invisible pointer-events-none"} aria-hidden={tab !== "opencode"}>
          <iframe src={proxyUrl} title="OpenCode Web" className="absolute inset-0 w-full h-full border-0 bg-white" allow="clipboard-read; clipboard-write; fullscreen" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads" />
        </div>

        {tab === "terminal" && (
          <div className="absolute inset-0 overflow-auto p-3 sm:p-4">
            <div className="max-w-5xl mx-auto"><SandboxTerminal sandboxId={sandboxId} /></div>
          </div>
        )}
        {tab === "files" && (
          <div className="absolute inset-0 overflow-auto p-3 sm:p-4">
            <div className="max-w-6xl mx-auto"><FileTree sandboxId={sandboxId} /></div>
          </div>
        )}
        {tab === "logs" && (
          <div className="absolute inset-0 overflow-auto p-3 sm:p-4">
            <div className="max-w-5xl mx-auto"><LogsViewer sandboxId={sandboxId} /></div>
          </div>
        )}
        {tab === "metrics" && (
          <div className="absolute inset-0 overflow-auto p-3 sm:p-4">
            <div className="max-w-3xl mx-auto"><MetricsCard sandboxId={sandboxId} /></div>
          </div>
        )}
      </div>

      <footer className="shrink-0 h-7 border-t border-white/10 bg-black/50 text-[11px] text-zinc-500 flex items-center justify-center px-2 text-center">
        OpenCode {isUp ? "متصل ✓" : "جاري الاتصال…"} — الـ Sandbox مؤقت، يُحفظ عملك في GitHub + Snapshot
      </footer>

      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-full bg-zinc-900 border border-white/15 text-sm shadow-2xl max-w-[92vw] text-center" role="status">{toast}</div>}
      {sharing && <ShareModal sandboxId={sandboxId} onClose={() => setSharing(false)} />}
    </div>
  );
}
