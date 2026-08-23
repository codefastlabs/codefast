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
  if (fraction <= 0.25) {
    return " · spread: medium";
  }
  return " · spread: high";
}

/**
 * Escapes HTML-significant characters for safe interpolation into markup.
 *
 * @since 0.3.16-canary.1
 */
export function escHtml(text: string): string {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
