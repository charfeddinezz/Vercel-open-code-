"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/dashboard", label: "جلساتي", icon: "🚀" },
  { href: "/connect", label: "الربط", icon: "🔗" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

/** شريط تنقل سفلي للهاتف — يختفي داخل الجلسة وتسجيل الدخول */
export function MobileBottomNav() {
  const path = usePathname();
  if (path.startsWith("/session") || path.startsWith("/login") || path.startsWith("/s/")) return null;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/85 backdrop-blur-lg" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="التنقل الرئيسي">
      <div className="grid grid-cols-4">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${active ? "text-white" : "text-zinc-500"}`} aria-current={active ? "page" : undefined}>
              <span className={`text-lg leading-none ${active ? "" : "opacity-60"}`}>{it.icon}</span>
              {it.label}
              {active && <span className="h-1 w-1 rounded-full bg-violet-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
