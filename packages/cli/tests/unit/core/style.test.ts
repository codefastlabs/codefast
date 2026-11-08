import { PassThrough } from "node:stream";

import { afterEach, describe, expect, it, vi } from "vitest";

import { paint, refuseColor } from "#core/style";

// A non-TTY stream, so only the environment can turn color on.
const pipe = new PassThrough();

afterEach(() => {
  refuseColor(false);
  vi.unstubAllEnvs();
});

describe("paint", () => {
  it("colors when the environment forces it", () => {
    vi.stubEnv("FORCE_COLOR", "1");
    vi.stubEnv("NO_COLOR", undefined);

    expect(paint("red", "x", pipe)).not.toBe("x");
  });

  it("stays plain on a pipe the environment leaves alone", () => {
    vi.stubEnv("FORCE_COLOR", undefined);
    vi.stubEnv("NO_COLOR", undefined);

    expect(paint("red", "x", pipe)).toBe("x");
  });

  it("stays plain once --no-color refuses color, whatever the environment says", () => {
    vi.stubEnv("FORCE_COLOR", "1");
    refuseColor(true);

    expect(paint("red", "x", pipe)).toBe("x");
  });
});
