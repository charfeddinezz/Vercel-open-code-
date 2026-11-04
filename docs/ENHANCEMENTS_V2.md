# تحسينات v1.1 — الموجة الثانية

> كل ما أُضيف بعد الإصدار الأول (5694290)، مع سبب كل إضافة وكيف تختبرها.

## 1) البنية التحتية (Libs جديدة)

| الملف | الوظيفة |
|---|---|
| `src/lib/logger.ts` | سجل JSON موحّد (level/msg/ts) + قياس زمن العمليات `logger.time()` — جاهز للربط مع Sentry/Axiom |
| `src/lib/errors.ts` | `AppError` + مصنع أخطاء (`Errors.unauthorized/notFound/rateLimited…`) + `toResponse()` يحوّل أي خطأ (بما فيه Zod) لاستجابة HTTP عربية موحّدة |
| `src/lib/rate-limit.ts` | تحديد معدل عبر KV: إنشاء Sandbox ‏5/10د، تنفيذ أوامر 60/د، بروكسي 1000/د — يصبح no-op آمناً بدون KV |
| `src/lib/validation.ts` | مخططات Zod مركزية برسائل عربية: اسم مشروع، رابط GitHub، إنشاء Sandbox (vcpus/runtime/ports/timeout بحدود)، تنفيذ، ملفات (2MB كحد أقصى) |
| `src/lib/audit.ts` | سجل تدقيق لكل عملية حساسة (create/stop/exec/snapshot/share/login) في KV — آخر 100 حدث/مستخدم |
| `src/lib/retry.ts` | إعادة محاولة بـ exponential backoff + jitter لإنشاء Sandbox وتثبيت OpenCode |
| `src/lib/env.ts` | تحقق Zod من البيئة عند الإقلاع + `requireEnv()` برسائل مساعدة |
| `src/lib/metrics.ts` | حساب تكلفة Sandbox (Active CPU) وتكلفة النماذج التقديرية |
| `src/lib/usage.ts` | تتبع استخدام النماذج والتكلفة لكل مستخدم (KV) |
| `src/lib/share.ts` | روابط مشاركة مؤقتة `sh_…` مع TTL وحد مشاهدات |
| `src/lib/sandbox-pool.ts` | تجمّع Sandboxes دافئة لتقليل زمن البدء (اختياري) |

## 2) APIs جديدة

| المسار | الوصف |
|---|---|
| `GET /api/health` | فحص جاهزية: OpenRouter / Vercel / KV / Postgres / التشفير مع تلميحات إصلاح |
| `GET /api/sandbox/logs` | آخر سجلات OpenCode أو النظام من داخل الـ VM |
| `GET /api/sandbox/metrics` | CPU/ذاكرة/قرص/شبكة + تكلفة تقديرية |
| `GET/POST /api/sandbox/files` | استعراض شجرة ملفات + كتابة ملف (حتى 2MB) |
| `GET /api/sandbox/files/read` | قراءة ملف بنصّه (حتى 500KB) |
| `POST/GET /api/sandbox/snapshot` | التقاط Snapshot يدوي بصلاحية حتى 14 يوماً |
| `POST /api/share` + `/s/[id]` | إنشاء رابط مشاركة مؤقت وفتحه |
| `GET/POST /api/projects` | CRUD مشاريع عبر Drizzle/Postgres |
| `GET /api/usage` | سجل استخدام النماذج وإجمالي التكلفة |

## 3) ترقيات APIs الموجودة

- **create**: تحقق Zod كامل + rate-limit + استعادة Snapshot باسم المشروع + runtime/ports مخصصة + ترويسات `X-RateLimit-Remaining`
- **exec**: قائمة أوامر محظورة (`rm -rf /`، `mkfs`، fork bomb…) + audit + rate-limit
- **stop**: Snapshot **قبل** Git push (حتى لا يضيع شيء عند فشل الدفع) + رسالة commit مخصصة + جمع مقاييس قبل الإيقاف
- **proxy**: rate-limit + audit عند فتح الجلسة + إعادة كتابة `Location` لتبقى عمليات إعادة التوجيه داخل البروكسي
- **list**: إزالة تكرار بين SDK و KV
- **sandbox-manager v2**: logging كامل، retry، `runInSandbox()`، دعم `node24/python3.13`، منافذ متعددة، `autoupdate: false` لاستقرار الجلسة

## 4) الواجهة

- **صفحة الجلسة** أصبحت مساحة عمل بتبويبات: OpenCode (iframe يبقى مركّباً حتى لا تُفقد حالته) / Terminal / ملفات / سجلات / مقاييس + أزرار تمديد/Snapshot/مشاركة/إيقاف آمن + مؤشر حالة حي كل 15 ثانية
- **Terminal** مطوّر: سجل أوامر (↑/↓)، أوامر سريعة، مجلد عمل، كود الخروج، مسح
- **لوحة التحكم**: اختيار runtime/vcpus/المدة، بحث فوري، شارة صحة النظام، تنبيه إعداد ناقص، إجراءات لكل جلسة (تمديد/Snapshot/مشاركة/إيقاف)، عدّادات
- **مكونات جديدة**: `FileTree` (استعراض + معاينة)، `LogsViewer` (تحديث تلقائي)، `MetricsCard`، `ShareModal`
- **صفحات نظام**: `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` عربية بالكامل
- **CSS**: تركيز مرئي لسهولة الوصول، منع تكبير iOS، `prefers-reduced-motion`، حركات خفيفة، طباعة نظيفة، `100dvh` للهاتف

## 5) الجودة والتشغيل

- **اختبارات Vitest**: validation / errors / metrics / share / crypto (تشفير دائري + IV عشوائي) — `npm test`
- **CI** (`.github/workflows/ci.yml`): typecheck + lint + test + build على Node 22
- `npm run check` = typecheck + test + build بضغطة واحدة
- `instrumentation.ts`: تحقق بيئة عند إقلاع الخادم بتحذيرات واضحة
- إصلاح `vercel.json`: كان يستخدم `pnpm` بينما المستودع يعمل بـ npm (`package-lock.json`) — أصبح `npm ci`

## كيف تختبر؟

```bash
npm run check          # typecheck + tests + build
npm run dev            # ثم افتح /api/health للتحقق من الإعداد
```
