import { useSyncExternalStore } from "react";

const emptySubscribe = (): (() => void) => () => {};

/**
 * This app prerenders every route (see `vite.config.ts`), so the static HTML never sees a
 * real visitor — per-visitor UI (consent controls, GPC status) can differ from what the
 * build baked in. Hydrating such UI against that markup would mismatch, so components
 * gate on this and render nothing until after hydration.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
