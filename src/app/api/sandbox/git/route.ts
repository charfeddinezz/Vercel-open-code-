import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox } from "@/lib/sandbox-manager";
import { buildGitCommand, isGitAction, GIT_ACTIONS } from "@/lib/git";
import { checkRateLimit, rateKey, LIMITS } from "@/lib/rate-limit";
import { toResponse } from "@/lib/errors";

const Q = z.object({
  sandboxId: z.string().min(1),
  action: z.string().default("status"),
  cwd: z.string().max(512).optional().default("/vercel/sandbox"),
});

/**
 * GET /api/sandbox/git?sandboxId=xxx&action=status|log|diff|branches|remotes
 * قائمة بيضاء فقط — لا أوامر حرة عبر هذا المسار
 */
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(rateKey(req, "exec"), LIMITS.exec);
  if (!rl.ok) return NextResponse.json({ error: "تم تجاوز الحد", code: "RATE_LIMITED" }, { status: 429 });

  try {
    const q = Q.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    if (!isGitAction(q.action)) {
      return NextResponse.json({ error: `إجراء غير مسموح — المتاح: ${GIT_ACTIONS.join(", ")}`, code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const sb = await getSandbox(q.sandboxId);
    const res = await sb.runCommand("bash", ["-lc", `cd "${q.cwd}" && ${buildGitCommand(q.action)}`]);
    const out = (await res.stdout()).toString();
    const err = (await res.stderr()).toString();
    return NextResponse.json({ sandboxId: q.sandboxId, action: q.action, output: out || err || "(لا يوجد Git هنا بعد — أنشئ مشروعاً أو شغّل git init من Terminal)" });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}
