"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ModelPicker } from "@/components/ModelPicker";
import { ShareModal } from "@/components/ShareModal";
import { TEMPLATES } from "@/lib/templates";
import { usePreferences } from "@/lib/preferences";
import { InstallPrompt } from "@/components/InstallPrompt";

type SandboxRow = {
  sandboxId: string;
  domain: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  projectName?: string;
  runtime?: string;
  vcpus?: number;
};

type Health = { ok: boolean; checks: Record<string, { ok: boolean; hint?: string }> };

export default function DashboardPage() {
  const [sandboxes, setSandboxes] = useState<SandboxRow[]>([]);
  const [projectName, setProjectName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [model, setModel] = useState("meta-llama/llama-3.3-70b-instruct:free");
  const [password, setPassword] = useState("");
  const [vcpus, setVcpus] = useState(4);
  const [runtime, setRuntime] = useState("node22");
  const [timeoutMin, setTimeoutMin] = useState(30);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [rowBusy, setRowBusy] = useState("");
  const [shareId, setShareId] = useState<string | null>(null);
  const [template, setTemplate] = useState("blank");
  const prefs = usePreferences();

  // تطبيق التفضيلات المحفوظة عند أول تحميل
  useEffect(() => {
    setModel(prefs.defaultModel);
    setRuntime(prefs.defaultRuntime);
    setVcpus(prefs.defaultVcpus);
    setTimeoutMin(prefs.defaultTimeoutMin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/sandbox/list");
      const j = await r.json();
      setSandboxes(j.sandboxes ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {});
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  const filtered = useMemo(
    () => sandboxes.filter((s) => !query || s.sandboxId.toLowerCase().includes(query.toLowerCase()) || (s.projectName ?? "").toLowerCase().includes(query.toLowerCase())),
    [sandboxes, query]
  );

  async function create() {
    setBusy(true);
    setIsError(false);
    setMsg("جاري إنشاء الـ Sandbox وتثبيت OpenCode… قد يستغرق 20-60 ثانية (التثبيت الأول أبطأ)");
    try {
      const r = await fetch("/api/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: projectName || undefined, githubUrl: githubUrl || undefined, model, password: password || undefined, vcpus, runtime, timeoutMs: timeoutMin * 60 * 1000, template }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error([j.error, j.hint].filter(Boolean).join(" — "));
      setMsg(`تم إنشاء الجلسة ✓ — جاري فتح OpenCode…`);
      setTimeout(() => (window.location.href = `/session/${encodeURIComponent(j.sandboxId)}`), 800);
    } catch (e: unknown) {
      setIsError(true);
      setMsg(`خطأ: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function rowAction(id: string, action: "extend" | "stop" | "snapshot") {
    if (action === "stop" && !confirm("إيقاف الجلسة؟ سيُحفظ Snapshot + Git push قبل الإيقاف.")) return;
    setRowBusy(`${id}:${action}`);
    try {
      const path = action === "extend" ? "/api/sandbox/extend" : action === "stop" ? "/api/sandbox/stop" : "/api/sandbox/snapshot";
      const body = action === "extend" ? { sandboxId: id, extraMs: 15 * 60 * 1000 } : { sandboxId: id };
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "فشل");
      setMsg(action === "extend" ? "تم التمديد 15 دقيقة ✓" : action === "stop" ? "تم الإيقاف والحفظ ✓" : `تم حفظ Snapshot ✓ ${j.snapshotId ?? ""}`);
      setIsError(false);
      refresh();
    } catch (e) {
      setIsError(true);
      setMsg(`خطأ: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRowBusy("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">← OpenCode Cloud</Link>
        <div className="flex items-center gap-2">
          {health && (
            <a href="/api/health" target="_blank" rel="noreferrer" className={`text-[11px] px-2.5 py-1 rounded-full border ${health.ok ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200" : "bg-amber-500/10 border-amber-500/25 text-amber-200"}`}>
              {health.ok ? "● النظام جاهز" : "● تحقق من الإعداد"}
            </a>
          )}
          <Link href="/status" className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/10">حالة النظام</Link>
          <Link href="/settings" className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/10">⚙️ الإعدادات</Link>
          <span className="hidden sm:inline text-sm text-zinc-400">لوحة التحكم</span>
        </div>
      </header>

      {health && !health.ok && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-7">
            <strong className="text-amber-200">تنبيه إعداد:</strong>{" "}
            {Object.entries(health.checks).filter(([, v]) => !v.ok).map(([k, v]) => `${k}: ${v.hint ?? "غير مضبوط"}`).join(" • ")}{" "}
            — راجع <Link href="/api/health" className="underline">/api/health</Link> و docs/SETUP.md
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <InstallPrompt />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 grid lg:grid-cols-5 gap-5">
        {/* Create */}
        <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-5 h-fit lg:sticky lg:top-[72px]">
          <h2 className="font-bold">جلسة جديدة — Sandbox + OpenCode</h2>
          <p className="text-xs text-zinc-400 mt-1 leading-5">يُنشأ Sandbox معزول، يُثبّت OpenCode الأصلي، ويُكشف على المنفذ 4096 بواجهته الكاملة.</p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm">اسم المشروع</span>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="my-app" dir="ltr" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none focus:border-violet-500" />
            </label>
            <label className="block">
              <span className="text-sm">GitHub URL (اختياري — لاستنساخ مشروع)</span>
              <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you/repo.git" dir="ltr" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none focus:border-violet-500" />
            </label>

            <label className="block">
              <span className="text-sm">قالب المشروع</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} type="button" onClick={() => { setTemplate(t.id); setModel(t.suggestedModel); if (t.id !== "blank" && !githubUrl) setRuntime(t.runtime); }} className={`rounded-xl border p-3 text-right transition ${template === t.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-black hover:border-white/25"}`} aria-pressed={template === t.id}>
                    <span className="text-base">{t.icon} <span className="text-sm font-semibold">{t.name}</span></span>
                    <span className="block text-[11px] text-zinc-400 mt-1 leading-4">{t.description}</span>
                  </button>
                ))}
              </div>
              {githubUrl && <span className="block text-[11px] text-amber-300 mt-1">عند وجود رابط GitHub يُستنسخ المستودع ويُتجاهل القالب.</span>}
            </label>

            <ModelPicker value={model} onChange={setModel} />

            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-xs text-zinc-400">Runtime</span>
                <select value={runtime} onChange={(e) => setRuntime(e.target.value)} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-2 py-2 text-xs" dir="ltr">
                  <option value="node22">node22</option>
                  <option value="node24">node24</option>
                  <option value="python3.13">python3.13</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">vCPUs</span>
                <select value={vcpus} onChange={(e) => setVcpus(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-2 py-2 text-xs">
                  {[1, 2, 4, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">المدة (دقيقة)</span>
                <select value={timeoutMin} onChange={(e) => setTimeoutMin(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-2 py-2 text-xs">
                  {[5, 15, 30, 45, 60, 120, 300].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <p className="text-[11px] text-zinc-500">الحد الأقصى يعتمد على خطتك: 5د افتراضي، 45د Hobby، 5س Pro. يمكنك التمديد لاحقاً.</p>

            <label className="block">
              <span className="text-sm">كلمة مرور الخادم (مُستحسنة)</span>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none focus:border-violet-500" />
            </label>

            <button onClick={create} disabled={busy} className="w-full rounded-xl bg-white text-black font-bold py-3.5 hover:bg-zinc-100 disabled:opacity-50 transition">
              {busy ? "جاري التشغيل… (20-60 ثانية)" : "إنشاء جلسة مجانية وفتح OpenCode ←"}
            </button>
            <p className="text-center text-[11px] text-emerald-300/90">🆓 الوضع المجاني مفعّل — النماذج المدفوعة محظورة تلقائياً حتى لا تدفع شيئاً أبداً</p>
            {msg && <p className={`text-xs leading-6 p-3 rounded-xl border break-words ${isError ? "bg-red-500/10 border-red-500/25 text-red-200" : "bg-white/5 border-white/10"}`} role="status">{msg}</p>}
            <p className="text-[11px] text-zinc-500 leading-5">الـ Sandbox مؤقت. نحفظ تلقائياً في GitHub + Snapshot قبل الانتهاء، ويمكنك الاستعادة باسم المشروع نفسه.</p>
          </div>
        </section>

        {/* List */}
        <section className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-bold">جلساتك النشطة <span className="text-zinc-500 font-normal text-sm">({filtered.length})</span></h2>
              <div className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث…" className="rounded-full bg-black border border-white/10 px-3 py-1.5 text-xs outline-none focus:border-violet-500 w-32" />
                <button onClick={refresh} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/10">تحديث</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-8 text-center py-8">
                <p className="text-4xl">📭</p>
                <p className="mt-2 text-sm text-zinc-400">{query ? "لا نتائج مطابقة للبحث." : "لا توجد جلسات نشطة. أنشئ واحدة الآن من النموذج."}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {filtered.map((s) => (
                  <li key={s.sandboxId} className="rounded-2xl border border-white/10 bg-black/40 p-4 hover:border-violet-500/30 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs break-all" dir="ltr">{s.sandboxId}</span>
                      <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${s.status === "running" ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-200" : "bg-zinc-500/15 border-zinc-500/25 text-zinc-300"}`}>{s.status}</span>
                    </div>
                    {s.projectName && <p className="mt-1 text-sm font-medium">{s.projectName}</p>}
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {new Date(s.createdAt).toLocaleString("ar")} {s.runtime ? `• ${s.runtime}` : ""} {s.vcpus ? `• ${s.vcpus} vCPU` : ""} {s.expiresAt ? `• ينتهي ${new Date(s.expiresAt).toLocaleTimeString("ar")}` : ""}
                    </p>
                    {s.domain && <a href={s.domain} target="_blank" rel="noreferrer" className="mt-1.5 block text-xs text-violet-300 hover:underline break-all" dir="ltr">{s.domain}</a>}
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      <Link href={`/session/${encodeURIComponent(s.sandboxId)}`} className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold">فتح OpenCode</Link>
                      <button disabled={!!rowBusy} onClick={() => rowAction(s.sandboxId, "extend")} className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10 disabled:opacity-50">{rowBusy === `${s.sandboxId}:extend` ? "…" : "+15 دقيقة"}</button>
                      <button disabled={!!rowBusy} onClick={() => rowAction(s.sandboxId, "snapshot")} className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10 disabled:opacity-50">{rowBusy === `${s.sandboxId}:snapshot` ? "…" : "Snapshot"}</button>
                      <button onClick={() => setShareId(s.sandboxId)} className="px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 text-xs">مشاركة</button>
                      <button disabled={!!rowBusy} onClick={() => rowAction(s.sandboxId, "stop")} className="px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-200 text-xs hover:bg-red-500/20 disabled:opacity-50">{rowBusy === `${s.sandboxId}:stop` ? "…" : "إيقاف وحفظ"}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-center">
            {[
              { n: String(sandboxes.length), l: "جلسات نشطة" },
              { n: "4096", l: "منفذ OpenCode" },
              { n: ":free", l: "نماذج مجانية متاحة" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xl font-black" dir="ltr">{s.n}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {shareId && <ShareModal sandboxId={shareId} onClose={() => setShareId(null)} />}
    </div>
  );
}
