/**
 * قوالب مشاريع جاهزة تُزرع داخل الـ Sandbox بعد الإقلاع
 */
export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  runtime: "node22" | "node24" | "python3.13";
  files: { path: string; content: string }[];
  commands: string[];
  suggestedModel: string;
};

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "مشروع فارغ",
    description: "ابدأ من الصفر مع OpenCode",
    icon: "📄",
    runtime: "node22",
    files: [{ path: "README.md", content: "# مشروع جديد\n\nأخبر OpenCode بما تريد بناءه.\n" }],
    commands: ["git init -q 2>/dev/null || true"],
    suggestedModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    id: "nextjs",
    name: "Next.js App",
    description: "تطبيق ويب كامل بـ Next.js + Tailwind",
    icon: "▲",
    runtime: "node22",
    files: [],
    commands: [
      "npx -y create-next-app@latest . --ts --tailwind --app --eslint --src-dir --import-alias '@/*' --use-npm --yes 2>&1 | tail -n 5",
    ],
    suggestedModel: "qwen/qwen-2.5-72b-instruct:free",
  },
  {
    id: "express-api",
    name: "Express API",
    description: "خادم API بـ Express + TypeScript",
    icon: "🚀",
    runtime: "node22",
    files: [
      {
        path: "package.json",
        content: JSON.stringify({ name: "api", private: true, type: "module", scripts: { dev: "tsx watch src/index.ts" }, dependencies: { express: "^4.21.2", cors: "^2.8.5" }, devDependencies: { tsx: "^4.19.2", typescript: "^5.7.3", "@types/express": "^5.0.0", "@types/cors": "^2.8.17" } }, null, 2),
      },
      {
        path: "src/index.ts",
        content: `import express from "express";\nimport cors from "cors";\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\napp.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));\napp.get("/api/hello", (req, res) => res.json({ message: \`Hello \${req.query.name ?? "world"}!\` }));\n\nconst port = Number(process.env.PORT ?? 3000);\napp.listen(port, "0.0.0.0", () => console.log(\`API on :\${port}\`));\n`,
      },
      { path: "README.md", content: "# Express API\n\n```bash\nnpm install && npm run dev\n```\n" },
    ],
    commands: ["npm install 2>&1 | tail -n 3"],
    suggestedModel: "qwen/qwen-2.5-72b-instruct:free",
  },
  {
    id: "fastapi",
    name: "FastAPI (Python)",
    description: "API حديث بـ Python + FastAPI",
    icon: "🐍",
    runtime: "python3.13",
    files: [
      { path: "requirements.txt", content: "fastapi\nuvicorn[standard]\n" },
      {
        path: "main.py",
        content: `from fastapi import FastAPI\n\napp = FastAPI(title="API")\n\n@app.get("/health")\ndef health():\n    return {"ok": True}\n\n@app.get("/api/hello")\ndef hello(name: str = "world"):\n    return {"message": f"Hello {name}!"}\n`,
      },
      { path: "README.md", content: "# FastAPI\n\n```bash\npip install -r requirements.txt\nuvicorn main:app --host 0.0.0.0 --port 8000\n```\n" },
    ],
    commands: ["pip install -q -r requirements.txt 2>&1 | tail -n 3"],
    suggestedModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    id: "static-site",
    name: "موقع ثابت",
    description: "HTML/CSS/JS — الأسرع للبدء والعروض",
    icon: "🌐",
    runtime: "node22",
    files: [
      {
        path: "index.html",
        content: `<!doctype html>\n<html lang="ar" dir="rtl">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>موقعي</title><link rel="stylesheet" href="style.css"></head>\n<body>\n<main><h1>مرحباً 👋</h1><p>اطلب من OpenCode تطوير هذا الموقع.</p><button id="b">جرّبني</button><p id="o"></p></main>\n<script src="app.js"></script>\n</body></html>\n`,
      },
      { path: "style.css", content: "body{font-family:system-ui;background:#0a0a0a;color:#fafafa;display:grid;place-items:center;min-height:100vh;margin:0}main{text-align:center}button{background:#fff;border:0;padding:10px 22px;border-radius:999px;font-weight:700;cursor:pointer}\n" },
      { path: "app.js", content: "document.getElementById('b').onclick=()=>{document.getElementById('o').textContent='يعمل! 🎉 اطلب من OpenCode إضافة المزيد.'};\n" },
    ],
    commands: [],
    suggestedModel: "google/gemini-2.0-flash-exp:free",
  },
];

export function getTemplate(id?: string): ProjectTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
