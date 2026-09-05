import { NOISY_IQR_FRACTION } from "@codefast/benchmark-harness/report/reliability";
import { format } from "date-fns";

import { DISPERSION_IQR_ALERT } from "#/app/lib/constants";

/**
 * The date-fns patterns one region's readers expect for the viewer's timestamps.
 *
 * @since 0.3.16-canary.3
 */
export interface TimeConventions {
  /** Full stamp, e.g. `17/8/26, 23:12`. */
  readonly fullPattern: string;
  /** Year-less axis tick, e.g. `17/8 23:12`. */
  readonly tickPattern: string;
  /** Time-only axis tick for a single-day axis. */
  readonly clockPattern: string;
}

const VI_TIME_CONVENTIONS: TimeConventions = {
  fullPattern: "d/M/yy, HH:mm",
  tickPattern: "d/M HH:mm",
  clockPattern: "HH:mm",
};

const EN_US_TIME_CONVENTIONS: TimeConventions = {
  fullPattern: "M/d/yy, h:mm a",
  tickPattern: "M/d h:mm a",
  clockPattern: "h:mm a",
};

// Timezone is the "where is the reader" signal; browser language keys the fallback lane.
const TIME_ZONE_CONVENTIONS: ReadonlyMap<string, TimeConventions> = new Map([
  ["Asia/Ho_Chi_Minh", VI_TIME_CONVENTIONS],
  ["Asia/Saigon", VI_TIME_CONVENTIONS],
]);

const LANGUAGE_CONVENTIONS: ReadonlyMap<string, TimeConventions> = new Map([["vi", VI_TIME_CONVENTIONS]]);

/**
 * Resolves timestamp conventions from where the reader is (timezone), then their browser
 * language, then a day-unambiguous US default.
 *
 * @remarks Timezone outranks language on purpose: a browser installed in English still belongs
 * to a reader in Vietnam, and language alone would hand them month-first dates.
 *
 * @since 0.7.2
 */
export function resolveTimeConventions(language: string | undefined, timeZone: string | undefined): TimeConventions {
  const byZone = timeZone === undefined ? undefined : TIME_ZONE_CONVENTIONS.get(timeZone);
  if (byZone !== undefined) {
    return byZone;
  }
  const primaryLanguage = language?.toLowerCase().split("-")[0];
  const byLanguage = primaryLanguage === undefined ? undefined : LANGUAGE_CONVENTIONS.get(primaryLanguage);
  return byLanguage ?? EN_US_TIME_CONVENTIONS;
}

function detectTimeConventions(): TimeConventions {
  const timeZone = typeof Intl === "undefined" ? undefined : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = typeof navigator === "undefined" ? undefined : navigator.language;
  return resolveTimeConventions(language, timeZone);
}

const activeTimeConventions = detectTimeConventions();

/**
 * Formats a run's ISO timestamp as a full local stamp (`17/8/26, 23:12` in Vietnam), falling
 * back to the folder name.
 *
 * @since 0.3.16-canary.1
 */
export function formatLocal(
  timestampIso: string | undefined,
  fallbackFolder: string,
  conventions: TimeConventions = activeTimeConventions,
): string {
  if (!timestampIso) {
    return fallbackFolder;
  }
  const runDate = new Date(timestampIso);
  if (Number.isNaN(runDate.getTime())) {
    return fallbackFolder;
  }
  return format(runDate, conventions.fullPattern);
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
 *
 * @since 0.7.2
 */
export function fmtHzCompact(hz: number): string {
  return Number.isFinite(hz) ? COMPACT_NUMBER.format(hz) : "";
}

/**
 * Formats a run's ISO timestamp as a short local axis tick (`17/8 23:12` in Vietnam) — time
 * only when the axis spans one day.
 *
 * @since 0.7.2
 */
export function fmtRunTick(
  timestampIso: string | undefined,
  fallbackFolder: string,
  sameDay: boolean,
  conventions: TimeConventions = activeTimeConventions,
): string {
  if (!timestampIso) {
    return fallbackFolder;
  }
  const runDate = new Date(timestampIso);
  if (Number.isNaN(runDate.getTime())) {
    return fallbackFolder;
  }
  return format(runDate, sameDay ? conventions.clockPattern : conventions.tickPattern);
}

/**
 * Formats a primary-over-compare throughput ratio, or an em dash when absent.
 *
 * @since 0.7.2
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
  // Boundaries mirror the IQR-table severity tiers: low = below the harness noise floor,
  // medium = up to the dispersion alert, so the tooltip and the metric card agree on a value.
  if (fraction <= NOISY_IQR_FRACTION) {
    return " · spread: low";
  }
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
