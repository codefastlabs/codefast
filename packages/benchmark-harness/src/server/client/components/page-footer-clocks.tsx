import { useEffect, useState } from "react";

import { formatLocal } from "#/server/client/lib/format";

/**
 * Formats `generatedAtIso` with the viewer's locale/TZ after mount only,
 * avoiding SSR vs hydration mismatches from `toLocaleString`.
 */
export function ClientSnapshotClock({ iso }: { readonly iso: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(formatLocal(iso, iso));
  }, [iso]);
  if (text === null) {
    return null;
  }
  return <> Data snapshot {text} (server clock).</>;
}

/** “Page opened …” uses client clock only — no SSR/client text mismatch. */
export function ClientPageOpenedClock() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(formatLocal(new Date().toISOString(), ""));
  }, []);
  if (text === null) {
    return null;
  }
  return <> Page opened {text} (local).</>;
}
