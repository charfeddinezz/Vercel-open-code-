import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/templates";

export async function GET() {
  return NextResponse.json(
    { templates: TEMPLATES.map(({ files: _f, commands: _c, ...t }) => ({ ...t, filesCount: _f.length })) },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
