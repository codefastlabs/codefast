import { DISPERSION_IQR_ALERT } from "#/app/lib/constants";

/**
 * Formats a run's ISO timestamp as a short local date-time, falling back to the folder name.
 *
 * @since 0.3.16-canary.1
 */
export function formatLocal(timestampIso: string | undefined, fallbackFolder: string): string {
  if (!timestampIso) {
    return fallbackFolder;
  }
  const runDate = new Date(timestampIso);
  if (Number.isNaN(runDate.getTime())) {
    return fallbackFolder;
  }
  return runDate.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

/**
 * Formats an hz/op value with thousands separators, or an em dash when absent.
 *
 * @since 0.3.16-canary.1
 */
export function fmtHz(hz: number | null | undefined): string {
  if (hz === null || hz === undefined || !Number.isFinite(hz)) {
    return "—";
  }
  return Number(hz).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const COMPACT_NUMBER = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Formats an hz/op axis tick compactly (`70M`, `1.5K`), or an empty string for a non-finite value.
 */
export function fmtHzCompact(hz: number): string {
  return Number.isFinite(hz) ? COMPACT_NUMBER.format(hz) : "";
}

/**
 * Formats a run's ISO timestamp as a short axis tick — time only when the axis spans one day.
 */
export function fmtRunTick(timestampIso: string | undefined, fallbackFolder: string, sameDay: boolean): string {
  if (!timestampIso) {
    return fallbackFolder;
  }
  const runDate = new Date(timestampIso);
  if (Number.isNaN(runDate.getTime())) {
    return fallbackFolder;
  }
  return sameDay
    ? runDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : runDate.toLocaleString(undefined, { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Formats a primary-over-compare throughput ratio, or an em dash when absent.
 */
export function fmtRatio(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return "—";
  }
  return `${ratio.toFixed(3)}×`;
}

/**
 * Formats the signed percentage change between two hz values, or an em dash when either is unusable.
 *
 * @since 0.3.16-canary.1
 */
export function fmtPctChange(from: number | null, to: number | null): string {
  if (from === null || to === null || from <= 0 || to <= 0) {
    return "—";
  }
  const pct = ((to - from) / from) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

/**
 * Normalises text for case-insensitive search matching.
 *
 * @since 0.3.16-canary.1
 */
export function searchNorm(text: string): string {
  return String(text || "").toLowerCase();
}

/**
 * Builds the low/medium/high spread suffix for an IQR fraction, or an empty string when absent.
 *
 * @since 0.3.16-canary.1
 */
export function spreadTierLabel(fraction: number | null | undefined): string {
  if (fraction == null || !Number.isFinite(fraction)) {
    return "";
  }
  if (fraction <= 0.1) {
    return " · spread: low";
  }
  // The high tier begins where the dispersion banner raises its alert, so the two labels agree.
  if (fraction <= DISPERSION_IQR_ALERT) {
    return " · spread: medium";
  }
  return " · spread: high";
}

/**
 * Reports whether the browser platform is Mac-like, so shortcut hints show ⌘ instead of Ctrl.
 *
 * @since 0.3.16-canary.1
 */
export function isMacLikePlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  if (/Mac|iPhone|iPod|iPad/i.test(navigator.platform ?? "")) {
    return true;
  }
  const uad = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  return uad?.platform === "macOS";
}
