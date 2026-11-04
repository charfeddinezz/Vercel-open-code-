/**
 * تتبع استخدام النماذج + تقدير التكلفة
 */
import { logger } from "./logger";

export type UsageEvent = {
  userId: string;
  sandboxId: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  at: string;
};

export async function recordUsage(ev: UsageEvent) {
  logger.info("model:usage", ev as unknown as Record<string, unknown>);
  try {
    const { kv } = await import("@vercel/kv");
    if (!process.env.KV_REST_API_URL) return;
    await kv.lpush(`usage:${ev.userId}`, JSON.stringify(ev));
    await kv.ltrim(`usage:${ev.userId}`, 0, 499);
  } catch {}
}

export async function getUsage(userId: string, limit = 50): Promise<UsageEvent[]> {
  try {
    const { kv } = await import("@vercel/kv");
    const raw = await kv.lrange(`usage:${userId}`, 0, limit - 1);
    return (raw as string[]).map((s) => (typeof s === "string" ? JSON.parse(s) : s));
  } catch {
    return [];
  }
}
