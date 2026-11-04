#!/usr/bin/env bash
set -euo pipefail

# bootstrap.sh — يُنفّذ داخل Vercel Sandbox عند إنشاء جلسة جديدة
# يقوم بـ: تثبيت OpenCode + إعداد OpenRouter + تشغيل الخادم على 4096

echo "[bootstrap] بدء إعداد OpenCode داخل Sandbox..."

# 1) تثبيت OpenCode الرسمي
if ! command -v opencode >/dev/null 2>&1; then
  echo "[bootstrap] تثبيت OpenCode..."
  curl -fsSL https://opencode.ai/install | bash
  export PATH="$HOME/.opencode/bin:$PATH"
  echo 'export PATH="$HOME/.opencode/bin:$PATH"' >> ~/.bashrc
else
  echo "[bootstrap] OpenCode مثبت بالفعل: $(opencode --version 2>&1 || echo unknown)"
  export PATH="$HOME/.opencode/bin:$PATH"
fi

# 2) إعداد opencode.json (يُستبدل بـ API أيضاً، لكن نحتفظ به كاحتياط)
CONFIG_DIR="$HOME/.config/opencode"
mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_DIR/opencode.json" <<'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/auto",
  "provider": {
    "openrouter": {
      "apiKey": "{env:OPENROUTER_API_KEY}"
    }
  },
  "server": {
    "hostname": "0.0.0.0",
    "port": 4096
  }
}
JSON
# أيضاً في /vercel/sandbox
cp "$CONFIG_DIR/opencode.json" /vercel/sandbox/opencode.json 2>/dev/null || true

# 3) تثبيت أدوات مفيدة
sudo dnf install -y git gh jq 2>/dev/null || sudo apt-get update && sudo apt-get install -y git gh jq 2>/dev/null || true

# 4) تشغيل OpenCode web في الخلفية
echo "[bootstrap] تشغيل opencode web على 0.0.0.0:4096 ..."
nohup opencode web --hostname 0.0.0.0 --port 4096 > /tmp/opencode.log 2>&1 &
echo $! > /tmp/opencode.pid

# 5) انتظار الجاهزية
for i in {1..20}; do
  if curl -sf http://127.0.0.1:4096/ >/dev/null 2>&1; then
    echo "[bootstrap] OpenCode جاهز ✓"
    break
  fi
  sleep 1
done

cat /tmp/opencode.log 2>/dev/null | tail -n 20 || true
echo "[bootstrap] اكتمل."
