/** DOM id for the chart plot region (skip-link target). */
export const CHART_SKIP_TARGET_ID = "bench-chart-host";

/**
 * Scrolls to the chart region and moves keyboard focus without changing `location.hash`.
 */
export function skipToChartTarget(target: HTMLElement | null): void {
  if (!target) {
    return;
  }
  target.scrollIntoView({ block: "start" });
  target.focus({ preventScroll: true });
}

/**
 * Skip-link activation: prevent fragment navigation so view-state hash is preserved.
 */
export function handleSkipToChartClick(event: { preventDefault(): void }): void {
  event.preventDefault();
  if (typeof document === "undefined") {
    return;
  }
  const target = document.getElementById(CHART_SKIP_TARGET_ID);
  skipToChartTarget(target instanceof HTMLElement ? target : null);
}
