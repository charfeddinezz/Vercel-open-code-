import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSandbox } from "@/lib/sandbox-manager";

const Body = z.object({
  sandboxId: z.string().min(1),
  cmd: z.string().min(1).max(2000),
  timeoutMs: z.number().optional().default(30_000),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const sb = await getSandbox(body.sandboxId);
    const res = await sb.runCommand({ cmd: "bash", args: ["-lc", body.cmd] });
    const stdout = await res.stdout();
    const stderr = await res.stderr();
    return NextResponse.json({ exitCode: res.exitCode, stdout: stdout.toString(), stderr: stderr.toString() });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
