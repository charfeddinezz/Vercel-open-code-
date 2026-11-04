"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type SandboxRow = {
  sandboxId: string;
  domain: string;
  status: string;
  createdAt: string;
  projectName?: string;
};

export default function DashboardPage() {
  const [sandboxes, setSandboxes] = useState<SandboxRow[]>([]);
  const [projectName, setProjectName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [model, setModel] = useState("meta-llama/llama-3.3-70b-instruct:free");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    try {
      const r = await fetch("/api/sandbox/list");
      const j = await r.json();
      setSandboxes(j.sandboxes ?? []);
    } catch {}
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  async function create() {
    setBusy(true);
    setMsg("جاري إنشاء الـ Sandbox وتثبيت OpenCode… قد يستغرق 20-40 ثانية");
    try {
      const r = await fetch("/api/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, githubUrl, model, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "فشل الإنشاء");
      setMsg(`تم! افتح: ${j.opencodeUrl}`);
      setTimeout(refresh, 1500);
    } catch (e: unknown) {
      const err = e as Error;
      setMsg(`خطأ: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">← الرئيسية</Link>
        <span className="text-sm text-zinc-400">لوحة التحكم — OpenCode Cloud</span>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-5 gap-6">
        {/* Create */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold">جلسة جديدة — Sandbox + OpenCode</h2>
          <p className="text-xs text-zinc-400 mt-1">سيُنشأ Sandbox جديد، يُثبّت OpenCode، ويُكشف على المنفذ 4096.</p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm">اسم المشروع</span>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="my-app" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none focus:border-violet-500" />
            </label>
            <label className="block">
              <span className="text-sm">GitHub URL (اختياري)</span>
              <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you/repo.git" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none focus:border-violet-500" dir="ltr" />
            </label>
            <label className="block">
              <span className="text-sm">النموذج (OpenRouter)</span>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none" dir="ltr">
                <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B :free</option>
                <option value="qwen/qwen-2.5-72b-instruct:free">Qwen 2.5 72B :free</option>
                <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash :free</option>
                <option value="deepseek/deepseek-r1:free">DeepSeek R1 :free</option>
                <option value="openrouter/auto">openrouter/auto (مدفوع)</option>
                <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">كلمة مرور للخادم (اختياري لكن مُستحسن)</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl bg-black border border-white/10 px-3 py-2.5 outline-none focus:border-violet-500" />
            </label>

            <button onClick={create} disabled={busy} className="w-full mt-2 rounded-xl bg-white text-black font-semibold py-3 hover:bg-zinc-100 disabled:opacity-50">
              {busy ? "جاري التشغيل…" : "إنشاء جلسة وفتح OpenCode"}
            </button>
            {msg && <p className="text-xs leading-6 p-3 rounded-xl bg-white/5 border border-white/10 break-all">{msg}</p>}
            <p className="text-[11px] text-zinc-500 leading-5">الـ Sandbox مؤقت. نحفظ تلقائياً في GitHub + snapshot قبل الانتهاء. يمكنك استعادة الجلسة لاحقاً.</p>
          </div>
        </section>

        {/* List */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">جلساتك النشطة</h2>
            <button onClick={refresh} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/10">تحديث</button>
          </div>

          {sandboxes.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-400">لا توجد جلسات نشطة. أنشئ واحدة الآن.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {sandboxes.map((s) => (
                <li key={s.sandboxId} className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs break-all">{s.sandboxId}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-200">{s.status}</span>
                  </div>
                  <a href={s.domain} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-violet-300 hover:underline break-all" dir="ltr">{s.domain}</a>
                  <div className="mt-3 flex gap-2">
                    <a href={`/session/${encodeURIComponent(s.sandboxId)}`} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">فتح</a>
                    <button onClick={async () => { await fetch("/api/sandbox/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sandboxId: s.sandboxId }) }); refresh(); }} className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10">إيقاف وحفظ</button>
                    <button onClick={async () => { await fetch("/api/sandbox/extend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sandboxId: s.sandboxId, extraMs: 15*60*1000 }) }); refresh(); }} className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10">تمديد +15د</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs leading-6">
            <strong>تذكير:</strong> الـ Sandbox له حد زمني (45m للـ Hobby، 5h للـ Pro). نحن نلتقط <code>snapshot</code> ونزامن مع GitHub تلقائياً. لا تترك عملاً غير محفوظ دون دفع.
          </div>
        </section>
      </main>
    </div>
  );
}
