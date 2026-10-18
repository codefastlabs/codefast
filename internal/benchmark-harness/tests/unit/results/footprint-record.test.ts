import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readBudgetBytes, readFootprintRecord, writeFootprintRecord } from "#results/footprint-record";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "footprint-record-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("footprint record", () => {
  it("reads back what it writes", () => {
    const record = { bundler: "Rolldown 1.0.0", footprints: [{ label: "x", minifiedBytes: 10, gzippedBytes: 5 }] };
    writeFootprintRecord(directory, record);

    expect(readFootprintRecord(directory)).toEqual(record);
  });

  it("rejects a record without a footprint list", () => {
    writeFileSync(join(directory, "footprint.json"), JSON.stringify({ bundler: "Rolldown" }));

    expect(() => readFootprintRecord(directory)).toThrow(/needs a "bundler" string and a "footprints" list/);
  });
});

describe("readBudgetBytes", () => {
  it("reads the subject's entry", () => {
    writeFileSync(join(directory, "footprint-budget.json"), JSON.stringify({ "@codefast/x": { gzippedBytes: 1200 } }));

    expect(readBudgetBytes(directory, "@codefast/x")).toBe(1200);
  });

  it("rejects a budget with no positive integer entry for the subject", () => {
    writeFileSync(join(directory, "footprint-budget.json"), JSON.stringify({ "@codefast/y": { gzippedBytes: 1200 } }));

    expect(() => readBudgetBytes(directory, "@codefast/x")).toThrow(/positive integer "@codefast\/x".gzippedBytes/);
  });
});
