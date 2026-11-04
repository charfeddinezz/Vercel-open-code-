/**
 * طبقة الحفظ — تضمن عدم ضياع المشاريع بعد انتهاء Sandbox المؤقت
 *
 * الاستراتيجية:
 *  1) GitHub هو المصدر الأساسي (commit تلقائي عند الإيقاف)
 *  2) Vercel Blob لحفظ snapshot كـ tar.gz كاحتياط
 *  3) KV لتتبع heartbeat والجلسات وحالة الـ Sandbox
 */

export type ProjectSnapshot = {
  projectId: string;
  userId: string;
  sandboxId: string;
  snapshotId?: string;
  blobUrl?: string;
  githubPushedAt?: string;
  createdAt: string;
};

// — KV helpers (يعمل حتى بدون إعداد — يصبح no-op)

async function kv() {
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

export async function saveSessionMeta(key: string, data: unknown, ttlSec = 3600 * 24) {
  const client = await kv();
  if (!client) return;
  await client.set(key, JSON.stringify(data), { ex: ttlSec });
}

export async function getSessionMeta<T>(key: string): Promise<T | null> {
  const client = await kv();
  if (!client) return null;
  const raw = await client.get<string>(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export async function heartbeat(sandboxId: string) {
  const client = await kv();
  if (!client) return;
  await client.set(`hb:${sandboxId}`, Date.now().toString(), { ex: 600 });
}

export async function isAlive(sandboxId: string): Promise<boolean> {
  const client = await kv();
  if (!client) return true;
  const v = await client.get(`hb:${sandboxId}`);
  return Boolean(v);
}
