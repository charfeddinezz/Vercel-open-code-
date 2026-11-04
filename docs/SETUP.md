# الإعداد الكامل — من الصفر إلى Vercel

## 1) المتطلبات
- حساب GitHub + حساب Vercel + حساب OpenRouter
- Node.js 22+
- `pnpm` (موصى به)

## 2) التثبيت المحلي
```bash
git clone https://github.com/charfeddinezz/Vercel-open-code-.git
cd Vercel-open-code-
pnpm install

pnpm add -g vercel
vercel login
vercel link
vercel env pull   # يسحب VERCEL_TOKEN و POSTGRES_URL إلخ
```

## 3) إعداد OpenRouter
1. افتح https://openrouter.ai/keys وأنشئ مفتاحاً.
2. أضفه إلى `.env.local`:
```
OPENROUTER_API_KEY=sk-or-v1-...
```
3. لا تضع المفتاح في GitHub أبداً — يُمرّر كـ env داخل Sandbox فقط.

## 4) إعداد Vercel
في **Vercel Dashboard → Project → Settings → Environment Variables** أضف:
- `OPENROUTER_API_KEY`
- `AUTH_SECRET` (openssl rand -base64 32)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (من GitHub OAuth App)
- `OPENCODE_SERVER_PASSWORD` (اختياري لكن مُستحسن)
- `POSTGRES_URL` / `BLOB_READ_WRITE_TOKEN` / `KV_*` (من Vercel Storage)
- `ENCRYPTION_KEY` (openssl rand -base64 32) لتشفير مفاتيح المستخدمين

## 5) قاعدة البيانات
```bash
pnpm db:push
```

## 6) النشر
```bash
vercel --prod
```

## 7) الاستخدام
1. افتح `https://your-app.vercel.app/dashboard`
2. أنشئ جلسة جديدة (اختر النموذج — جرّب المجاني أولاً)
3. ستُفتح واجهة OpenCode الأصلية على `sb-xxxx.vercel.run`
4. من هاتفك: افتح نفس الرابط أو احفظه كـ PWA
