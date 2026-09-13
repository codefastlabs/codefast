/** The one place a pivot-over-competitor ratio is read as a win, a loss or parity. */
import type { Palette, Tint } from "#/shared/palette";

/**
 * A ratio within this band of 1.0 is statistical parity, not a win or a loss.
 */
export const HEAD_TO_HEAD_PARITY_BAND = 0.03;

/**
 * How a ratio reads from the pivot's side.
 */
export type Verdict = "win" | "loss" | "parity";

/**
 * Classifies a pivot ÷ competitor ratio.
 */
export function classifyRatio(ratio: number): Verdict {
  if (ratio > 1 + HEAD_TO_HEAD_PARITY_BAND) {
    return "win";
  }
  if (ratio < 1 - HEAD_TO_HEAD_PARITY_BAND) {
    return "loss";
  }
  return "parity";
}

/**
 * The palette role a verdict is drawn in.
 */
export function verdictTint(verdict: Verdict, palette: Palette): Tint {
  switch (verdict) {
    case "win": {
      return palette.win;
    }
    case "loss": {
      return palette.loss;
    }
    case "parity": {
      return palette.parity;
    }
  }
}

/**
 * Tints a ratio by its verdict; a missing or unreliable ratio reads dim instead.
 */
export function ratioTint(ratio: number, unreliable: boolean, palette: Palette): Tint {
  if (ratio <= 0 || !Number.isFinite(ratio) || unreliable) {
    return palette.dim;
  }
  return verdictTint(classifyRatio(ratio), palette);
}
