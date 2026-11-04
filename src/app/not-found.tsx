import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-100 p-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">404</p>
        <h1 className="mt-3 font-bold text-xl">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-7">ربما انتهت الجلسة أو تغيّر الرابط. الـ Sandbox مؤقت بطبيعته — أنشئ جلسة جديدة واستعد مشروعك من GitHub.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold">إنشاء جلسة جديدة</Link>
          <Link href="/" className="px-5 py-2.5 rounded-xl border border-white/15 text-sm hover:bg-white/10">الرئيسية</Link>
        </div>
      </div>
    </main>
  );
}
