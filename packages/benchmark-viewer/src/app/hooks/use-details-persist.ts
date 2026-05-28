import { useEffect } from "react";
import type { EmbeddedViewerPayload } from "#/types";

const ITEMS = [
  { id: "intro-howto-details", key: "bh-howto-open" },
  { id: "chart-data-details", key: "bh-chartdata-open" },
  { id: "snapshot-details", key: "bh-snapshot-open" },
] as const;

/**
 * @since 0.3.16-canary.3
 */
export function useDetailsPersist(payload: EmbeddedViewerPayload | null): void {
  useEffect(() => {
    for (const detailsItem of ITEMS) {
      const detailsElement = document.getElementById(detailsItem.id) as HTMLDetailsElement | null;
      if (!detailsElement) {
        continue;
      }
      try {
        if (localStorage.getItem(detailsItem.key) === "1") {
          detailsElement.open = true;
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
    for (const detailsItem of ITEMS) {
      const detailsElement = document.getElementById(detailsItem.id) as HTMLDetailsElement | null;
      if (!detailsElement) {
        continue;
      }
      const handler = () => {
        try {
          localStorage.setItem(detailsItem.key, detailsElement.open ? "1" : "0");
        } catch {
          /* ignore */
        }
      };
      detailsElement.addEventListener("toggle", handler);
      cleanups.push(() => detailsElement.removeEventListener("toggle", handler));
    }
    return () => cleanups.forEach((removeToggleListener) => removeToggleListener());
  }, [payload]);
}
