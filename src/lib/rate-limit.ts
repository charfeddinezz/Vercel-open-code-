/**
 * Rate limiting بسيط عبر KV (Upstash Redis)
 * إن لم يكن KV مضبوطاً → يصبح no-op (يسمح بكل شيء)
 */

async function getKv() {
  try {
    const { kv } = await import("@vercel/kv");
    // تحقق سريع من وجود الإعداد
    if (!process.env.KV_REST_API_URL) return null;
    return kv;
  } catch {
    return null;
  }
}

export type Limit = { limit: number; windowSec: number };

export const LIMITS = {
  createSandbox: { limit: 5, windowSec: 60 * 10 }, // 5 sandboxes / 10m
  exec: { limit: 60, windowSec: 60 }, // 60 exec / min
  proxy: { limit: 1000, windowSec: 60 },
} satisfies Record<string, Limit>;

export async function checkRateLimit(key: string, { limit, windowSec }: Limit): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const kv = await getKv();
  if (!kv) return { ok: true, remaining: limit, resetAt: Date.now() + windowSec * 1000 };

  const count = (await kv.incr(key)) as number;
  if (count === 1) await kv.expire(key, windowSec);

  const ttl = await kv.ttl(key);
  const resetAt = Date.now() + (ttl > 0 ? ttl : windowSec) * 1000;

  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

export function rateKey(req: Request, action: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const user = req.headers.get("x-user-id") ?? "anon";
  return `rl:${action}:${user}:${ip}`;
}
