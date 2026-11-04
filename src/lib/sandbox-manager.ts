/**
 * Vercel Sandbox Manager — جوهر الخيار A (محسّن v2)
 *
 * • إنشاء Sandbox مع تثبيت OpenCode + retry + logging
 * • كشف المنفذ 4096 والحصول على URL عام
 * • إدارة lifecycle: heartbeat، snapshot، استعادة، تمديد، مراقبة
 */
import { Sandbox } from "@vercel/sandbox";
import { OPENCODE, SANDBOX } from "./constants";
import { logger } from "./logger";
import { withRetry } from "./retry";
import { audit } from "./audit";
import { getTemplate } from "./templates";

async function applyTemplate(sandbox: Sandbox, templateId: string) {
  const t = getTemplate(templateId);
  logger.info("template:apply", { template: t.id });
  if (t.files.length) {
    await sandbox.writeFiles(t.files.map((f) => ({ path: f.path, content: Buffer.from(f.content) })));
  }
  for (const cmd of t.commands) {
    try {
      await sandbox.runCommand({ cmd: "bash", args: ["-lc", cmd] });
    } catch (e) {
      logger.warn("template:command failed", { cmd: cmd.slice(0, 80), error: String(e) });
    }
  }
}

// ── Types ──

export type SandboxSession = {
  sandboxId: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  domain: string;
  port: number;
  status: "pending" | "running" | "stopping" | "stopped" | "failed";
  createdAt: string;
  expiresAt: string;
  opencodeUrl: string;
  passwordProtected: boolean;
  runtime: string;
  vcpus: number;
};

export type CreateOpts = {
  userId: string;
  projectId?: string;
  projectName?: string;
  githubUrl?: string;
  githubToken?: string;
  openRouterKey: string;
  model?: string;
  password?: string;
  vcpus?: number;
  timeoutMs?: number;
  runtime?: "node22" | "node24" | "python3.13";
  snapshotId?: string;
  templateId?: string;
  ports?: number[];
};

// ── Helpers ──

function sandboxEnv(opts: CreateOpts) {
  return {
    OPENROUTER_API_KEY: opts.openRouterKey,
    OPENCODE_SERVER_PASSWORD: opts.password ?? process.env.OPENCODE_SERVER_PASSWORD ?? "",
    ...(opts.githubToken ? { GITHUB_TOKEN: opts.githubToken } : {}),
    HOME: "/home/vercel-sandbox",
    // تحسينات بيئة
    NODE_ENV: "production",
    OPENCODE_LOG_LEVEL: "info",
  };
}

function sandboxName(opts: CreateOpts): string {
  const slug = (opts.projectName ?? "opencode").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 32);
  return `opencode-${opts.userId.slice(0, 8)}-${slug}-${Date.now().toString(36)}`;
}

function vercelAuth() {
  return {
    ...(process.env.VERCEL_TOKEN ? { token: process.env.VERCEL_TOKEN } : {}),
    ...(process.env.VERCEL_TEAM_ID ? { teamId: process.env.VERCEL_TEAM_ID } : {}),
    ...(process.env.VERCEL_PROJECT_ID ? { projectId: process.env.VERCEL_PROJECT_ID } : {}),
  };
}

// ── Core (مع retry) ──

