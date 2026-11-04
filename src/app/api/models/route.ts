import { NextResponse } from "next/server";
import { listModels, CURATED_FREE_MODELS } from "@/lib/openrouter";

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ curated: CURATED_FREE_MODELS, note: "أضف OPENROUTER_API_KEY لعرض كل النماذج" });
  }
  try {
    const models = await listModels(key);
    const free = models.filter((m) => m.isFree).slice(0, 50);
    return NextResponse.json({ curated: CURATED_FREE_MODELS, free, total: models.length });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ curated: CURATED_FREE_MODELS, error: err.message });
  }
}
