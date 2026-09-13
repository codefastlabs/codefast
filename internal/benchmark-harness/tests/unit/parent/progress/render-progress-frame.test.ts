import { describe, expect, it } from "vitest";

import type { LibraryProgress } from "#/parent/progress/progress-tracker";
import { formatElapsed, renderProgressFrame } from "#/parent/progress/render-progress-frame";
import { createPalette } from "#/shared/palette";

const ESCAPE = String.fromCodePoint(0x1b);
const ANSI_CODE = new RegExp(`${ESCAPE}\\[[0-9;]*m`, "g");

function row(overrides: Partial<LibraryProgress> & Pick<LibraryProgress, "key" | "label">): LibraryProgress {
  return {
    status: "queued",
    subprocessScope: "suite",
    scenarioCount: undefined,
    trialCount: undefined,
    passScenario: 0,
    passTrial: undefined,
    unitsDone: 0,
    currentScenarioId: undefined,
    startedAtMs: undefined,
    finishedAtMs: undefined,
    exitCode: undefined,
    ...overrides,
  };
}

describe("formatElapsed", () => {
  it.each([
    [0, "0.0s"],
    [4230, "4.2s"],
    [59_949, "59.9s"],
    [60_000, "1m00s"],
    [125_000, "2m05s"],
    [-5, "0.0s"],
  ])("formats %i ms as %s", (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected);
  });
});

describe("renderProgressFrame", () => {
  const rows = [
    row({
      key: "cf",
      label: "@codefast/di",
      status: "done",
      scenarioCount: 111,
      trialCount: 1,
      passScenario: 111,
      unitsDone: 111,
      startedAtMs: 0,
      finishedAtMs: 4200,
    }),
    row({
      key: "inv",
      label: "InversifyJS 8",
      status: "running",
      scenarioCount: 111,
      trialCount: 1,
      passScenario: 47,
      passTrial: 1,
      unitsDone: 47,
      currentScenarioId: "resolve-all-named-16",
      startedAtMs: 4200,
    }),
    row({ key: "awi", label: "Awilix 13" }),
  ];

  it("aligns labels, bars and counts into columns and ends with a status or scenario", () => {
    const lines = renderProgressFrame(rows, { nowMs: 5700, width: 120, unicode: false });
    expect(lines).toEqual([
      "@codefast/di   ####################  111/111  4.2s  done",
      "InversifyJS 8  ########............   47/111  1.5s  resolve-all-named-16",
      "Awilix 13      ....................                 queued",
    ]);
  });

  it("draws block characters when unicode is on", () => {
    const [line] = renderProgressFrame([rows[1]!], { nowMs: 5700, width: 120, unicode: true });
    expect(line).toContain("████████░░░░░░░░░░░░");
  });

  it("shows the trial ordinal only when a library runs more than one trial", () => {
    const multi = row({
      key: "cf",
      label: "cf",
      status: "running",
      scenarioCount: 10,
      trialCount: 3,
      passScenario: 2,
      passTrial: 2,
      unitsDone: 12,
      startedAtMs: 0,
    });
    const [line] = renderProgressFrame([multi], { nowMs: 1000, width: 120, unicode: false });
    expect(line).toBe("cf  ########............  2/10  t2/3  1.0s");
  });

  it("never exceeds the width, clipping the tail with an ellipsis and dropping it when no room is left", () => {
    const lines = renderProgressFrame(rows, { nowMs: 5700, width: 60, unicode: true });
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(60);
    }
    expect(lines[1]).toMatch(/  resolve…$/);
    const [cramped] = renderProgressFrame([rows[1]!], { nowMs: 5700, width: 40, unicode: true });
    expect(cramped).toBe("InversifyJS 8  ████████░░░░░░░░░░░░  47/111  1.5s");
  });

  it("pads before it tints, so a coloured frame strips back to the plain one", () => {
    const plain = renderProgressFrame(rows, { nowMs: 5700, width: 120, unicode: false });
    const colored = renderProgressFrame(rows, {
      nowMs: 5700,
      width: 120,
      unicode: false,
      palette: createPalette({ enabled: true }),
    });
    expect(colored).not.toEqual(plain);
    expect(colored.map((line) => line.replaceAll(ANSI_CODE, ""))).toEqual(plain);
    expect(colored[0]).toContain(`${ESCAPE}[32m####################${ESCAPE}[39m`);
    expect(colored[1]).toContain(`${ESCAPE}[36m########${ESCAPE}[39m`);
  });

  it("names the exit code on a failed row and labels discovery", () => {
    const lines = renderProgressFrame(
      [
        row({ key: "a", label: "a", status: "failed", exitCode: 1, startedAtMs: 0, finishedAtMs: 500 }),
        row({ key: "b", label: "b", status: "discovering", startedAtMs: 0 }),
      ],
      { nowMs: 500, width: 120, unicode: false },
    );
    expect(lines[0]).toMatch(/failed \(exit 1\)$/);
    expect(lines[1]).toMatch(/discovering scenarios$/);
  });
});
