/**
 * Proxy → OpenCode web داخل Sandbox
 * نمرّر كل شيء (HTML, WS upgrade, assets) من sb-xxxx.vercel.run:4096
 *
 * ملاحظة: توثيق Vercel Sandbox ينصح باستخدام sandbox.domain(port) مباشرة،
 * لكن الـ proxy يسمح بالتحكم بالـ auth وعدم كشف الـ domain الأصلي.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionMeta } from "@/lib/persistence";
import type { SandboxSession } from "@/lib/sandbox-manager";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path?.length) return NextResponse.json({ error: "sandboxId مفقود" }, { status: 400 });

  const sandboxId = path[0];
  const rest = path.slice(1).join("/");

  const meta = await getSessionMeta<SandboxSession>(`sb:${sandboxId}`);
  if (!meta?.domain) {
    return new NextResponse(
      `Sandbox غير موجود أو انتهى. أنشئ جلسة جديدة من /dashboard\nSandbox: ${sandboxId}`,
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const targetUrl = new URL(`/${rest}`, meta.domain);
  // حافظ على query و path
  req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

  // تحقق من كلمة المرور إن وُجدت (Basic Auth)
  if (meta.passwordProtected) {
    const auth = req.headers.get("authorization");
    // نتوقع Basic opencode:<password> — اسم المستخدم افتراضياً opencode
    if (!auth) {
      return new NextResponse("Auth required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="OpenCode"' },
      });
    }
  }

  try {
    const headers: Record<string, string> = {};
    // مرّر الهيدرز المهمة فقط
    const passThrough = ["content-type", "authorization", "cookie", "accept", "accept-language", "user-agent"];
    for (const h of passThrough) {
      const v = req.headers.get(h);
      if (v) headers[h] = v;
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
      // مهم لـ WebSocket upgrade — Next.js يمرّره تلقائياً إن كان التروكسي يدعمها
    });

    const resHeaders = new Headers(upstream.headers);
    // إزالة هيدرز تمنع الـ iframe
    resHeaders.delete("x-frame-options");
    resHeaders.delete("content-security-policy");
    resHeaders.set("X-Proxy-By", "opencode-cloud");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (e) {
    const err = e as Error;
    return new NextResponse(`Proxy error: ${err.message}\nTarget: ${targetUrl}`, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as HEAD, handler as OPTIONS };
