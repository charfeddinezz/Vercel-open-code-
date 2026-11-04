# البنية المعمارية — OpenCode Cloud (الخيار A)

> الهدف: تشغيل **OpenCode الأصلي** بكامل واجهته داخل **Vercel** دون إعادة بناء محرر بديل.

## 1. المبدأ
```
User (Android / PC)
  → Vercel Deployment (Next.js 15, Node22)
    → Vercel Sandbox API (@vercel/sandbox)
      → Firecracker microVM (Amazon Linux 2023)
        → OpenCode web --hostname 0.0.0.0 --port 4096
          → يُكشف عبر sandbox.domain(4096) → https://sb-xxxx.vercel.run
```

- **Vercel** = الاستضافة وإدارة المشروع.
- **Vercel Sandbox** = الحاسوب الافتراضي المؤقت لتشغيل OpenCode.
- **GitHub** = التخزين الدائم (المصدر الحقيقي للمشاريع).
- **OpenRouter** = بوابة النماذج (500+ نموذج عبر مفتاح واحد، مع دعم `:free`).

## 2. لماذا Sandbox مؤقت؟
حدود Vercel:
- Hobby: حد 45 دقيقة.
- Pro/Enterprise: حد 5 ساعات.
- افتراضياً 5 دقائق — نحن نضبطه إلى 30m ونمدّد تلقائياً عبر `heartbeat`.

لذلك:
- كل عمل يُزامن تلقائياً مع **GitHub** (`git commit + push` عند الإيقاف).
- نلتقط **snapshot** للـ filesystem قبل الانتهاء — يمكن استعادته كـ `source: {type: "snapshot"}`.

## 3. المصادقة
- **متعدد المستخدمين**: NextAuth v5 + GitHub OAuth (scope `repo`).
- **كلمة مرور عامة**: `OPENCODE_SERVER_PASSWORD` عبر `OPENCODE_SERVER_PASSWORD` env → تُمرّر داخل الـ Sandbox كـ `OPENCODE_SERVER_PASSWORD` ويستخدمها OpenCode كـ Basic Auth.
- مفاتيح المستخدمين (OpenRouter/GitHub) مشفّرة بـ AES-256-GCM قبل حفظها.

## 4. إدارة النماذج
- نستخدم OpenRouter مباشرة: `https://openrouter.ai/api/v1`.
- نعرض النماذج المجانية بفلترة `pricing.prompt === "0" && pricing.completion === "0"`.
- الافتراضي: `openrouter/auto` أو أحد المجانية مثل `qwen/qwen3-4b:free`.
- المستخدم يختار النموذج لكل جلسة — يُكتب في `opencode.json`.

## 5. الـ Proxy ولماذا لا نكشف الـ domain مباشرة
- `sandbox.domain(4096)` يعطي رابطاً عاماً، لكننا نمرّره عبر `/api/sandbox/proxy/[id]` لكي:
  - نطبّق auth موحّد.
  - لا نكشف الـ token.
  - ندعم الحماية بكلمة مرور.
  - نسهّل الـ mobile UX (iframe + فتح في تبويب جديد).

## 6. دورة الحياة
1. `POST /api/sandbox/create` → `Sandbox.create({ports:[4096], runtime:"node22"})`
2. تثبيت OpenCode عبر `curl -fsSL https://opencode.ai/install | bash`
3. كتابة `opencode.json` + تمرير `OPENROUTER_API_KEY`
4. `opencode web --hostname 0.0.0.0 --port 4096` (detached)
5. `GET /api/sandbox/status` للتحقق
6. `POST /api/sandbox/exec` لتنفيذ أوامر Terminal
7. `POST /api/sandbox/stop` → commit + snapshot + stop
8. Cron `*/10 * * * *` → `extendTimeout(10m)` + heartbeat

## 7. التحسينات العميقة (Beyond MVP)
- **PWA**: يعمل كتطبيق على Android.
- **Terminal مدمج**: `/api/sandbox/exec` ينفّذ أي أمر داخل VM.
- **Model Picker حي**: يسحب قائمة النماذج من OpenRouter.
- **GitHub Integration**: list/create repos، clone مع token مؤقت.
- **Multi-session**: كل مشروع = Sandbox مستقل — يمكن تشغيل 3-5 بالتوازي (حسب الخطة).
- **DR**: استعادة عبر snapshot أو GitHub clone.
- **Logs**: `/tmp/opencode.log` داخل Sandbox + streaming عبر `runCommand({detached, stdout})`.
