"use client";
import { useCallback, useEffect, useState } from "react";

export type SandboxInfo = {
  sandboxId: string;
  domain: string;
  status: string;
};

export function useSandbox(sandboxId?: string) {
  const [data, setData] = useState<SandboxInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!sandboxId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/sandbox/status?sandboxId=${encodeURIComponent(sandboxId)}`);
      const j = await r.json();
      setData(j);
    } finally {
      setLoading(false);
    }
  }, [sandboxId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, loading, refresh };
}
