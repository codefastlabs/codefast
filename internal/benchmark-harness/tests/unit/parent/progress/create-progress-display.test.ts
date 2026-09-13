import { describe, expect, it } from "vitest";

import {
  canDrawLiveProgress,
  createProgressDisplay,
  prefersUnicodeBars,
} from "#/parent/progress/create-progress-display";
import { LiveProgressDisplay } from "#/parent/progress/live-progress-display";
import { PlainProgressDisplay } from "#/parent/progress/plain-progress-display";

function stream(isTTY: boolean): NodeJS.WriteStream {
  return { isTTY, columns: 80, write: () => true } as unknown as NodeJS.WriteStream;
}

describe("canDrawLiveProgress", () => {
  it("needs a TTY that is neither CI nor a dumb terminal", () => {
    expect(canDrawLiveProgress(stream(true), {})).toBe(true);
    expect(canDrawLiveProgress(stream(false), {})).toBe(false);
    expect(canDrawLiveProgress(stream(true), { CI: "true" })).toBe(false);
    expect(canDrawLiveProgress(stream(true), { TERM: "dumb" })).toBe(false);
  });
});

describe("prefersUnicodeBars", () => {
  it("trusts macOS and a UTF-8 locale, and falls back to ASCII otherwise", () => {
    expect(prefersUnicodeBars({}, "darwin")).toBe(true);
    expect(prefersUnicodeBars({ LANG: "en_US.UTF-8" }, "linux")).toBe(true);
    expect(prefersUnicodeBars({ LC_ALL: "C.utf8" }, "linux")).toBe(true);
    expect(prefersUnicodeBars({ LANG: "C" }, "linux")).toBe(false);
  });
});

describe("createProgressDisplay", () => {
  it("goes live on an interactive stderr and plain when verbose or piped", () => {
    expect(createProgressDisplay({ verbose: false, stream: stream(true), env: {} })).toBeInstanceOf(
      LiveProgressDisplay,
    );
    expect(createProgressDisplay({ verbose: true, stream: stream(true), env: {} })).toBeInstanceOf(
      PlainProgressDisplay,
    );
    expect(createProgressDisplay({ verbose: false, stream: stream(false), env: {} })).toBeInstanceOf(
      PlainProgressDisplay,
    );
  });
});