export async function createOpencodeSandbox(opts: CreateOpts): Promise<SandboxSession> {
  const t = logger.time("sandbox:create");
  const name = sandboxName(opts);
  const password = opts.password ?? process.env.OPENCODE_SERVER_PASSWORD ?? "";
  const runtime = opts.runtime ?? SANDBOX.runtime;
  const ports = opts.ports ?? SANDBOX.exposePorts;

  logger.info("sandbox:create start", { name, runtime, ports, userId: opts.userId });

  const sandbox = await withRetry(
    () =>
      Sandbox.create({
        ...vercelAuth(),
        runtime,
        resources: { vcpus: opts.vcpus ?? SANDBOX.vcpus },
        timeout: opts.timeoutMs ?? SANDBOX.defaultTimeoutMs,
        ports,
        ...(opts.snapshotId
          ? { source: { type: "snapshot" as const, snapshotId: opts.snapshotId } }
          : opts.githubUrl
            ? { source: { type: "git" as const, url: opts.githubUrl } }
            : {}),
        env: sandboxEnv(opts),
      }),
    { retries: 2, baseMs: 1000, maxMs: 8000, label: "Sandbox.create" }
  );

  logger.info("sandbox:created", { sandboxId: sandbox.sandboxId });

  // 1) تثبيت OpenCode (مع retry)
  await withRetry(() => installOpencodeIfNeeded(sandbox), {
    retries: 1,
    baseMs: 2000,
    maxMs: 10000,
    label: "installOpencode",
  });

  // 2) كتابة إعداد opencode.json
  await configureOpencode(sandbox, opts);

  // 2.5) زرع قالب المشروع (إن طُلب ولم نستعد Snapshot/مستودعاً)
  if (opts.templateId && !opts.snapshotId && !opts.githubUrl) {
    await applyTemplate(sandbox, opts.templateId);
  }

  // 3) التحقق من المشروع
  if (opts.githubUrl && !opts.snapshotId) {
    await sandbox.runCommand({ cmd: "bash", args: ["-lc", `ls /vercel/sandbox 2>&1 | head -n 20`] });
  }

  // 4) تشغيل OpenCode web detached
  await startOpencodeWeb(sandbox, password);

  // 5) انتظار المنفذ
  await waitForPort(sandbox, ports[0], 30_000);

  const domain = sandbox.domain(ports[0]);
  if (!domain) throw new Error("فشل الحصول على نطاق Sandbox — تأكد من إعداد ports");

  const session: SandboxSession = {
    sandboxId: sandbox.sandboxId,
    userId: opts.userId,
    projectId: opts.projectId,
    projectName: opts.projectName,
    domain,
    port: ports[0],
    status: (sandbox.status as SandboxSession["status"]) ?? "running",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (opts.timeoutMs ?? SANDBOX.defaultTimeoutMs)).toISOString(),
    opencodeUrl: domain,
    passwordProtected: Boolean(password),
    runtime,
    vcpus: opts.vcpus ?? SANDBOX.vcpus,
  };

  await audit({ action: "sandbox.create", userId: opts.userId, sandboxId: sandbox.sandboxId, meta: { runtime, vcpus: session.vcpus } });
  t.end({ sandboxId: sandbox.sandboxId });
  return session;
}

async function installOpencodeIfNeeded(sandbox: Sandbox) {
  const check = await sandbox.runCommand("bash", ["-lc", `command -v opencode || echo MISSING`]);
  const out = (await check.stdout()).toString();
  if (!out.includes("MISSING")) {
    logger.info("opencode:already installed", { out: out.trim() });
    return;
  }

  logger.info("opencode:installing...");
  const install = await sandbox.runCommand({ cmd: "bash", args: ["-lc", `curl -fsSL ${OPENCODE.installUrl} | bash`] });
  if (install.exitCode !== 0) {
    const err = (await install.stderr()).toString();
    throw new Error(`فشل تثبيت OpenCode: ${err}`);
  }
  await sandbox.runCommand({ cmd: "bash", args: ["-lc", `echo 'export PATH="$HOME/.opencode/bin:$PATH"' >> ~/.bashrc`] });
  logger.info("opencode:installed");
}

async function configureOpencode(sandbox: Sandbox, opts: CreateOpts) {
  const model = opts.model ?? "openrouter/auto";
  const config = {
    $schema: "https://opencode.ai/config.json",
    model,
    provider: {
      openrouter: {
        apiKey: "{env:OPENROUTER_API_KEY}",
        baseURL: "https://openrouter.ai/api/v1",
      },
    },
    server: {
      hostname: OPENCODE.hostname,
      port: OPENCODE.port,
    },
    permission: { edit: "allow", bash: "allow" },
    // إعدادات إضافية لتحسين التجربة
    autoupdate: false,
  };

  const json = Buffer.from(JSON.stringify(config, null, 2));
  await sandbox.writeFiles([
    { path: ".config/opencode/opencode.json", content: json },
    { path: "opencode.json", content: json },
  ]);
  logger.info("opencode:configured", { model });
}

