# OpenCode Cloud — واجهة OpenCode الأصلية على Vercel

> **الخيار A** — تشغيل OpenCode الأصلي بكامل واجهته وإمكانياته داخل Vercel، دون بناء محرر بديل.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Vercel Sandbox](https://img.shields.io/badge/Vercel-Sandbox-000)](https://vercel.com/docs/vercel-sandbox)
[![OpenCode](https://img.shields.io/badge/OpenCode-native-violet)](https://opencode.ai)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-500%2B%20models-blue)](https://openrouter.ai)

## ✨ ما ستحصل عليه
- واجهة **OpenCode الأصلية** (web على المنفذ 4096)
- **AI Agent** لإنشاء المشاريع وتعديلها
- قراءة الملفات وإعادة هيكلتها
- **Terminal** لتنفيذ الأوامر (sudo متاح)
- **جلسات متعددة** — كل جلسة = Sandbox معزول
- **Git وGitHub** — حفظ تلقائي + استعادة بعد انتهاء Sandbox
- اختيار النماذج عبر **OpenRouter** (مع دعم المجانية `:free`)
- دخول من **هاتفك** عبر الإنترنت — PWA جاهز لـ Android

## 🆕 جديد في v1.2
- **قوالب مشاريع جاهزة** (Next.js / Express / FastAPI / موقع ثابت) تُزرع عند إنشاء الجلسة
- **لوحة Git** داخل الجلسة + بحث نماذج فوري بفلتر مجاني + صفحتا **إعدادات** و**حالة نظام**
- **PWA كامل** (تثبيت على الهاتف + عمل دون اتصال) واختصارات لوحة مفاتيح — التفاصيل في [`CHANGELOG.md`](CHANGELOG.md)

## 🆕 جديد في v1.1
- مساحة عمل جلسة بتبويبات: OpenCode / Terminal بسجل أوامر / مستعرض ملفات بمعاينة / سجلات حية / مقاييس وتكلفة
- روابط **مشاركة مؤقتة** للجلسات (`/s/[id]`) بصلاحية وحد مشاهدات
- **Rate limiting** + سجل تدقيق + قائمة أوامر محظورة + تحقق Zod شامل برسائل عربية
- APIs: ‏`health` / `logs` / `metrics` / `files` / `snapshot` / `projects` / `usage`
- اختيار Runtime ‏(node22/node24/python3.13) و vCPUs والمدة من لوحة التحكم
- اختبارات Vitest + CI تلقائي — التفاصيل في [`docs/ENHANCEMENTS_V2.md`](docs/ENHANCEMENTS_V2.md) والأمان في [`SECURITY.md`](SECURITY.md)

## 🏗️ البنية
```
Android / PC
      ↓
Vercel Deployment (Next.js)
      ↓
Vercel Sandbox (Firecracker microVM, Node22, 4 vCPU)
      ↓
  OpenCode  —  opencode web --hostname 0.0.0.0 --port 4096
      ↓
  ┌────────┴────────┐
  │                 │
GitHub          OpenRouter
(حفظ)            (AI Models)
```

| الخدمة | الوظيفة |
|-------|---------|
| Vercel | إدارة المشروع والاستضافة |
| Vercel Sandbox | تشغيل OpenCode في Linux معزول |
| GitHub | تخزين المشاريع (المصدر الحقيقي) |
| OpenRouter | توفير 500+ نموذج ذكاء اصطناعي |

> ⚠️ الـ Sandbox مؤقت (5m افتراضي، 45m Hobby، 5h Pro). نبني آلية إعادة تشغيل واستعادة عبر `snapshot` + دفع تلقائي إلى GitHub.

## 🚀 البدء السريع
انظر [`docs/SETUP.md`](docs/SETUP.md) للتفاصيل الكاملة.

```bash
pnpm install
vercel link
vercel env pull   # يسحب VERCEL_TOKEN وغيرها

# أضف في .env.local
OPENROUTER_API_KEY=sk-or-v1-...

pnpm dev         # http://localhost:3000
```

### إعداد OpenRouter
1. أنشئ API Key من https://openrouter.ai/keys
2. أضفه إلى `.env.local` كـ `OPENROUTER_API_KEY`
3. لا تضعه في GitHub أو كود الواجهة — يُمرّر كـ env داخل Sandbox فقط.

### تثبيت OpenCode داخل Sandbox
يُثبّت تلقائياً عبر:
```bash
curl -fsSL https://opencode.ai/install | bash
# المسار داخل Sandbox: /home/vercel-sandbox/.opencode/bin/opencode
opencode web --hostname 0.0.0.0 --port 4096
```

## 🔐 الأمان
- خادم OpenCode محمي بـ `OPENCODE_SERVER_PASSWORD` (Basic Auth) — لا تكشفه للإنترنت دون مصادقة.
- مفاتيح المستخدمين مشفّرة بـ AES-256-GCM.
- كل مستخدم يحصل على Sandbox(s) معزولة.

## 👥 نظام حسابات متعددة
- GitHub OAuth (Auth.js v5)
- كلمة مرور عامة اختيارية
- عزل كامل: مشاريع، جلسات، مفاتيح — لكل مستخدم.

## 📦 الإضافات والتحسينات
- PWA للعمل كتطبيق على Android
- Terminal مدمج عبر `/api/sandbox/exec`
- Model Picker حي مع النماذج المجانية
- Heartbeat + تمديد تلقائي كل 10د
- استعادة ذكية (GitHub + Blob snapshot)
- WebSocket/proxy للـ OpenCode UI

## 📚 التوثيق
- [البنية المعمارية](docs/ARCHITECTURE.md)
- [دليل الإعداد](docs/SETUP.md)
- [توثيق OpenCode](https://opencode.ai/docs/)
- [توثيق Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)

## 📄 الترخيص
MIT

## Vercel-open-code-27791bf Initial commit
