import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, { ok: boolean; hint?: string }> = {
    openrouter: { ok: Boolean(process.env.OPENROUTER_API_KEY), hint: "أضف OPENROUTER_API_KEY في Vercel Env" },
    vercel_token: { ok: Boolean(process.env.VERCEL_TOKEN ?? process.env.VERCEL_PROJECT_ID), hint: "vercel env pull أو أضف VERCEL_TOKEN" },
    kv: { ok: Boolean(process.env.KV_REST_API_URL), hint: "اختياري — للـ rate limit والـ heartbeat" },
    postgres: { ok: Boolean(process.env.POSTGRES_URL), hint: "اختياري — لحفظ المشاريع" },
    encryption: { ok: Boolean(process.env.ENCRYPTION_KEY), hint: "اختياري — لتشفير مفاتيح المستخدمين" },
  };

  const allOk = checks.openrouter.ok;
  return NextResponse.json({
    ok: allOk,
    version: "1.2.0",
    runtime: "node22",
    time: new Date().toISOString(),
    checks,
  });
}
