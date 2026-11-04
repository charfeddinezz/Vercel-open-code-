import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createShareId, saveShare } from "@/lib/share";
import { getSessionMeta } from "@/lib/persistence";
import type { SandboxSession } from "@/lib/sandbox-manager";

const Body = z.object({
  sandboxId: z.string().min(1),
  ttlSec: z.number().int().min(60).max(7 * 24 * 3600).default(3600),
  maxViews: z.number().int().min(1).max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const meta = await getSessionMeta<SandboxSession>(`sb:${body.sandboxId}`);
    if (!meta) return NextResponse.json({ error: "Sandbox غير موجود أو انتهى" }, { status: 404 });

    const userId = req.headers.get("x-user-id") ?? "anon";
    const link = {
      id: createShareId(),
      sandboxId: body.sandboxId,
      createdBy: userId,
      expiresAt: new Date(Date.now() + body.ttlSec * 1000).toISOString(),
      maxViews: body.maxViews,
      views: 0,
      passwordProtected: meta.passwordProtected,
    };

    await saveShare(link, body.ttlSec);

    const base = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    return NextResponse.json({ ...link, url: `${base}/s/${link.id}` }, { status: 201 });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
