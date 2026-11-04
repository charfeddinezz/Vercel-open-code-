/**
 * مشاركة الجلسات عبر رابط مؤقت (share link)
 * يتطلب KV — بدونه تُرفض العمليات برسالة واضحة بدل فشل صامت
 */
import { randomBytes } from "node:crypto";

export type ShareLink = {
  id: string;
  sandboxId: string;
  createdBy: string;
  expiresAt: string;
  maxViews?: number;
  views: number;
  passwordProtected: boolean;
};

export function createShareId(): string {
  return `sh_${randomBytes(8).toString("hex")}`;
}

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// يُحفظ في KV مع TTL
export async function saveShare(link: ShareLink, ttlSec: number) {
  if (!kvConfigured()) throw new Error("المشاركة تتطلب إعداد Vercel KV (KV_REST_API_URL) — فعّله من Vercel Storage");
  const { kv } = await import("@vercel/kv");
  await kv.set(`share:${link.id}`, JSON.stringify(link), { ex: ttlSec });
  return link;
}

export async function getShare(id: string): Promise<ShareLink | null> {
  if (!kvConfigured()) return null;
  try {
    const { kv } = await import("@vercel/kv");
    const raw = await kv.get<string>(`share:${id}`);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as ShareLink) : (raw as ShareLink);
  } catch {
    return null;
  }
}

export async function incrementShareViews(id: string): Promise<void> {
  if (!kvConfigured()) return;
  try {
    const link = await getShare(id);
    if (!link) return;
    link.views += 1;
    const ttl = Math.max(60, Math.floor((new Date(link.expiresAt).getTime() - Date.now()) / 1000));
    const { kv } = await import("@vercel/kv");
    await kv.set(`share:${id}`, JSON.stringify(link), { ex: ttl });
  } catch {}
}
