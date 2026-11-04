/**
 * Proxy → OpenCode web داخل Sandbox (v2)
 * + rate limit + audit + إزالة هيدرز الحظر + إعادة كتابة الروابط
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionMeta } from "@/lib/persistence";
import type { SandboxSession } from "@/lib/sandbox-manager";
import { checkRateLimit, rateKey, LIMITS } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path?.length) return NextResponse.json({ error: "sandboxId مفقود" }, { status: 400 });

  const sandboxId = path[0];
  const rest = path.slice(1).join("/");

  // Rate limit للـ proxy
  const rl = await checkRateLimit(rateKey(req, "proxy"), LIMITS.proxy);
  if (!rl.ok) return NextResponse.json({ error: "تم تجاوز الحد" }, { status: 429 });

  const meta = await getSessionMeta<SandboxSession>(`sb:${sandboxId}`);
  if (!meta?.domain) {
    return new NextResponse(`Sandbox غير موجود أو انتهى — أنشئ جلسة جديدة من /dashboard\nSandbox: ${sandboxId}`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (meta.passwordProtected && !req.headers.get("authorization")) {
    return new NextResponse("Auth required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="OpenCode"' } });
  }

  const targetUrl = new URL(`/${rest}`, meta.domain);
  req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

  // سجل audit للوصول
  const userId = req.headers.get("x-user-id") ?? "anon";
  if (rest === "" || rest === "/") {
    audit({ action: "sandbox.proxy", userId, sandboxId }).catch(() => {});
  }

  try {
    const headers: Record<string, string> = {};
    for (const h of ["content-type", "authorization", "cookie", "accept", "accept-language", "user-agent"]) {
      const v = req.headers.get(h);
      if (v) headers[h] = v;
    }
    // مرّر الـ host الصحيح
    headers["x-forwarded-host"] = req.headers.get("host") ?? "";

    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined,
      redirect: "manual",
    });

    const resHeaders = new Headers(upstream.headers);
    resHeaders.delete("x-frame-options");
    resHeaders.delete("content-security-policy");
    resHeaders.delete("content-security-policy-report-only");
    resHeaders.set("X-Proxy-By", "opencode-cloud");
    resHeaders.set("X-RateLimit-Remaining", String(rl.remaining));

    // إعادة كتابة redirect ليبقى داخل الـ proxy
    const loc = resHeaders.get("location");
    if (loc && loc.startsWith(meta.domain)) {
      resHeaders.set("location", loc.replace(meta.domain, `${req.nextUrl.origin}/api/sandbox/proxy/${sandboxId}`));
    }

    return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch (e) {
    const err = e as Error;
    return new NextResponse(`Proxy error: ${err.message}\nTarget: ${targetUrl}`, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as HEAD, handler as OPTIONS };
