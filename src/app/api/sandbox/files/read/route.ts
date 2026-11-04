import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox } from "@/lib/sandbox-manager";
import { toResponse } from "@/lib/errors";

const Q = z.object({
  sandboxId: z.string().min(1),
  path: z.string().min(1),
  maxBytes: z.coerce.number().int().min(100).max(500_000).default(100_000),
});

export async function GET(req: NextRequest) {
  try {
    const q = Q.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const sb = await getSandbox(q.sandboxId);

    // استخدم runCommand لقراءة الملف مع تحديد الحجم
    const res = await sb.runCommand("bash", ["-lc", `head -c ${q.maxBytes} "${q.path}" 2>&1; echo "---EXIT:$?"`]);
    const out = (await res.stdout()).toString();

    // بديل: readFileToBuffer إن كان متاحاً
    let viaBuffer: string | null = null;
    try {
      const anySb = sb as unknown as { readFileToBuffer: (o: { path: string }) => Promise<Buffer | null> };
      if (typeof anySb.readFileToBuffer === "function") {
        const buf = await anySb.readFileToBuffer({ path: q.path });
        if (buf) viaBuffer = buf.toString("utf8").slice(0, q.maxBytes);
      }
    } catch {}

    return NextResponse.json({ sandboxId: q.sandboxId, path: q.path, content: viaBuffer ?? out, maxBytes: q.maxBytes });
  } catch (e) {
    const { status, body } = toResponse(e);
    return NextResponse.json(body, { status });
  }
}
