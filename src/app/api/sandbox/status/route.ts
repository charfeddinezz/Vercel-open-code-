import { NextRequest, NextResponse } from "next/server";
import { getSandbox } from "@/lib/sandbox-manager";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("sandboxId");
  if (!id) return NextResponse.json({ error: "sandboxId مطلوب" }, { status: 400 });
  try {
    const sb = await getSandbox(id);
    // محاولة ping داخل الـ VM
    const ping = await sb.runCommand("bash", ["-lc", "curl -sf http://127.0.0.1:4096/ >/dev/null && echo UP || echo DOWN"]);
    const out = (await ping.stdout()).toString().trim();
    return NextResponse.json({ sandboxId: id, status: (sb as unknown as { status: string }).status, opencode: out });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
