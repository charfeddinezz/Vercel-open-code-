import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox, snapshotSandbox } from "@/lib/sandbox-manager";
import { saveSessionMeta } from "@/lib/persistence";
import { toResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

const Body = z.object({
  sandboxId: z.string().min(1),
  keepSnapshot: z.boolean().optional().default(true),
  gitPush: z.boolean().optional().default(true),
  commitMessage: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const userId = req.headers.get("x-user-id") ?? "anon";
    const sb = await getSandbox(body.sandboxId);

    // 1) snapshot أولاً (قبل أي تغيير قد يفشل)
    let snapshotId: string | undefined;
    if (body.keepSnapshot) {
      try {
        snapshotId = await snapshotSandbox(body.sandboxId);
        await saveSessionMeta(`snap:${body.sandboxId}`, { snapshotId, at: new Date().toISOString() }, 7 * 24 * 3600);
        logger.info("stop:snapshot ok", { sandboxId: body.sandboxId, snapshotId });
      } catch (e) {
        logger.warn("stop:snapshot failed", { error: String(e) });
      }
    }

    // 2) git commit + push (مع رسالة مخصصة)
    if (body.gitPush) {
      const msg = body.commitMessage ?? `chore: auto-save from OpenCode Cloud ${new Date().toISOString()}`;
      try {
        await sb.runCommand({
          cmd: "bash",
          args: ["-lc", `cd /vercel/sandbox && git add -A && git diff --cached --quiet || (git commit -m "${msg.replace(/"/g, '\\"')}" && git push || echo "push failed — no remote/auth")`],
        });
      } catch (e) {
        logger.warn("stop:git failed", { error: String(e) });
      }
    }

    // 3) جمع المقاييس قبل الإيقاف
    let metrics: Record<string, unknown> = {};
    try {
      const anySb = sb as unknown as { activeCpuUsageMs?: number; networkUsage?: unknown };
      metrics = { activeCpuMs: anySb.activeCpuUsageMs, network: anySb.networkUsage };
    } catch {}

    await sb.stop();
    await audit({ action: "sandbox.stop", userId, sandboxId: body.sandboxId, meta: { snapshotId, ...metrics } });
    logger.info("sandbox:stopped", { sandboxId: body.sandboxId });

    return NextResponse.json({ ok: true, snapshotId, metrics });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}
