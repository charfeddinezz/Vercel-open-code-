import { NextRequest, NextResponse } from "next/server";
import { createOpencodeSandbox } from "@/lib/sandbox-manager";
import { saveSessionMeta, getSessionMeta } from "@/lib/persistence";
import { sandboxCreateSchema } from "@/lib/validation";
import { checkRateLimit, rateKey, LIMITS } from "@/lib/rate-limit";
import { Errors, toResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Rate limit
  const rl = await checkRateLimit(rateKey(req, "create"), LIMITS.createSandbox);
  if (!rl.ok) {
    const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json({ error: `تم تجاوز الحد — حاول بعد ${retry} ثانية`, code: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const json = await req.json();
    const body = sandboxCreateSchema.parse(json);

    const userId = req.headers.get("x-user-id") ?? `anon-${(req.headers.get("x-forwarded-for") ?? "local").split(",")[0]?.trim()}`.slice(0, 64);
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      const hint = "أضف OPENROUTER_API_KEY في Vercel → Settings → Environment Variables ثم أعد النشر. احصل على مفتاح من https://openrouter.ai/keys";
      logger.warn("sandbox:create missing OPENROUTER_API_KEY");
      return NextResponse.json({ error: "OPENROUTER_API_KEY غير مضبوط", hint, code: "CONFIG_ERROR" }, { status: 500 });
    }

    // استعادة snapshot إن وجد
    const snapshotId = body.projectName ? (await getSessionMeta<{ snapshotId: string }>(`snap:${body.projectName}`))?.snapshotId : undefined;

    logger.info("api:sandbox/create", { projectName: body.projectName, model: body.model, runtime: body.runtime });

    const session = await createOpencodeSandbox({
      userId,
      projectName: body.projectName,
      githubUrl: body.githubUrl || undefined,
      openRouterKey,
      model: body.model,
      password: body.password,
      vcpus: body.vcpus,
      timeoutMs: body.timeoutMs,
      runtime: body.runtime,
      ports: body.ports,
      snapshotId,
    });

    await saveSessionMeta(`sb:${session.sandboxId}`, session, 24 * 3600);
    // أيضاً فهرسة باسم المشروع للاستعادة
    if (body.projectName) await saveSessionMeta(`sb:name:${body.projectName}`, session, 24 * 3600);

    return NextResponse.json(session, { status: 201, headers: { "X-RateLimit-Remaining": String(rl.remaining) } });
  } catch (err: unknown) {
    const { status, body } = toResponse(err);
    logger.error("api:sandbox/create failed", { error: String(err) });
    return NextResponse.json(body, { status });
  }
}
