/**
 * OpenRouter — إدارة النماذج والمفاتيح
 * التوثيق: https://openrouter.ai/docs
 */

export type OpenRouterModel = {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
  context_length: number;
  isFree: boolean;
};

const BASE = "https://openrouter.ai/api/v1";

export async function listModels(apiKey?: string): Promise<OpenRouterModel[]> {
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(`${BASE}/models`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`OpenRouter models fetch failed: ${res.status}`);
  const json = (await res.json()) as { data: OpenRouterModel[] };
  return json.data.map((m) => ({
    ...m,
    isFree: m.pricing.prompt === "0" && m.pricing.completion === "0",
  }));
}

export function filterFreeModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter((m) => m.isFree);
}

// إعداد مزود OpenRouter داخل opencode.json
export function buildOpencodeProviderConfig(opts: {
  apiKey: string;
  model: string;
  smallModel?: string;
}) {
  return {
    $schema: "https://opencode.ai/config.json",
    model: opts.model,
    ...(opts.smallModel ? { small_model: opts.smallModel } : {}),
    provider: {
      openrouter: {
        // OpenCode يدعم OpenRouter كنظام OpenAI-compatible
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: `{env:OPENROUTER_API_KEY}`,
        models: {
          [opts.model]: { name: opts.model },
        },
      },
    },
    server: {
      port: 4096,
      hostname: "0.0.0.0",
    },
    permission: {
      edit: "allow",
      bash: "allow",
    },
  };
}

export const CURATED_FREE_MODELS = [
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B (مجاني)",
    reason: "متوازن للبرمجة العامة",
  },
  {
    id: "qwen/qwen-2.5-72b-instruct:free",
    label: "Qwen 2.5 72B (مجاني)",
    reason: "ممتاز لتوليد الأكواد",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash (مجاني)",
    reason: "سريع جداً — مثالي للجلسات المتعددة",
  },
  {
    id: "deepseek/deepseek-r1:free",
    label: "DeepSeek R1 (مجاني)",
    reason: "تفكير عميق + كود",
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    label: "Mistral Small 3.1 (مجاني)",
    reason: "خفيف — للهاتف والشبكات البطيئة",
  },
] as const;
