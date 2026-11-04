/**
 * التحقق من متغيرات البيئة عند الإقلاع — رسائل مساعدة واضحة
 */
import { z } from "zod";

const Env = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "أضف OPENROUTER_API_KEY من https://openrouter.ai/keys").optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  POSTGRES_URL: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
});

export type Env = z.infer<typeof Env>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    console.warn("[env] تحذير:", parsed.error.issues.map((i) => i.message).join(", "));
    return process.env as unknown as Env;
  }
  cached = parsed.data;
  return cached;
}

export function requireEnv(key: keyof Env, help: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} غير مضبوط — ${help}`);
  return v;
}
