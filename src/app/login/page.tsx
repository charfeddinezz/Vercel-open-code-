"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function github() {
    setBusy("github");
    await signIn("github", { callbackUrl: "/dashboard" });
  }

  async function credentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy("credentials");
    setError("");
    const res = await signIn("credentials", { password, callbackUrl: "/dashboard", redirect: false });
    if (res?.error) {
      setError("كلمة المرور غير صحيحة — أو أن OPENCODE_SERVER_PASSWORD غير مضبوطة على الخادم.");
      setBusy("");
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[#0a0a0a] text-zinc-100">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/[0.04] p-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-black">OC</div>
          <div>
            <h1 className="text-xl font-bold leading-6">تسجيل الدخول</h1>
            <p className="text-xs text-zinc-400">حسابات متعددة — جلساتك محفوظة باسمك</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button onClick={github} disabled={!!busy} className="flex items-center justify-center gap-2 w-full rounded-xl bg-white text-black font-semibold py-3 hover:bg-zinc-100 disabled:opacity-50">
            {busy === "github" ? "جاري التوجيه…" : "🐙 المتابعة عبر GitHub"}
          </button>
          <p className="text-[11px] text-zinc-500 text-center">يمنح التطبيق صلاحية مستودعاتك لحفظ مشاريعك تلقائياً</p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-white/10" /> أو <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={credentials} className="space-y-3">
            <input name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة مرور الخادم" className="w-full rounded-xl bg-black border border-white/10 px-3 py-3 outline-none focus:border-violet-500" aria-label="كلمة مرور الخادم" />
            {error && <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3 leading-5" role="alert">{error}</p>}
            <button disabled={!!busy || !password} className="w-full rounded-xl border border-white/15 py-3 hover:bg-white/10 text-sm disabled:opacity-50">
              {busy === "credentials" ? "جاري التحقق…" : "دخول بكلمة المرور"}
            </button>
          </form>

          <p className="text-[11px] leading-5 text-zinc-500">
            كلمة المرور تُضبط عبر <code className="px-1 py-0.5 rounded bg-black border border-white/10" dir="ltr">OPENCODE_SERVER_PASSWORD</code> في Vercel. راجع حالة الإعداد في <Link href="/status" className="text-violet-300 underline">صفحة الحالة</Link>.
          </p>

          <Link href="/dashboard" className="block text-center text-sm text-violet-300 hover:underline">تخطي → لوحة التحكم</Link>
        </div>
      </div>
    </div>
  );
}
