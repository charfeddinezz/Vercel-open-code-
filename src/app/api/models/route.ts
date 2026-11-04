import { NextRequest, NextResponse } from "next/server";
import { listModels, CURATED_FREE_MODELS } from "@/lib/openrouter";
import { toResponse } from "@/lib/errors";

/**
 * GET /api/models?q=qwen&free=true&sort=context
 * بحث وتصفية وترتيب نماذج OpenRouter (مع قائمة منسّقة احتياطية)
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase();
  const freeOnly = req.nextUrl.searchParams.get("free") === "true";
  const sort = req.nextUrl.searchParams.get("sort") ?? "name"; // name|context
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    const curated = CURATED_FREE_MODELS.filter((m) => !q || m.id.toLowerCase().includes(q) || m.label.includes(q));
    return NextResponse.json(
      { curated, free: [], total: 0, note: "أضف OPENROUTER_API_KEY لعرض كل النماذج الحية والبحث فيها" },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  }

  try {
    let models = await listModels(key);
    if (freeOnly) models = models.filter((m) => m.isFree);
    if (q) models = models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
    if (sort === "context") models = [...models].sort((a, b) => b.context_length - a.context_length);

    const free = models.filter((m) => m.isFree).slice(0, 50);
    return NextResponse.json(
      { curated: CURATED_FREE_MODELS, free, models: models.slice(0, 100), total: models.length },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } }
    );
  } catch (e) {
    const { body } = toResponse(e);
    return NextResponse.json({ curated: CURATED_FREE_MODELS, free: [], total: 0, error: (body as { error: string }).error });
  }
}
