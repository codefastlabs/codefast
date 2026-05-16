import { useEffect } from "react";
import type { EmbeddedViewerPayload } from "#/types";

const ITEMS = [
  { id: "intro-howto-details", key: "bh-howto-open" },
  { id: "chart-data-details", key: "bh-chartdata-open" },
  { id: "snapshot-details", key: "bh-snapshot-open" },
] as const;

export function useDetailsPersist(payload: EmbeddedViewerPayload | null): void {
  useEffect(() => {
    for (const cfg of ITEMS) {
      const el = document.getElementById(cfg.id) as HTMLDetailsElement | null;
      if (!el) {
        continue;
      }
      try {
        if (localStorage.getItem(cfg.key) === "1") {
          el.open = true;
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!payload) {
      return;
    }
    const cleanups: Array<() => void> = [];
    for (const cfg of ITEMS) {
      const el = document.getElementById(cfg.id) as HTMLDetailsElement | null;
      if (!el) {
        continue;
      }
      const handler = () => {
        try {
          localStorage.setItem(cfg.key, el.open ? "1" : "0");
        } catch {
          /* ignore */
        }
      };
      el.addEventListener("toggle", handler);
      cleanups.push(() => el.removeEventListener("toggle", handler));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [payload]);
}
