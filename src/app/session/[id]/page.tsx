type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const { id } = await params;

  // في الإنتاج: نجلب domain من KV/DB عبر sandboxId
  // هنا نعرض iframe proxy — يمر عبر /api/sandbox/proxy/[sandboxId]
  const proxyUrl = `/api/sandbox/proxy/${encodeURIComponent(id)}/`;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      <header className="h-12 border-b border-white/10 bg-black/40 backdrop-blur flex items-center justify-between px-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs">{id.slice(0, 12)}…</span>
          <span className="hidden sm:inline text-zinc-400">— OpenCode الأصلية (port 4096)</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={proxyUrl} target="_blank" className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">فتح في تبويب جديد</a>
          <a href="/dashboard" className="px-3 py-1.5 rounded-full border border-white/15 text-xs hover:bg-white/10">رجوع</a>
        </div>
      </header>

      <div className="flex-1 relative">
        {/* iframe للـ OpenCode web */}
        <iframe
          src={proxyUrl}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          allow="clipboard-read; clipboard-write; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
        {/* Fallback إن كان الـ Sandbox متوقفاً */}
        <noscript className="absolute inset-0 grid place-items-center bg-[#0a0a0a] text-zinc-400 text-sm p-6">
          فعّل JavaScript لعرض واجهة OpenCode. أو افتح الرابط مباشرة في تبويب جديد.
        </noscript>
      </div>

      <footer className="h-7 border-t border-white/10 bg-black/40 text-[11px] text-zinc-500 flex items-center justify-center">
        محسّن للهاتف — اسحب للتكبير • يعمل عبر Vercel Sandbox Proxy
      </footer>
    </div>
  );
}
