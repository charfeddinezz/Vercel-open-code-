"use client";

export function QrCard({ url, title = "افتح على هاتفك" }: { url: string; title?: string }) {
  const qr = `/api/qr?text=${encodeURIComponent(url)}`;
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
      <h3 className="font-bold text-sm">{title} 📱</h3>
      <p className="text-[11px] text-zinc-400 mt-1">امسح الرمز بكاميرا هاتفك — يفتح نفس الصفحة فوراً، دون كتابة أي رابط</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt="QR Code" width={176} height={176} className="mx-auto mt-3 rounded-2xl bg-white p-1" loading="lazy" />
      <p className="mt-2 text-[11px] font-mono text-zinc-500 break-all" dir="ltr">{url}</p>
    </div>
  );
}
