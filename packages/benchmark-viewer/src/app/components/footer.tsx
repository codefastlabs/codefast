import { useState } from "react";

import { useHasHydrated } from "#/app/hooks/use-has-hydrated";
import { formatLocal } from "#/app/lib/format";

/**
 * Formats `generatedAtIso` with the viewer's locale/TZ after hydration only,
 * avoiding SSR vs hydration mismatches from `toLocaleString`.
 *
 * @since 0.3.16-canary.1
 */
export function ClientSnapshotClock({ iso }: { readonly iso: string }) {
  const hydrated = useHasHydrated();
  if (!hydrated) {
    return null;
  }
  return <> Data snapshot {formatLocal(iso, iso)} (server clock).</>;
}

/**
 * “Page opened …” uses client clock only — no SSR/client text mismatch.
 *
 * @since 0.3.16-canary.1
 */
export function ClientPageOpenedClock() {
  const [openedIso] = useState(() => new Date().toISOString());
  const hydrated = useHasHydrated();
  if (!hydrated) {
    return null;
  }
  return <> Page opened {formatLocal(openedIso, "")} (local).</>;
}
