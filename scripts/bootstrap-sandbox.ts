/**
 * سكريبت تجريبي: ينشئ Sandbox محلياً عبر Vercel Sandbox SDK ويشغّل OpenCode
 * شغّله بـ: pnpm sandbox:bootstrap
 */
import "dotenv/config";
import { createOpencodeSandbox } from "../src/lib/sandbox-manager";

async function main() {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY مفقود");

  console.log("→ إنشاء Sandbox...");
  const s = await createOpencodeSandbox({
    userId: "local-test",
    projectName: "demo",
    openRouterKey: process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.3-70b-instruct:free",
  });

  console.log("✓ جاهز:", s.opencodeUrl);
  console.log("  ID:", s.sandboxId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
