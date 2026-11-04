import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox, snapshotSandbox } from "@/lib/sandbox-manager";
import { saveSessionMeta } from "@/lib/persistence";

const Body = z.object({
  sandboxId: z.string().min(1),
  keepSnapshot: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const sb = await getSandbox(body.sandboxId);

    // 1) commit تلقائي إلى GitHub إن كان المشروع مرتبطاً
    try {
      await sb.runCommand({
        cmd: "bash",
        args: ["-lc", `cd /vercel/sandbox && git add -A && git diff --cached --quiet || (git commit -m "chore: auto-save from OpenCode Cloud $(date -u +%FT%TZ)" && git push || echo "push failed — no remote or no auth")`],
      });
    } catch (e) {
      console.warn("[stop] auto-commit failed", e);
    }

    // 2) snapshot كخطة احتياط (يبقى 7 أيام)
    let snapshotId: string | undefined;
    if (body.keepSnapshot) {
      try {
        snapshotId = await snapshotSandbox(body.sandboxId);
        await saveSessionMeta(`snap:${body.sandboxId}`, { snapshotId, at: new Date().toISOString() }, 7 * 24 * 3600);
      } catch (e) {
        console.warn("[stop] snapshot failed", e);
      }
    }

    // 3) إيقاف
    await sb.stop();

    return NextResponse.json({ ok: true, snapshotId });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
