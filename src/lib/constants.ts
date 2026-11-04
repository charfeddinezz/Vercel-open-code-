/**
 * الثوابت المركزية — الخيار A: OpenCode الأصلي داخل Vercel Sandbox
 */

export const OPENCODE = {
  port: 4096,
  hostname: "0.0.0.0",
  installUrl: "https://opencode.ai/install",
  binPath: "/home/vercel-sandbox/.opencode/bin/opencode",
  configDir: "/home/vercel-sandbox/.config/opencode",
  // OpenCode يفضّل serve للـ headless، web للواجهة الكاملة
  serveCmd: "serve",
  webCmd: "web",
} as const;

export const SANDBOX = {
  runtime: "node22" as const,
  defaultTimeoutMs: 30 * 60 * 1000, // 30m افتراضي (قابل للتمديد حتى 5h في Pro)
  maxTimeoutMs: 5 * 60 * 60 * 1000,
  heartbeatIntervalMs: 10 * 60 * 1000, // 10m
  idleCheckCron: "*/10 * * * *",
  workDir: "/vercel/sandbox",
  exposePorts: [4096] as number[],
  vcpus: 4,
} as const;

export const MODELS = {
  // قائمة مجانية موصى بها (يتم تحديثها عبر /api/models)
  free: [
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-r1:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "qwen/qwen3-4b:free",
  ],
  recommended: "anthropic/claude-sonnet-4",
  fallbackFree: "openrouter/auto",
} as const;

export const AUTH = {
  sessionCookie: "opencode_session",
  sandboxCookie: "opencode_sandbox",
  passwordEnv: "OPENCODE_SERVER_PASSWORD",
} as const;

export const STORAGE = {
  snapshotPrefix: "opencode/snapshots/",
  projectPrefix: "opencode/projects/",
  sessionPrefix: "opencode/sessions/",
} as const;
