"use client";
import { useEffect, useState } from "react";

export function MetricsCard({ sandboxId }: { sandboxId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  async function load() {
    const r = await fetch(`/api/sandbox/metrics?sandboxId=${encodeURIComponent(sandboxId)}`);
    const j = await r.json();
    setData(j);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [sandboxId]);

  if (!data) return <div className="rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">جاري تحميل المقاييس…</div>;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold">المقاييس والتكلفة</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-black border border-white/10 p-3">
          <p className="text-zinc-400">CPU النشط</p>
          <p className="font-mono mt-1">{String(data.activeCpuMs ?? "—")} ms</p>
        </div>
        <div className="rounded-xl bg-black border border-white/10 p-3">
          <p className="text-zinc-400">التكلفة التقديرية</p>
          <p className="font-mono mt-1">${String((data.estimatedCostUsd as number)?.toFixed?.(4) ?? "0")} </p>
        </div>
        <div className="rounded-xl bg-black border border-white/10 p-3 col-span-2">
          <p className="text-zinc-400">الذاكرة / القرص</p>
          <p className="font-mono mt-1 text-[11px]" dir="ltr">MEM: {String(data.memory)} | DISK: {String(data.disk)}</p>
        </div>
      </div>
      <p className="text-[11px] text-zinc-500 mt-2">يُحسب الاستهلاك بعد الإيقاف بدقة — هذه قيم داخل الـ VM مباشرة.</p>
    </div>
  );
}
