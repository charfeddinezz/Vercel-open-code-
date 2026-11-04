import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "OpenCode Cloud — واجهة OpenCode الأصلية على Vercel",
  description:
    "شغّل OpenCode بكامل إمكانياته داخل Vercel Sandbox: AI Agent، Terminal، جلسات متعددة، GitHub، واختيار النماذج — يعمل على هاتفك.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-violet-500/30">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
