import { describe, expect, it } from "vitest";

import { createPalette, PLAIN_PALETTE, shouldColor } from "#/shared/palette";

const ESCAPE = String.fromCodePoint(0x1b);

function stream(isTTY: boolean): NodeJS.WriteStream {
  return { isTTY, write: () => true } as unknown as NodeJS.WriteStream;
}

describe("shouldColor", () => {
  it("colours an interactive terminal and nothing else by default", () => {
    expect(shouldColor(stream(true), {})).toBe(true);
    expect(shouldColor(stream(false), {})).toBe(false);
    expect(shouldColor(stream(true), { TERM: "dumb" })).toBe(false);
  });

  it("lets NO_COLOR win over everything and FORCE_COLOR over the TTY check", () => {
    expect(shouldColor(stream(true), { NO_COLOR: "1", FORCE_COLOR: "1" })).toBe(false);
    expect(shouldColor(stream(true), { NODE_DISABLE_COLORS: "1" })).toBe(false);
    expect(shouldColor(stream(false), { FORCE_COLOR: "1" })).toBe(true);
    expect(shouldColor(stream(true), { FORCE_COLOR: "0" })).toBe(false);
  });
});

describe("createPalette", () => {
  it("wraps text in ANSI codes when enabled and returns it untouched when not", () => {
    const colored = createPalette({ enabled: true });
    expect(colored.win("2.00×")).toBe(`${ESCAPE}[32m2.00×${ESCAPE}[39m`);
    expect(colored.failed("x")).toBe(`${ESCAPE}[31m${ESCAPE}[1mx${ESCAPE}[22m${ESCAPE}[39m`);
    expect(PLAIN_PALETTE.win("2.00×")).toBe("2.00×");
    expect(PLAIN_PALETTE.enabled).toBe(false);
  });
});
