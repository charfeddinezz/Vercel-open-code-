/**
 * جمع مقاييس الـ Sandbox (CPU, mem, network) بعد الإيقاف
 * + تتبع استخدام النماذج (تقدير التكلفة)
 */
export type SandboxMetrics = {
  sandboxId: string;
  activeCpuMs?: number;
  networkIngressBytes?: number;
  networkEgressBytes?: number;
  durationMs: number;
  vcpus: number;
};

export function estimateCost(metrics: SandboxMetrics): number {
  // Vercel Sandbox: الدفع مقابل Active CPU فقط (Fluid compute)
  // تسعير تقريبي: $0.000018 / vCPU-sec
  const cpuSec = (metrics.activeCpuMs ?? 0) / 1000;
  return cpuSec * 0.000018 * (metrics.vcpus ?? 1);
}

export type ModelUsage = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  at: string;
};

export function estimateModelCost(model: string, tokens: { prompt: number; completion: number }): number {
  // أسعار تقريبية — يفضل جلبها من OpenRouter pricing
  const pricePerMTok: Record<string, number> = {
    "openrouter/auto": 2,
    "anthropic/claude-sonnet-4": 3,
    "meta-llama/llama-3.3-70b-instruct:free": 0,
    "qwen/qwen-2.5-72b-instruct:free": 0,
  };
  const rate = pricePerMTok[model] ?? 2;
  return ((tokens.prompt + tokens.completion) / 1_000_000) * rate;
}
