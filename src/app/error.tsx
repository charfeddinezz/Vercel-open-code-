"use client";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-100 p-6">
      <div className="max-w-md w-full text-center rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-3 font-bold text-xl">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-7">{error.message || "تعذر تحميل هذه الصفحة."}</p>
        {error.digest && <p className="mt-2 text-[11px] font-mono text-zinc-500" dir="ltr">digest: {error.digest}</p>}
        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={reset} className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold">إعادة المحاولة</button>
          <a href="/dashboard" className="px-5 py-2.5 rounded-xl border border-white/15 text-sm hover:bg-white/10">لوحة التحكم</a>
        </div>
      </div>
    </main>
  );
}
