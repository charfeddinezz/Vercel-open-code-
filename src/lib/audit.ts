/**
 * سجل التدقيق — كل عملية حساسة تُسجل
 */
import { logger } from "./logger";

export type AuditEvent = {
  action:
    | "sandbox.create"
    | "sandbox.stop"
    | "sandbox.extend"
    | "sandbox.exec"
    | "sandbox.snapshot"
    | "sandbox.proxy"
    | "project.create"
    | "project.delete"
    | "github.clone"
    | "auth.login"
    | "share.create";
  userId: string;
  sandboxId?: string;
  projectId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
};

export async function audit(event: AuditEvent) {
  logger.info(`audit:${event.action}`, { ...event, ts: new Date().toISOString() });

  // إن كان KV مضبوطاً، احفظ آخر 100 حدث
  try {
    const { kv } = await import("@vercel/kv");
    if (!process.env.KV_REST_API_URL) return;
    const key = `audit:${event.userId}`;
    await kv.lpush(key, JSON.stringify(event));
    await kv.ltrim(key, 0, 99);
    await kv.expire(key, 30 * 24 * 3600);
  } catch {}
}
