import { NextRequest, NextResponse } from "next/server";
import { listRepos } from "@/lib/github";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-github-token") ?? process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GitHub token غير مضبوط — سجّل الدخول عبر GitHub أو أضف GITHUB_TOKEN" }, { status: 401 });
  try {
    const repos = await listRepos(token);
    return NextResponse.json({ repos });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
