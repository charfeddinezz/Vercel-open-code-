import { notFound, redirect } from "next/navigation";
import { getShare, incrementShareViews } from "@/lib/share";
import { getSessionMeta } from "@/lib/persistence";
import type { SandboxSession } from "@/lib/sandbox-manager";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/**
 * /s/[id] — فتح جلسة مشتركة عبر رابط مؤقت
 */
export default async function SharedSessionPage({ params }: Props) {
  const { id } = await params;

  let share = null;
  try {
    share = await getShare(id);
  } catch {
    notFound();
  }
  if (!share) notFound();

  if (new Date(share.expiresAt).getTime() < Date.now()) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-100 p-6">
        <div className="text-center max-w-md rounded-3xl border border-white/10 p-8">
          <p className="text-4xl">⏰</p>
          <h1 className="mt-3 font-bold">انتهى رابط المشاركة</h1>
          <p className="mt-2 text-sm text-zinc-400">اطلب من صاحب الجلسة إنشاء رابط جديد.</p>
          <a href="/dashboard" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold">إنشاء جلستك الخاصة</a>
        </div>
      </main>
    );
  }

  if (share.maxViews && share.views >= share.maxViews) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-100 p-6">
        <div className="text-center max-w-md rounded-3xl border border-white/10 p-8">
          <h1 className="font-bold">تم بلوغ حد المشاهدات</h1>
          <a href="/dashboard" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold">إنشاء جلستك الخاصة</a>
        </div>
      </main>
    );
  }

  const meta = await getSessionMeta<SandboxSession>(`sb:${share.sandboxId}`);
  if (!meta) notFound();

  await incrementShareViews(id);
  redirect(`/session/${encodeURIComponent(share.sandboxId)}`);
}
