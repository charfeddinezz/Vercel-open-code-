"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#fafafa", fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center", border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 32 }}>
          <div style={{ fontSize: 36 }}>💥</div>
          <h1 style={{ fontSize: 20 }}>خطأ جسيم في التطبيق</h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.8 }}>{error.message}</p>
          <button onClick={reset} style={{ background: "#fff", color: "#000", border: 0, borderRadius: 12, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>إعادة المحاولة</button>
        </div>
      </body>
    </html>
  );
}
