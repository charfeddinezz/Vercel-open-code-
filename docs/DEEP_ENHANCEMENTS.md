# التحسينات العميقة والإضافات — Beyond الخيار A

هذا المستند يوثّق كل التحسينات التي أضفناها فوق المتطلبات الأساسية.

## 1) نظام حسابات متعدد المستخدمين
- **GitHub OAuth** عبر Auth.js v5 (scope `repo` للقراءة/الكتابة).
- **كلمة مرور عامة** (`OPENCODE_SERVER_PASSWORD`) + bcrypt — للدخول السريع دون GitHub.
- **عزل كامل**: كل مستخدم له `userId` خاص → sandboxes + مشاريع + مفاتيح مشفّرة.
- جدول `users` في Postgres يخزّن التوكنات مشفّرة بـ AES-256-GCM.

## 2) تشفير المفاتيح
- `src/lib/crypto.ts`: AES-256-GCM باستخدام `ENCRYPTION_KEY` (32 bytes).
- لا يُكشف `OPENROUTER_API_KEY` أبداً للواجهة — يُمرّر كـ env داخل الـ Sandbox فقط.

## 3) إدارة النماذج الذكية
- `src/lib/openrouter.ts`: يسحب كل النماذج من `https://openrouter.ai/api/v1/models` ويُفلتر المجانية (`pricing 0`).
- `ModelPicker` يعرض **مباشرة** النماذج الحية + قائمة curated.
- دعم `:free` و `openrouter/auto` و fallback تلقائي (`models: [...]`).

## 4) Terminal حقيقي داخل Sandbox
- `/api/sandbox/exec`: يستقبل أي أمر وينفّذه عبر `sandbox.runCommand({cmd:"bash", args:["-lc", cmd]})` مع `sudo` عند الحاجة.
- يُستخدم لتحميل dependencies، تشغيل tests، إلخ — دون فتح OpenCode.

## 5) دورة حياة Sandbox صامدة
- **Heartbeat Cron** (`/api/cron/heartbeat` كل 10د): يمدّد timeout تلقائياً.
- **Auto-commit** عند `stop`: `git add -A && git commit && git push` — لا يضيع عمل غير ملتزم.
- **Snapshot** قبل الإيقاف: `sandbox.snapshot()` → يُعاد استخدامه كـ `source: snapshot` في الجلسة التالية.
- **Proxy** يخفي `sandbox.domain()` ويطبّق Basic Auth بدلاً من كشف التوكن.

## 6) استعادة المشاريع بعد انتهاء Sandbox
- المصدر الأول: **GitHub** (كل دفع محفوظ).
- المصدر الثاني: **Vercel Blob** كـ snapshot (غير مفعّل افتراضياً — جاهز للإضافة).
- المفتاح `snap:<projectName>` في KV يحفظ `snapshotId` لاسترجاعه عند إنشاء sandbox جديد بنفس الاسم.

## 7) تحسينات الهاتف (Android)
- واجهة responsive تماماً، خطوط كبيرة، أزرار لمس مريحة.
- **PWA** (`public/manifest.json`): يمكن تثبيته كـ App على الشاشة الرئيسية.
- صفحة `/session/[id]` تعرض OpenCode داخل `iframe` + زر “افتح في تبويب جديد” لتجربة ملء الشاشة.
- خطط مستقبلية: لوحة مفاتيح مدمجة، اختصارات swipe.

## 8) أمان على مستوى الإنتاج
- كلمة مرور للخادم (`OPENCODE_SERVER_PASSWORD` → Basic Auth في OpenCode web).
- تشفير مفاتيح المستخدمين.
- `X-Frame-Options: ALLOWALL` فقط لـ proxy الداخلي — مع إزالة CSP الضارّة.
- Rate limiting مقترح: أضف `upstash/ratelimit` على `/api/sandbox/create`.

## 9) قابلية التوسع
- **Multi-session**: كل مشروع = sandbox مستقل — يمكنك تشغيل 5 بالتوازي (حد Vercel).
- **VCPUs قابلة للضبط**: أضف `vcpus` في body إنشاء الجلسة (حتى 8).
- **Timeout قابل للضبط**: Hobby حتى 45m، Pro حتى 5h — نمرّره كـ `timeoutMs`.

## 10) إضافات مقترحة للمرحلة القادمة
- [ ] WebSocket proxy كامل (حالياً تمرير HTTP فقط — WebSocket يعمل عبر domain مباشرة).
- [ ] سجل استعمال وتكلفة النماذج (OpenRouter usage API).
- [ ] مشاركة جلسة عبر رابط مؤقت (share URL).
- [ ] تكامل `gh` CLI داخل Sandbox للدفع التفاعلي.
- [ ] دعم اختيار runtime (node22 / node24 / python3.13).
- [ ] إشعارات Telegram/Email عند قرب انتهاء Sandbox.
