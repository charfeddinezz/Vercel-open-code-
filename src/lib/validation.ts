/**
 * طبقة تحقق موحّدة + رسائل عربية
 */
import { z } from "zod";

export const projectNameSchema = z
  .string()
  .min(1, "اسم المشروع مطلوب")
  .max(64, "الاسم طويل جداً (64 حرف كحد أقصى)")
  .regex(/^[a-zA-Z0-9-_]+$/, "يُسمح بالأحرف والأرقام و - و _ فقط");

export const githubUrlSchema = z
  .string()
  .url("رابط GitHub غير صالح")
  .refine((v) => v.includes("github.com"), "يجب أن يكون رابط GitHub")
  .optional()
  .or(z.literal(""));

export const sandboxCreateSchema = z.object({
  projectName: projectNameSchema.optional(),
  githubUrl: githubUrlSchema,
  model: z.string().min(1).max(128).optional(),
  password: z.string().max(128).optional(),
  vcpus: z.number().int().min(1).max(8).optional(),
  timeoutMs: z.number().int().min(60_000).max(5 * 60 * 60 * 1000).optional(),
  runtime: z.enum(["node22", "node24", "python3.13"]).optional(),
  ports: z.array(z.number().int().min(1024).max(65535)).max(5).optional(),
});

export const execSchema = z.object({
  sandboxId: z.string().min(1, "معرّف Sandbox مطلوب"),
  cmd: z.string().min(1).max(4000),
  cwd: z.string().max(512).optional(),
  timeoutMs: z.number().int().min(1_000).max(120_000).optional(),
  sudo: z.boolean().optional(),
});

export const fileOpSchema = z.object({
  sandboxId: z.string().min(1),
  path: z.string().min(1).max(1024),
  content: z.string().max(2_000_000).optional(), // 2MB
  encoding: z.enum(["utf8", "base64"]).optional().default("utf8"),
});
