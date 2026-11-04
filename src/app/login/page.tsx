import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[#0a0a0a] text-zinc-100">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-xl font-bold">تسجيل الدخول</h1>
        <p className="text-sm text-zinc-400 mt-1">اختر طريقة الدخول — ندعم حسابات متعددة.</p>

        <div className="mt-6 space-y-3">
          <a href="/api/auth/signin" className="flex items-center justify-center gap-2 w-full rounded-xl bg-white text-black font-semibold py-3 hover:bg-zinc-100">
            المتابعة عبر GitHub
          </a>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-white/10" /> أو <span className="h-px flex-1 bg-white/10" />
          </div>

          <form action="/api/auth/callback/credentials" method="post" className="space-y-3">
            <input name="password" type="password" placeholder="كلمة مرور الخادم (OPENCODE_SERVER_PASSWORD)" className="w-full rounded-xl bg-black border border-white/10 px-3 py-3 outline-none focus:border-violet-500" />
            <input type="hidden" name="csrfToken" value="" />
            <button className="w-full rounded-xl border border-white/15 py-3 hover:bg-white/10 text-sm">دخول بكلمة المرور</button>
          </form>

          <p className="text-[11px] leading-5 text-zinc-500">
            ملاحظة: كلمة المرور تُضبط عبر متغير البيئة <code className="px-1 py-0.5 rounded bg-black border border-white/10">OPENCODE_SERVER_PASSWORD</code> في Vercel. لا تشاركها علناً.
          </p>

          <Link href="/dashboard" className="block text-center text-sm text-violet-300 hover:underline">تخطي → لوحة التحكم</Link>
        </div>
      </div>
    </div>
  );
}
