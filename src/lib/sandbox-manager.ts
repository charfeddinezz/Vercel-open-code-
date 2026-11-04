/**
 * Vercel Sandbox Manager — جوهر الخيار A
 *
 * • إنشاء Sandbox مع تثبيت OpenCode
 * • كشف المنفذ 4096 والحصول على URL عام
 * • إدارة الـ lifecycle: heartbeat، snapshot، استعادة
 *
 * التوثيق: https://vercel.com/docs/vercel-sandbox
 */
import { Sandbox } from "@vercel/sandbox";
import { OPENCODE, SANDBOX } from "./constants";

// ── Types ──

export type SandboxSession = {
  sandboxId: string;
  userId: string;
  projectId?: string;
  domain: string; // https://sb-xxxx.vercel.run
  port: number;
  status: "pending" | "running" | "stopping" | "stopped" | "failed";
  createdAt: string;
  expiresAt: string;
  opencodeUrl: string; // domain:4096 مباشرة
  passwordProtected: boolean;
};

export type CreateOpts = {
  userId: string;
  projectId?: string;
  projectName?: string;
  githubUrl?: string; // لاستنساخ مشروع موجود
  githubToken?: string;
  openRouterKey: string;
  model?: string;
  password?: string;
  vcpus?: number;
  timeoutMs?: number;
  // استعادة من snapshot
  snapshotId?: string;
};

// ── Helpers ──

function sandboxEnv(opts: CreateOpts) {
  return {
    OPENROUTER_API_KEY: opts.openRouterKey,
    OPENCODE_SERVER_PASSWORD: opts.password ?? process.env.OPENCODE_SERVER_PASSWORD ?? "",
    // لتمرير الـ GitHub token داخل الـ Sandbox بأمان
    ...(opts.githubToken ? { GITHUB_TOKEN: opts.githubToken } : {}),
    HOME: "/home/vercel-sandbox",
  };
}

function sandboxName(opts: CreateOpts): string {
  const slug = (opts.projectName ?? "opencode").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `opencode-${opts.userId.slice(0, 8)}-${slug}-${Date.now().toString(36)}`;
}

// ── Core ──

export async function createOpencodeSandbox(opts: CreateOpts): Promise<SandboxSession> {
  const name = sandboxName(opts);
  const password = opts.password ?? process.env.OPENCODE_SERVER_PASSWORD ?? "";

  const sandbox = await Sandbox.create({
    // التوكنات تُسحب تلقائياً من VERCEL_TOKEN / VERCEL_PROJECT_ID / VERCEL_TEAM_ID
    // أو مرّرها صراحةً إن كنت تشغّل خارج Vercel
    ...(process.env.VERCEL_TOKEN ? { token: process.env.VERCEL_TOKEN } : {}),
    ...(process.env.VERCEL_TEAM_ID ? { teamId: process.env.VERCEL_TEAM_ID } : {}),
    ...(process.env.VERCEL_PROJECT_ID ? { projectId: process.env.VERCEL_PROJECT_ID } : {}),

    runtime: SANDBOX.runtime,
    resources: { vcpus: opts.vcpus ?? SANDBOX.vcpus },
    timeout: opts.timeoutMs ?? SANDBOX.defaultTimeoutMs,
    ports: SANDBOX.exposePorts,
    // استعادة من snapshot إن وُجد
    ...(opts.snapshotId
      ? { source: { type: "snapshot" as const, snapshotId: opts.snapshotId } }
      : opts.githubUrl
        ? { source: { type: "git" as const, url: opts.githubUrl } }
        : {}),

    env: sandboxEnv(opts),
  });

  // 1) تثبيت OpenCode (إن لم يكن snapshot يحتويه)
  await installOpencodeIfNeeded(sandbox);

  // 2) كتابة إعداد opencode.json
  await configureOpencode(sandbox, opts);

  // 3) استنساخ المشروع إن طُلب ولم يكن source=git
  if (opts.githubUrl && !opts.snapshotId) {
    // source=git يفعلها تلقائياً، لكن نضمن وجود المجلد
    await sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", `ls /vercel/sandbox 2>&1 | head`],
    });
  }

  // 4) تشغيل OpenCode web في الخلفية (detached) على 4096
  const opencodeCmd = await startOpencodeWeb(sandbox, password);

  // انتظر حتى يصبح المنفذ جاهزاً
  await waitForPort(sandbox, SANDBOX.exposePorts[0], 25_000);

  const domain = sandbox.domain(SANDBOX.exposePorts[0]);
  if (!domain) throw new Error("فشل الحصول على نطاق Sandbox — تأكد من إعداد ports");

  return {
    sandboxId: sandbox.sandboxId,
    userId: opts.userId,
    projectId: opts.projectId,
    domain,
    port: SANDBOX.exposePorts[0],
    status: (sandbox.status as SandboxSession["status"]) ?? "running",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (opts.timeoutMs ?? SANDBOX.defaultTimeoutMs)).toISOString(),
    opencodeUrl: domain,
    passwordProtected: Boolean(password),
  };
}