async function startOpencodeWeb(sandbox: Sandbox, password: string) {
  const env: Record<string, string> = {};
  if (password) env.OPENCODE_SERVER_PASSWORD = password;

  const cmd = await sandbox.runCommand({
    cmd: "bash",
    args: [
      "-lc",
      `export PATH="$HOME/.opencode/bin:$PATH"; nohup opencode web --hostname ${OPENCODE.hostname} --port ${OPENCODE.port} > /tmp/opencode.log 2>&1 & echo $!; sleep 0.5; cat /tmp/opencode.log | tail -n 5 || true`,
    ],
    env: Object.keys(env).length ? env : undefined,
  });

  if (cmd.exitCode !== 0) {
    const err = (await cmd.stderr()).toString();
    throw new Error(`فشل تشغيل opencode web: ${err}`);
  }
  logger.info("opencode:web started", { log: (await cmd.stdout()).toString().slice(0, 500) });
}

async function waitForPort(sandbox: Sandbox, port: number, timeoutMs: number) {
  const start = Date.now();
  let lastOut = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await sandbox.runCommand("bash", ["-lc", `curl -sf http://127.0.0.1:${port}/ >/dev/null 2>&1 && echo READY || echo WAIT`]);
      const out = (await res.stdout()).toString();
      lastOut = out;
      if (out.includes("READY")) {
        logger.info("sandbox:port ready", { port, waitedMs: Date.now() - start });
        return;
      }
    } catch (e) {
      logger.debug("waitForPort error", { error: String(e) });
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  logger.warn("sandbox:port timeout", { port, timeoutMs, lastOut });
}

// ── Lifecycle ──

export async function getSandbox(sandboxId: string) {
  const sb = await (Sandbox as unknown as { get: (o: { sandboxId: string }) => Promise<Sandbox> }).get({ sandboxId });
  return sb;
}

export async function stopSandbox(sandboxId: string) {
  const sb = await getSandbox(sandboxId);
  await sb.stop();
  logger.info("sandbox:stopped", { sandboxId });
}

export async function extendSandbox(sandboxId: string, extraMs: number) {
  const sb = await getSandbox(sandboxId);
  await (sb as unknown as { extendTimeout: (ms: number) => Promise<void> }).extendTimeout(extraMs);
  logger.info("sandbox:extended", { sandboxId, extraMs });
}

export async function snapshotSandbox(sandboxId: string, expirationMs = 7 * 24 * 60 * 60 * 1000) {
  const sb = await getSandbox(sandboxId);
  const snap = await (sb as unknown as { snapshot: (o: { expiration: number }) => Promise<{ snapshotId: string }> }).snapshot({
    expiration: expirationMs,
  });
  logger.info("sandbox:snapshot", { sandboxId, snapshotId: snap.snapshotId });
  return snap.snapshotId;
}

export async function listSandboxes(limit = 20) {
  const res = await (Sandbox as unknown as { list: (o: { limit: number }) => Promise<{ sandboxes: Sandbox[] }> }).list({ limit });
  return res.sandboxes;
}

export async function runInSandbox(sandboxId: string, cmd: string, opts?: { cwd?: string; sudo?: boolean; timeoutMs?: number }) {
  const sb = await getSandbox(sandboxId);
  const full = opts?.cwd ? `cd "${opts.cwd}" && ${cmd}` : cmd;
  const result = await sb.runCommand({
    cmd: "bash",
    args: ["-lc", full],
    ...(opts?.sudo ? { sudo: true } : {}),
  });
  const stdout = (await result.stdout()).toString();
  const stderr = (await result.stderr()).toString();
  return { exitCode: result.exitCode, stdout, stderr };
}
