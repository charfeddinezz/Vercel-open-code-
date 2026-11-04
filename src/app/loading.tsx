export default function Loading() {
  return (
    <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-100" aria-busy="true" aria-label="جاري التحميل">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold animate-pulse">OC</div>
        <p className="mt-4 text-sm text-zinc-400">جاري التحميل…</p>
        <div className="mt-3 h-1.5 w-48 mx-auto rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-violet-500 animate-[loading_1.2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes loading{0%{transform:translateX(100%)}50%{transform:translateX(-40%)}100%{transform:translateX(100%)}}`}</style>
      </div>
    </main>
  );
}
