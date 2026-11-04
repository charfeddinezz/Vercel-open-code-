import { NextResponse } from "next/server";
import { listSandboxes } from "@/lib/sandbox-manager";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    let sandboxes: unknown[] = [];
    try {
      sandboxes = await listSandboxes(20);
    } catch (e) {
      logger.warn("list:sandbox SDK failed", { error: String(e) });
    }

    // KV fallback
    let kvSandboxes: unknown[] = [];
    try {
      const { kv } = await import("@vercel/kv");
      if (process.env.KV_REST_API_URL) {
        const keys = await kv.keys("sb:*");
        if (keys.length) {
          const vals = await kv.mget(...keys);
          kvSandboxes = vals.filter(Boolean).map((v) => (typeof v === "string" ? JSON.parse(v) : v));
        }
      }
    } catch {}

    const merged = [
      ...(sandboxes as Record<string, unknown>[]).map((s) => ({
        sandboxId: (s as { sandboxId?: string; id?: string }).sandboxId ?? (s as { id?: string }).id,
        domain: (s as { domain?: string }).domain ?? "",
        status: (s as { status?: string }).status ?? "running",
        createdAt: (s as { createdAt?: string }).createdAt ?? new Date().toISOString(),
      })),
      ...(kvSandboxes as Record<string, unknown>[]),
    ];

    // إزالة التكرار
    const seen = new Set<string>();
    const dedup = merged.filter((s: unknown) => {
      const id = (s as { sandboxId: string }).sandboxId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return NextResponse.json({ sandboxes: dedup });
  } catch (e) {
    const err = e as Error;
    logger.error("api:sandbox/list failed", { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
