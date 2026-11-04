import { NextRequest, NextResponse } from "next/server";
import { getSandbox } from "@/lib/sandbox-manager";
import { estimateCost } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const sandboxId = req.nextUrl.searchParams.get("sandboxId");
  if (!sandboxId) return NextResponse.json({ error: "sandboxId مطلوب" }, { status: 400 });

  try {
    const sb = await getSandbox(sandboxId);
    const anySb = sb as unknown as {
      status: string;
      activeCpuUsageMs?: number;
      networkUsage?: { ingress: number; egress: number };
      timeout?: number;
    };

    // جمع معلومات النظام من داخل الـ VM
    const mem = await sb.runCommand("bash", ["-lc", `free -m | awk 'NR==2{print $2\",\"$3\",\"$4}' 2>&1 || echo "0,0,0"`]);
    const df = await sb.runCommand("bash", ["-lc", `df -h /vercel/sandbox | awk 'NR==2{print $2\",\"$3\",\"$4\",\"$5}' 2>&1 || echo "0,0,0,0%"`]);

    const memStr = (await mem.stdout()).toString().trim();
    const diskStr = (await df.stdout()).toString().trim();

    const base = {
      sandboxId,
      status: anySb.status,
      activeCpuMs: anySb.activeCpuUsageMs,
      network: anySb.networkUsage,
      memory: memStr,
      disk: diskStr,
      timeoutMs: anySb.timeout,
    };

    const cost = anySb.activeCpuUsageMs ? estimateCost({ sandboxId, activeCpuMs: anySb.activeCpuUsageMs, durationMs: 0, vcpus: 4 }) : 0;

    return NextResponse.json({ ...base, estimatedCostUsd: cost });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
