/**
 * تفضيلات المستخدم — Zustand مع حفظ في localStorage
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Preferences = {
  defaultModel: string;
  defaultRuntime: "node22" | "node24" | "python3.13";
  defaultVcpus: number;
  defaultTimeoutMin: number;
  autoRefreshSec: number;
  set: (p: Partial<Omit<Preferences, "set" | "reset">>) => void;
  reset: () => void;
};

const DEFAULTS = {
  defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
  defaultRuntime: "node22" as const,
  defaultVcpus: 4,
  defaultTimeoutMin: 30,
  autoRefreshSec: 10,
};

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (p) => set(p),
      reset: () => set(DEFAULTS),
    }),
    { name: "opencode-cloud-prefs", version: 1 }
  )
);
