/**
 * تشفير مفاتيح المستخدمين (OpenRouter, GitHub) قبل حفظها في DB/KV
 * AES-256-GCM باستخدام ENCRYPTION_KEY
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function getKey(): Buffer {
  const b64 = process.env.ENCRYPTION_KEY;
  if (!b64) throw new Error("ENCRYPTION_KEY غير مضبوط");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY يجب أن يكون 32 bytes (base64)");
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv:tag:ciphertext كـ base64
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decrypt(token: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = token.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("تنسيق التشفير غير صالح");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

// للتحقق من وجود مفتاح دون كشفه
export function maskKey(key: string): string {
  if (!key || key.length < 8) return "***";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}
