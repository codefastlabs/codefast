import { describe, expect, it } from "vitest";

import {
  THROUGHPUT_NOISE_CEILING_HZ_PER_OP,
  UNRELIABLE_RATIO_MARKER,
  formatReliabilityCaveatLine,
  isRatioUnreliable,
  isThroughputAboveNoiseCeiling,
  markRatioReliability,
} from "#/report/reliability";

const ABOVE_CEILING = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
const BELOW_CEILING = THROUGHPUT_NOISE_CEILING_HZ_PER_OP - 1;

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

describe("markRatioReliability", () => {
  it("appends the marker only to an unreliable ratio", () => {
    expect(markRatioReliability("1.21×", ABOVE_CEILING, BELOW_CEILING)).toBe(`1.21×${UNRELIABLE_RATIO_MARKER}`);
    expect(markRatioReliability("1.21×", BELOW_CEILING, BELOW_CEILING)).toBe("1.21×");
  });

  it("leaves an em-dash unmarked, since a one-sided row has no ratio to qualify", () => {
    expect(markRatioReliability("—", ABOVE_CEILING, 0)).toBe("—");
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
