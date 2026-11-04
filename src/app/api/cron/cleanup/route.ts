import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized cron" }, { status: 401 });
  }
  // تنظيف مفاتيح KV المنتهية — KV يفعلها تلقائياً عبر TTL، لكن ننظف الـ snapshots القديمة
  try {
    const keys = await kv.keys("snap:*");
    return NextResponse.json({ ok: true, snapshots: keys.length });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