async function installOpencodeIfNeeded(sandbox: Sandbox) {
  // تحقق إن كان مثبتاً
  const check = await sandbox.runCommand("bash", ["-lc", `command -v opencode || echo MISSING`]);
  const out = (await check.stdout()).toString();
  if (!out.includes("MISSING")) return;

  // التثبيت الرسمي
  const install = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", `curl -fsSL ${OPENCODE.installUrl} | bash`],
  });
  if (install.exitCode !== 0) {
    const err = await install.stderr();
    throw new Error(`فشل تثبيت OpenCode: ${err}`);
  }

  // أضف إلى PATH للتأكد
  await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", `echo 'export PATH=\"$HOME/.opencode/bin:$PATH\"' >> ~/.bashrc`],
  });
}

async function configureOpencode(sandbox: Sandbox, opts: CreateOpts) {
  const model = opts.model ?? "openrouter/auto";
  const config = {
    $schema: "https://opencode.ai/config.json",
    model,
    provider: {
      openrouter: {
        // يقرأ المفتاح من البيئة داخل الـ Sandbox
        apiKey: "{env:OPENROUTER_API_KEY}",
      },
    },
    server: {
      hostname: OPENCODE.hostname,
      port: OPENCODE.port,
    },
  };

  await sandbox.writeFiles([
    {
      path: ".config/opencode/opencode.json",
      content: Buffer.from(JSON.stringify(config, null, 2)),
    },
  ]);

  // أيضاً opencode.json في جذر المشروع
  await sandbox.writeFiles([
    {
      path: "opencode.json",
      content: Buffer.from(JSON.stringify(config, null, 2)),
    },
  ]);
}

async function startOpencodeWeb(sandbox: Sandbox, password: string) {
  // نستخدم server.password عبر البيئة OPENCODE_SERVER_PASSWORD
  // https://opencode.ai/docs/web — إذا لم تُضبط، الخادم غير محمي
  const env: Record<string, string> = {};
  if (password) env.OPENCODE_SERVER_PASSWORD = password;

  const cmd = await sandbox.runCommand({
    cmd: "bash",
    args: [
      "-lc",
      // تأكد من PATH ثم شغّل
      `export PATH="$HOME/.opencode/bin:$PATH"; nohup opencode web --hostname ${OPENCODE.hostname} --port ${OPENCODE.port} > /tmp/opencode.log 2>&1 & echo $!`,
    ],
    env: Object.keys(env).length ? env : undefined,
  });

  if (cmd.exitCode !== 0) {
    const err = await cmd.stderr();
    throw new Error(`فشل تشغيل opencode web: ${err}`);
  }
  return cmd;
}

async function waitForPort(sandbox: Sandbox, port: number, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await sandbox.runCommand("bash", [
        "-lc",
        `curl -sf http://127.0.0.1:${port}/ >/dev/null 2>&1 && echo READY || echo WAIT`,
      ]);
      const out = (await res.stdout()).toString();
      if (out.includes("READY")) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  // لا نرمي خطأ قاتل — الواجهة قد تحتاج بضع ثوانٍ إضافية
  console.warn(`[sandbox] المنفذ ${port} لم يصبح جاهزاً خلال ${timeoutMs}ms`);
}

// ── Lifecycle ──

export async function getSandbox(sandboxId: string) {
  // @vercel/sandbox يعيد الاتصال بـ sandbox موجود عبر get
  const sb = await (Sandbox as unknown as { get: (o: { sandboxId: string }) => Promise<Sandbox> }).get({
    sandboxId,
  });
  return sb;
}

export async function stopSandbox(sandboxId: string) {
  const sb = await getSandbox(sandboxId);
  await sb.stop();
}

export async function extendSandbox(sandboxId: string, extraMs: number) {
  const sb = await getSandbox(sandboxId);
  // الـ SDK يكشف extendTimeout
  await (sb as unknown as { extendTimeout: (ms: number) => Promise<void> }).extendTimeout(extraMs);
}

export async function snapshotSandbox(sandboxId: string, expirationMs = 7 * 24 * 60 * 60 * 1000) {
  const sb = await getSandbox(sandboxId);
  const snap = await (sb as unknown as { snapshot: (o: { expiration: number }) => Promise<{ snapshotId: string }> }).snapshot({
    expiration: expirationMs,
  });
  return snap.snapshotId;
}

export async function listSandboxes(limit = 20) {
  const res = await (Sandbox as unknown as { list: (o: { limit: number }) => Promise<{ sandboxes: Sandbox[] }> }).list({
    limit,
  });
  return res.sandboxes;
}
