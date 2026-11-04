/**
 * Sandbox Pool — إعادة استخدام Sandboxes جاهزة لتقليل زمن البدء
 * مفيد للعروض التوضيحية والاختبارات
 */
import { Sandbox } from "@vercel/sandbox";
import { SANDBOX } from "./constants";
import { logger } from "./logger";

export async function warmPool(size = 1) {
  const pool: string[] = [];
  for (let i = 0; i < size; i++) {
    try {
      const sb = await Sandbox.create({
        runtime: SANDBOX.runtime,
        timeout: SANDBOX.defaultTimeoutMs,
        ports: SANDBOX.exposePorts,
      });
      logger.info("pool:warm", { sandboxId: sb.sandboxId });
      pool.push(sb.sandboxId);
    } catch (e) {
      logger.warn("pool:warm failed", { error: String(e) });
    }
  }
  return pool;
}
