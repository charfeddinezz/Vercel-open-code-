import { NextRequest, NextResponse } from "next/server";
import { execSchema } from "@/lib/validation";
import { checkRateLimit, rateKey, LIMITS } from "@/lib/rate-limit";
import { toResponse } from "@/lib/errors";
import { getSandbox } from "@/lib/sandbox-manager";
import { audit } from "@/lib/audit";

// أوامر محظورة (حماية)
const BLOCKED = [/rm\s+-rf\s+\//, /mkfs/, /dd\s+if=/, /:\(\)\{\s*:\|\:&\s*\};:/];

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(rateKey(req, "exec"), LIMITS.exec);
  if (!rl.ok) return NextResponse.json({ error: "تم تجاوز الحد — انتظر قليلاً", code: "RATE_LIMITED" }, { status: 429 });

  try {
    const body = execSchema.parse(await req.json());

    // فحص الأمان
    for (const re of BLOCKED) {
      if (re.test(body.cmd)) return NextResponse.json({ error: "أمر محظور لأسباب أمنية", code: "FORBIDDEN" }, { status: 403 });
    }

    const userId = req.headers.get("x-user-id") ?? "anon";
    const sb = await getSandbox(body.sandboxId);

    const full = body.cwd ? `cd "${body.cwd}" && ${body.cmd}` : body.cmd;
    const res = await sb.runCommand({
      cmd: "bash",
      args: ["-lc", full],
      ...(body.sudo ? { sudo: true } : {}),
    });

    const stdout = (await res.stdout()).toString();
    const stderr = (await res.stderr()).toString();

    await audit({ action: "sandbox.exec", userId, sandboxId: body.sandboxId, meta: { cmd: body.cmd.slice(0, 200) } });

    return NextResponse.json({ exitCode: res.exitCode, stdout, stderr }, { headers: { "X-RateLimit-Remaining": String(rl.remaining) } });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}
