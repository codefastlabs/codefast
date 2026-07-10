import { useSyncExternalStore } from "react";

const emptySubscribe = (): (() => void) => () => {};

/**
 * Entry pages are prerendered and slug pages are CDN-cached ISR (see `vite.config.ts`), so
 * the served HTML never sees a real visitor — per-visitor UI (consent controls, GPC status)
 * can differ from what that shared markup baked in. Hydrating such UI against that markup
 * would mismatch, so components gate on this and render nothing until after hydration.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
