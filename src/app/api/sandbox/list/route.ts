import { NextResponse } from "next/server";
import { listSandboxes } from "@/lib/sandbox-manager";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    // نحاول جلب من الـ SDK + من KV (لأن list قد لا يشمل sandboxes المنتهية)
    let sandboxes: unknown[] = [];
    try {
      sandboxes = await listSandboxes(20);
    } catch (e) {
      console.warn("[list] sandbox list failed, falling back to KV", e);
    }

    // أيضاً من KV
    let kvSandboxes: unknown[] = [];
    try {
      const keys = await kv.keys("sb:*");
      if (keys.length) {
        const vals = await kv.mget(...keys);
        kvSandboxes = vals.filter(Boolean).map((v) => {
          try {
            return typeof v === "string" ? JSON.parse(v) : v;
          } catch {
            return v;
          }
        });
      }
    } catch {}

    const merged = [...(sandboxes as Record<string, unknown>[]).map((s) => ({
      sandboxId: (s as { sandboxId?: string; id?: string }).sandboxId ?? (s as { id?: string }).id,
      domain: (s as { domain?: string }).domain ?? "",
      status: (s as { status?: string }).status ?? "running",
      createdAt: (s as { createdAt?: string }).createdAt ?? new Date().toISOString(),
    })), ...(kvSandboxes as Record<string, unknown>[])];

    return NextResponse.json({ sandboxes: merged });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
