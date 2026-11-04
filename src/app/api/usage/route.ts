import { NextRequest, NextResponse } from "next/server";
import { getUsage } from "@/lib/usage";

/**
 * GET /api/usage?userId=xxx — سجل استخدام النماذج
 */
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? req.nextUrl.searchParams.get("userId") ?? "anon";
  const usage = await getUsage(userId);
  const totalCost = usage.reduce((s, u) => s + (u.costUsd ?? 0), 0);
  return NextResponse.json({ userId, totalCostUsd: totalCost, events: usage });
}
