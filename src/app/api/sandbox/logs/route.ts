import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox } from "@/lib/sandbox-manager";
import { toResponse } from "@/lib/errors";

const Q = z.object({
  sandboxId: z.string().min(1),
  lines: z.coerce.number().int().min(1).max(500).default(100),
  source: z.enum(["opencode", "system"]).default("opencode"),
});

/**
 * GET /api/sandbox/logs?sandboxId=sbx_xxx&lines=200&source=opencode
 * يقرأ /tmp/opencode.log داخل الـ Sandbox
 */
export async function GET(req: NextRequest) {
  try {
    const q = Q.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const sb = await getSandbox(q.sandboxId);

    const file = q.source === "opencode" ? "/tmp/opencode.log" : "/tmp/bootstrap.log";
    const res = await sb.runCommand("bash", ["-lc", `tail -n ${q.lines} ${file} 2>&1 || echo "no logs yet"`]);
    const out = (await res.stdout()).toString();

    return NextResponse.json({ sandboxId: q.sandboxId, source: q.source, lines: q.lines, log: out });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}
