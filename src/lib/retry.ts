/**
 * Retry مع backoff أسي — للعمليات التي قد تفشل مؤقتاً (إنشاء Sandbox، تثبيت)
 */
import { logger } from "./logger";

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; baseMs: number; maxMs: number; label: string }
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === opts.retries) break;
      const delay = Math.min(opts.maxMs, opts.baseMs * 2 ** attempt + Math.random() * 200);
      logger.warn(`retry:${opts.label}`, { attempt: attempt + 1, delayMs: Math.round(delay), error: String(err) });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
