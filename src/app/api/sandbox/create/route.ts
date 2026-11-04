import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOpencodeSandbox } from "@/lib/sandbox-manager";
import { getSessionMeta, saveSessionMeta } from "@/lib/persistence";

const Body = z.object({
  projectName: z.string().min(1).max(64).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().min(1).optional(),
  password: z.string().optional(),
  vcpus: z.number().min(1).max(8).optional(),
  timeoutMs: z.number().min(60_000).max(5 * 60 * 60 * 1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    // هوية المستخدم — في الإنتاج من next-auth session
    // هنا نسمح بالوصول المجهول مع حصر عبر IP + تخزين مؤقت
    const userId = req.headers.get("x-user-id") ?? `anon-${req.headers.get("x-forwarded-for") ?? "local"}`.slice(0, 64);
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY غير مضبوط في Vercel Env — أضفه ثم أعد النشر." }, { status: 500 });
    }

    // إن كانت هناك snapshot سابقة للمشروع، نستعيدها
    const snapshotId = body.projectName ? (await getSessionMeta<{ snapshotId: string }>(`snap:${body.projectName}`))?.snapshotId : undefined;

    const session = await createOpencodeSandbox({
      userId,
      projectName: body.projectName,
      githubUrl: body.githubUrl || undefined,
      openRouterKey,
      model: body.model,
      password: body.password,
      vcpus: body.vcpus,
      timeoutMs: body.timeoutMs,
      snapshotId,
    });

    // حفظ الميتاداتا للـ proxy والـ heartbeat
    await saveSessionMeta(`sb:${session.sandboxId}`, session, 24 * 3600);

    return NextResponse.json(session, { status: 201 });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[api/sandbox/create]", e);
    return NextResponse.json({ error: e.message ?? "فشل إنشاء Sandbox" }, { status: 500 });
  }
}
