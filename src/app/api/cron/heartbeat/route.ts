import { NextRequest, NextResponse } from "next/server";
import { listSandboxes, extendSandbox } from "@/lib/sandbox-manager";
import { heartbeat } from "@/lib/persistence";

/**
 * Cron كل 10 دقائق: يمدّد الـ timeout للـ sandboxes النشطة
 * ويحدّث heartbeat في KV
 */
export async function GET(req: NextRequest) {
  // تحقق من سر الـ Cron
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized cron" }, { status: 401 });
  }

  try {
    const sandboxes = await listSandboxes(50);
    let extended = 0;
    for (const sb of sandboxes) {
      const id = (sb as unknown as { sandboxId: string }).sandboxId;
      try {
        // مدّد 10 دقائق إضافية
        await extendSandbox(id, 10 * 60 * 1000);
        await heartbeat(id);
        extended++;
      } catch {}
    }
    return NextResponse.json({ ok: true, checked: sandboxes.length, extended });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
