import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, projects } from "@/lib/db";
import { eq } from "drizzle-orm";

const Create = z.object({
  name: z.string().min(1).max(64),
  githubUrl: z.string().url().optional().or(z.literal("")),
  config: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ projects: [], hint: "مرّر x-user-id أو سجل الدخول" });

  try {
    const rows = await db.select().from(projects).where(eq(projects.userId, userId as never));
    return NextResponse.json({ projects: rows });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ projects: [], error: err.message, hint: "تأكد من إعداد POSTGRES_URL" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = Create.parse(await req.json());
    const userId = req.headers.get("x-user-id") ?? "00000000-0000-0000-0000-000000000000";

    const [row] = await db
      .insert(projects)
      .values({
        userId: userId as never,
        name: body.name,
        githubUrl: body.githubUrl || null,
        config: body.config ?? {},
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
