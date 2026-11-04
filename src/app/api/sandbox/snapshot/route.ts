import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox, snapshotSandbox } from "@/lib/sandbox-manager";
import { saveSessionMeta } from "@/lib/persistence";

const Body = z.object({
  sandboxId: z.string().min(1),
  expirationMs: z.number().int().min(60_000).max(14 * 24 * 60 * 60 * 1000).optional().default(7 * 24 * 60 * 60 * 1000),
});

/**
 * POST /api/sandbox/snapshot — التقاط snapshot يدوياً
 * GET  /api/sandbox/snapshot?sandboxId=xxx — معلومات الـ snapshot
 */
export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const id = await snapshotSandbox(body.sandboxId, body.expirationMs);
    await saveSessionMeta(`snap:${body.sandboxId}`, { snapshotId: id, at: new Date().toISOString() }, Math.ceil(body.expirationMs / 1000));
    return NextResponse.json({ ok: true, snapshotId: id, expiresInMs: body.expirationMs });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sandboxId = req.nextUrl.searchParams.get("sandboxId");
  if (!sandboxId) return NextResponse.json({ error: "sandboxId مطلوب" }, { status: 400 });
  try {
    const sb = await getSandbox(sandboxId);
    // حاول جلب snapshots المتاحة (إن كان SDK يدعمها)
    const anySb = sb as unknown as { snapshot?: unknown };
    return NextResponse.json({ sandboxId, hasSnapshotSupport: Boolean(anySb.snapshot) });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
