import { describe, expect, it } from "vitest";

import type { ThroughputQuality } from "#/report/reliability";
import {
  NOISY_IQR_FRACTION,
  NOISY_IQR_MARKER,
  THROUGHPUT_NOISE_CEILING_HZ_PER_OP,
  UNRELIABLE_RATIO_MARKER,
  formatNoisyIqrCaveatLine,
  formatReliabilityCaveatLine,
  isIqrNoisy,
  isRatioNoisy,
  isRatioUnreliable,
  isThroughputAboveNoiseCeiling,
  isThroughputCellNoisy,
  markRatioQuality,
  markThroughputQuality,
} from "#/report/reliability";

const ABOVE_CEILING = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
const BELOW_CEILING = THROUGHPUT_NOISE_CEILING_HZ_PER_OP - 1;
const TIGHT_IQR = NOISY_IQR_FRACTION / 2;
const WIDE_IQR = NOISY_IQR_FRACTION * 2;

function sample(hzPerOp: number, iqrFraction = TIGHT_IQR): ThroughputQuality {
  return { hzPerOp, iqrFraction };
}

describe("isThroughputAboveNoiseCeiling", () => {
  it("treats the ceiling itself as reliable and anything past it as not", () => {
    expect(isThroughputAboveNoiseCeiling(BELOW_CEILING)).toBe(false);
    expect(isThroughputAboveNoiseCeiling(THROUGHPUT_NOISE_CEILING_HZ_PER_OP)).toBe(false);
    expect(isThroughputAboveNoiseCeiling(ABOVE_CEILING)).toBe(true);
  });

  it("rejects non-finite and non-positive throughput rather than flagging it", () => {
    expect(isThroughputAboveNoiseCeiling(Number.NaN)).toBe(false);
    expect(isThroughputAboveNoiseCeiling(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isThroughputAboveNoiseCeiling(0)).toBe(false);
  });
});

describe("isRatioUnreliable", () => {
  it("flags the ratio when either side is above the ceiling", () => {
    expect(isRatioUnreliable(ABOVE_CEILING, BELOW_CEILING)).toBe(true);
    expect(isRatioUnreliable(BELOW_CEILING, ABOVE_CEILING)).toBe(true);
    expect(isRatioUnreliable(ABOVE_CEILING, ABOVE_CEILING)).toBe(true);
  });

  it("leaves a ratio between two low-throughput rows alone", () => {
    expect(isRatioUnreliable(BELOW_CEILING, BELOW_CEILING)).toBe(false);
  });

  it("never flags a one-sided row — a missing side means there is no ratio to qualify", () => {
    expect(isRatioUnreliable(ABOVE_CEILING, 0)).toBe(false);
    expect(isRatioUnreliable(0, ABOVE_CEILING)).toBe(false);
  });
});

describe("isIqrNoisy", () => {
  it("treats the threshold itself as tight and anything past it as noisy", () => {
    expect(isIqrNoisy(TIGHT_IQR)).toBe(false);
    expect(isIqrNoisy(NOISY_IQR_FRACTION)).toBe(false);
    expect(isIqrNoisy(WIDE_IQR)).toBe(true);
    expect(isIqrNoisy(Number.NaN)).toBe(false);
  });
});

describe("isThroughputCellNoisy", () => {
  it("flags a wide IQR only when there is a measurement behind it", () => {
    expect(isThroughputCellNoisy(sample(100, WIDE_IQR))).toBe(true);
    expect(isThroughputCellNoisy(sample(100))).toBe(false);
    expect(isThroughputCellNoisy(sample(0, WIDE_IQR))).toBe(false);
  });
});

describe("isRatioNoisy", () => {
  it("flags the ratio when either side's median is unstable", () => {
    expect(isRatioNoisy(sample(100, WIDE_IQR), sample(100))).toBe(true);
    expect(isRatioNoisy(sample(100), sample(100, WIDE_IQR))).toBe(true);
    expect(isRatioNoisy(sample(100), sample(100))).toBe(false);
  });

  it("never flags a one-sided row — a missing side means there is no ratio to qualify", () => {
    expect(isRatioNoisy(sample(100, WIDE_IQR), sample(0, WIDE_IQR))).toBe(false);
  });
});

describe("markThroughputQuality", () => {
  it("appends the noise marker only to an unstable median", () => {
    expect(markThroughputQuality("1,000", sample(100, WIDE_IQR))).toBe(`1,000${NOISY_IQR_MARKER}`);
    expect(markThroughputQuality("1,000", sample(100))).toBe("1,000");
  });
});

describe("markRatioQuality", () => {
  it("appends the marker only to an unreliable ratio", () => {
    expect(markRatioQuality("1.21×", sample(ABOVE_CEILING), sample(BELOW_CEILING))).toBe(
      `1.21×${UNRELIABLE_RATIO_MARKER}`,
    );
    expect(markRatioQuality("1.21×", sample(BELOW_CEILING), sample(BELOW_CEILING))).toBe("1.21×");
  });

  it("stacks both markers in footnote order when a ratio earns each", () => {
    expect(markRatioQuality("1.21×", sample(ABOVE_CEILING, WIDE_IQR), sample(BELOW_CEILING))).toBe(
      `1.21×${UNRELIABLE_RATIO_MARKER}${NOISY_IQR_MARKER}`,
    );
  });

  it("leaves an em-dash unmarked, since a one-sided row has no ratio to qualify", () => {
    expect(markRatioQuality("—", sample(ABOVE_CEILING, WIDE_IQR), sample(0, WIDE_IQR))).toBe("—");
  });
});

describe("formatReliabilityCaveatLine", () => {
  it("leads with the marker and names the count", () => {
    const line = formatReliabilityCaveatLine(3);
    expect(line.startsWith(UNRELIABLE_RATIO_MARKER)).toBe(true);
    expect(line).toContain("3 row(s)");
  });

  it("derives the threshold shorthand from the constant rather than hardcoding it", () => {
    const shorthand = `${String(Math.round(THROUGHPUT_NOISE_CEILING_HZ_PER_OP / 1_000_000))}M ops/s`;
    expect(formatReliabilityCaveatLine(1)).toContain(shorthand);
  });

  it("says the IQR does not license the row and points at the aggregates", () => {
    const line = formatReliabilityCaveatLine(1);
    expect(line).toContain("IQR");
    expect(line).toContain("aggregates");
  });
});

describe("formatNoisyIqrCaveatLine", () => {
  it("leads with its own marker and names the count", () => {
    const line = formatNoisyIqrCaveatLine(4);
    expect(line.startsWith(NOISY_IQR_MARKER)).toBe(true);
    expect(line).toContain("4 cell(s)");
  });

  it("derives the threshold from the constant rather than hardcoding it", () => {
    expect(formatNoisyIqrCaveatLine(1)).toContain(`${String(Math.round(NOISY_IQR_FRACTION * 100))}%`);
  });
});
