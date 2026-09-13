import { describe, expect, it } from "vitest";

import type { RunCardInput } from "#/report/run-card";
import { renderRunCardLines } from "#/report/run-card";
import { createPalette, PLAIN_PALETTE } from "#/shared/palette";

const ESCAPE = String.fromCodePoint(0x1b);

const input: RunCardInput = {
  runId: "2026-09-12T15-57-55-130Z",
  shape: { isolated: false, mode: "fast" },
  trialCount: 1,
  libraryCount: 7,
  scenariosMeasured: 111,
  scenariosAvailable: 111,
  observationRows: 215,
  wallMs: 11_400,
  rebuildMs: 400,
  sanityFailures: [{ displayName: "@codefast/di", ids: [] }],
  artifacts: { latestPointer: "moved" },
  versions: [
    { displayName: "@codefast/di", version: "0.9.0" },
    { displayName: "InversifyJS 8", version: "8.2.3" },
  ],
  relativeRunDirectory: "bench-results/2026-09-12T15-57-55-130Z",
  nextCommands: ["pnpm bench:report", "pnpm bench:serve"],
};

describe("renderRunCardLines", () => {
  it("boxes the card to the width with one key per line", () => {
    const lines = renderRunCardLines(input, { palette: PLAIN_PALETTE, width: 80, unicode: false });
    const title = " Run 2026-09-12T15-57-55-130Z ";
    expect(lines[0]).toBe(`+-${title}${"-".repeat(80 - 3 - title.length)}+`);
    for (const line of lines) {
      expect(line.length).toBe(80);
    }
    const row = (key: string, value: string): string => `${`| ${key.padEnd(8)} ${value}`.padEnd(78)} |`;
    expect(lines[1]).toBe(row("run", "wall 11.4s · rebuild 0.4s · 7 libraries · 111 scenarios · 215 rows"));
    expect(lines[2]).toBe(row("profile", "fast · shared · 1 trial"));
    expect(lines.some((line) => line.includes("sanity   0 failures"))).toBe(true);
    expect(lines.some((line) => line.includes("latest   moved to this run"))).toBe(true);
    expect(lines.at(-1)).toBe(`+${"-".repeat(78)}+`);
  });

  it("explains a kept pointer and names sanity failures", () => {
    const lines = renderRunCardLines(
      {
        ...input,
        scenariosMeasured: 2,
        artifacts: { latestPointer: "kept-filtered" },
        sanityFailures: [{ displayName: "inversify", ids: ["alpha", "beta"] }],
      },
      { palette: PLAIN_PALETTE, width: 100, unicode: true },
    );
    expect(lines.some((line) => line.includes("latest   kept — filtered to 2 of 111 rows"))).toBe(true);
    expect(lines.some((line) => line.includes("sanity   2 failures — inversify: alpha, beta"))).toBe(true);
    expect(lines[0]?.startsWith("┌─ Run ")).toBe(true);
  });

  it("wraps a long versions list and strips back to the plain card when coloured", () => {
    const many = Array.from({ length: 7 }, (_, index) => ({
      displayName: `library-${String(index)}`,
      version: "1.0.0",
    }));
    const plain = renderRunCardLines(
      { ...input, versions: many },
      { palette: PLAIN_PALETTE, width: 60, unicode: false },
    );
    expect(plain.filter((line) => line.includes("library-")).length).toBeGreaterThan(1);
    const colored = renderRunCardLines(
      { ...input, versions: many },
      { palette: createPalette({ enabled: true }), width: 60, unicode: false },
    );
    expect(colored.map((line) => line.replaceAll(new RegExp(`${ESCAPE}\\[[0-9;]*m`, "g"), ""))).toEqual(plain);
  });
});
