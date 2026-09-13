import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveProgressDisplay } from "#/parent/progress/live-progress-display";

const ESCAPE = String.fromCodePoint(0x1b);

function fakeStream(columns: number): { stream: NodeJS.WriteStream; writes: Array<string> } {
  const writes: Array<string> = [];
  const stream = {
    isTTY: true,
    columns,
    write: (chunk: string): boolean => {
      writes.push(chunk);
      return true;
    },
  } as unknown as NodeJS.WriteStream;
  return { stream, writes };
}

describe("LiveProgressDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("draws the block once per change, clearing the previous block before redrawing", () => {
    const { stream, writes } = fakeStream(80);
    const display = new LiveProgressDisplay({ stream, unicode: false, now: () => Date.now() });
    display.register("cf", "cf");
    display.register("inv", "inv");
    expect(writes).toEqual([
      "cf  ....................  queued\n",
      `${ESCAPE}[1A${ESCAPE}[0J`,
      "cf   ....................  queued\ninv  ....................  queued\n",
    ]);
    display.finish();
  });

  it("keeps a log line above the block and redraws the block under it", () => {
    const { stream, writes } = fakeStream(80);
    const display = new LiveProgressDisplay({ stream, unicode: false, now: () => Date.now() });
    display.register("cf", "cf");
    writes.length = 0;
    display.log("[codefast] sanity failed: alpha");
    expect(writes).toEqual([
      `${ESCAPE}[1A${ESCAPE}[0J`,
      "[codefast] sanity failed: alpha\n",
      "cf  ....................  queued\n",
    ]);
    display.finish();
  });

  it("ticks the elapsed time while a library runs and stops after finish", () => {
    const { stream, writes } = fakeStream(80);
    const display = new LiveProgressDisplay({ stream, unicode: false, now: () => Date.now() });
    display.register("cf", "cf");
    display.subprocessStarted("cf");
    writes.length = 0;
    vi.advanceTimersByTime(250);
    expect(writes.some((chunk) => chunk.includes("0.2s"))).toBe(true);
    display.subprocessFinished("cf", 0);
    display.finish();
    writes.length = 0;
    vi.advanceTimersByTime(1000);
    expect(writes).toEqual([]);
  });
});
