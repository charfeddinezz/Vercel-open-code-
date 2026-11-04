import Link from "next/link";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold">OC</div>
            <span className="font-semibold tracking-tight">OpenCode Cloud</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/10">Vercel Sandbox • Node22</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition">لوحة التحكم</Link>
            <Link href="/login" className="px-4 py-2 rounded-full border border-white/15 text-sm hover:bg-white/10 transition">تسجيل الدخول</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> الخيار A — OpenCode الأصلي 100%
            </p>
            <p className="mr-2 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 font-semibold">
              💸 مجاني بالكامل — 0$ وبدون بطاقة ائتمان
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight">
              واجهة OpenCode الأصلية
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">على Vercel، في جيبك</span>
            </h1>
            <p className="mt-4 text-zinc-400 leading-7">
              AI Agent لإنشاء وتعديل المشاريع، قراءة الملفات وإعادة هيكلتها، Terminal كامل، جلسات متعددة، Git وGitHub، واختيار النماذج — كلها تعمل داخل Vercel Sandbox المعزول. افتحها من هاتفك.
            </p>

            <div className="mt-6">
              <InstallPrompt />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/connect" className="px-5 py-3 rounded-xl bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white font-bold hover:opacity-90 transition">🔗 اربط كل شيء مجاناً (دقيقتان)</Link>
              <Link href="/dashboard" className="px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-100 transition">ابدأ جلسة جديدة →</Link>
              <a href="https://opencode.ai/docs" target="_blank" className="px-5 py-3 rounded-xl border border-white/15 hover:bg-white/10 transition text-sm">توثيق OpenCode</a>
              <a href="https://openrouter.ai/keys" target="_blank" className="px-5 py-3 rounded-xl border border-white/15 hover:bg-white/10 transition text-sm">احصل على OpenRouter Key</a>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
              {[
                "واجهة الويب الأصلية (port 4096)",
                "حماية بكلمة مرور + حسابات متعددة",
                "استعادة المشاريع بعد انتهاء Sandbox",
                "دعم النماذج المجانية :free",
                "يعمل على Android / iOS / PC",
                "GitHub لحفظ كل شيء تلقائياً",
              ].map((t) => (
                <li key={t} className="flex gap-2 text-zinc-300"><span className="text-emerald-400">✓</span> {t}</li>
              ))}
            </ul>
          </div>

          {/* Architecture card */}
          <div className="rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur">
            <p className="text-sm font-semibold text-zinc-200">البنية — كيف تعمل</p>
            <pre className="mt-3 text-[12px] leading-6 bg-black/50 rounded-xl p-4 border border-white/10 overflow-auto" dir="ltr">
{`Android / PC
      │
      ▼
 Vercel Deployment (Next.js)
      │
      ▼
 Vercel Sandbox (Firecracker microVM)
      │  • Node22  • 4 vCPU
      │  • Port 4096 exposed → https://sb-xxxx.vercel.run
      ▼
   OpenCode
   ├─ web --hostname 0.0.0.0 --port 4096
   ├─ TUI attach (اختياري)
   └─ Sessions + Terminal
      │
   ┌──┴──┐
   │     │
GitHub  OpenRouter
(حفظ)  (AI Models)`}
            </pre>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-center">Sandbox مؤقت</span>
              <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-center">إعادة تشغيل تلقائي</span>
              <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-center">Snapshot + Git</span>
            </div>
            <p className="mt-3 text-xs text-zinc-400">الـ Sandbox له مدة (5m افتراضي، 45m Hobby، 5h Pro). نحن نحفظ مشاريعك في GitHub ونلتقط snapshot قبل الانتهاء.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "جلسات متعددة", d: "كل جلسة = Sandbox معزول. شغّل عدة مشاريع بالتوازي.", k: "Multi-session" },
            { t: "Terminal حقيقي", d: "تنفيذ الأوامر داخل الـ VM مباشرة — sudo متاح.", k: "Terminal" },
            { t: "استعادة ذكية", d: "بعد انتهاء Sandbox: استرجع كل شيء من GitHub + Blob snapshot.", k: "Restore" },
            { t: "اختيار النماذج", d: "OpenRouter + النماذج المجانية. بدّل النموذج لكل جلسة.", k: "Models" },
            { t: "أمان", d: "كلمة مرور للخادم، تشفير للمفاتيح، عزل لكل مستخدم.", k: "Security" },
            { t: "مُحسّن للهاتف", d: "واجهة PWA سريعة، تعمل كـ App على Android.", k: "PWA" },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-zinc-400">{f.k}</p>
              <p className="mt-1 font-semibold">{f.t}</p>
              <p className="mt-1 text-sm text-zinc-400 leading-6">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7">
          <strong className="text-amber-200">نقطة مهمة جداً:</strong> لا تضع <code className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10">OPENROUTER_API_KEY</code> في كود الواجهة. نحن نخزّنها مشفّرة في الخادم فقط ونمرّرها كـ env داخل الـ Sandbox.
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        مبني بـ Next.js + @vercel/sandbox + OpenCode • يعمل على Vercel • <a className="underline" href="https://opencode.ai">opencode.ai</a>
      </footer>
    </main>
  );
}
