import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extendSandbox } from "@/lib/sandbox-manager";

const Body = z.object({
  sandboxId: z.string().min(1),
  extraMs: z.number().min(60_000).max(5 * 60 * 60 * 1000).default(15 * 60 * 1000),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    await extendSandbox(body.sandboxId, body.extraMs);
    return NextResponse.json({ ok: true, extendedByMs: body.extraMs });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
