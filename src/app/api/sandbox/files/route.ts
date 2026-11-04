import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox } from "@/lib/sandbox-manager";
import { toResponse } from "@/lib/errors";

const ListQ = z.object({
  sandboxId: z.string().min(1),
  path: z.string().default("/vercel/sandbox"),
  depth: z.coerce.number().int().min(1).max(5).default(2),
});

/**
 * GET /api/sandbox/files?sandboxId=xxx&path=/vercel/sandbox
 * يستعرض الملفات داخل Sandbox
 */
export async function GET(req: NextRequest) {
  try {
    const q = ListQ.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const sb = await getSandbox(q.sandboxId);

    const cmd = `find "${q.path}" -maxdepth ${q.depth} -type f -o -type d | head -n 500 2>&1 | sort`;
    const res = await sb.runCommand("bash", ["-lc", cmd]);
    const out = (await res.stdout()).toString();

    // أيضاً تفاصيل ls -la
    const ls = await sb.runCommand("bash", ["-lc", `ls -la "${q.path}" 2>&1 | head -n 200`]);
    const lsOut = (await ls.stdout()).toString();

    return NextResponse.json({ sandboxId: q.sandboxId, path: q.path, tree: out.split("\n").filter(Boolean), ls: lsOut });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}

const WriteBody = z.object({
  sandboxId: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
  encoding: z.enum(["utf8", "base64"]).default("utf8"),
});

/**
 * POST /api/sandbox/files — كتابة ملف
 */
export async function POST(req: NextRequest) {
  try {
    const body = WriteBody.parse(await req.json());
    const sb = await getSandbox(body.sandboxId);

    const buf = body.encoding === "base64" ? Buffer.from(body.content, "base64") : Buffer.from(body.content, "utf8");

    // نستخدم writeFiles للكتابة الآمنة
    await sb.writeFiles([{ path: body.path, content: buf }]);

    return NextResponse.json({ ok: true, path: body.path, bytes: buf.length });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}
