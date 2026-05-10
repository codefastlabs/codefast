export function formatLocal(timestampIso: string | undefined, fallbackFolder: string): string {
  if (!timestampIso) {
    return fallbackFolder;
  }
  const d = new Date(timestampIso);
  if (Number.isNaN(d.getTime())) {
    return fallbackFolder;
  }
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function fmtHz(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) {
    return "—";
  }
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPctChange(from: number | null, to: number | null): string {
  if (from === null || to === null || from <= 0 || to <= 0) {
    return "—";
  }
  const pct = ((to - from) / from) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

export function searchNorm(s: string): string {
  return String(s || "").toLowerCase();
}

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
