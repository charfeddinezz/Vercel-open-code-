"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** زر تثبيت التطبيق على الهاتف (Android prompt + تعليمات iOS) */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (installed || dismissed) return null;
  if (!deferred && !isIos) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  return (
    <div className="rounded-3xl border border-violet-500/25 bg-violet-500/10 p-4 flex items-start gap-3">
      <span className="text-2xl">📲</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">ثبّت التطبيق على هاتفك — مجاناً</p>
        {deferred ? (
          <p className="text-xs text-zinc-400 mt-0.5 leading-5">أيقونة على شاشتك الرئيسية، يفتح بملء الشاشة كتطبيق حقيقي.</p>
        ) : (
          <p className="text-xs text-zinc-400 mt-0.5 leading-5">في Safari: اضغط زر <strong className="text-zinc-200">المشاركة ⬆️</strong> ثم <strong className="text-zinc-200">"إضافة إلى الشاشة الرئيسية"</strong>.</p>
        )}
      </div>
      {deferred && (
        <button onClick={install} className="shrink-0 px-4 py-2 rounded-full bg-white text-black text-xs font-bold">تثبيت</button>
      )}
      <button onClick={() => setDismissed(true)} className="shrink-0 text-zinc-500 px-1" aria-label="إغلاق">✕</button>
    </div>
  );
}
