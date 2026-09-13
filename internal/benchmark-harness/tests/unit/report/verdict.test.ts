import { describe, expect, it } from "vitest";

import { classifyRatio, HEAD_TO_HEAD_PARITY_BAND, ratioTint } from "#/report/verdict";
import { createPalette } from "#/shared/palette";

describe("classifyRatio", () => {
  it("reads the parity band as parity and everything outside it as a win or a loss", () => {
    expect(classifyRatio(1)).toBe("parity");
    expect(classifyRatio(1 + HEAD_TO_HEAD_PARITY_BAND)).toBe("parity");
    expect(classifyRatio(1 + HEAD_TO_HEAD_PARITY_BAND + 0.001)).toBe("win");
    expect(classifyRatio(1 - HEAD_TO_HEAD_PARITY_BAND - 0.001)).toBe("loss");
  });
});

describe("ratioTint", () => {
  it("dims a missing or unreliable ratio whatever its verdict", () => {
    const palette = createPalette({ enabled: true });
    expect(ratioTint(2, false, palette)("x")).toBe(palette.win("x"));
    expect(ratioTint(2, true, palette)("x")).toBe(palette.dim("x"));
    expect(ratioTint(0, false, palette)("x")).toBe(palette.dim("x"));
    expect(ratioTint(0.5, false, palette)("x")).toBe(palette.loss("x"));
  });
});
