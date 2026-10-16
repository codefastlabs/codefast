import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createAuditCommand } from "#audit/command";
import type { PropsAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

// Each alias stands for one judgement the type server has to make; the comment names it.
const PROPS_SOURCE = [
  "interface Base { a?: string }",
  "interface Extra { b?: string }",
  'type Choice = { kind: "one" } | { kind: "many" };',
  "export type BoxProps = Base & { c?: string }; // object parts: reported",
  "export type ChoiceProps = Choice & { d?: string }; // a union part: kept",
  "export type PlainProps = Base; // a plain alias: not a candidate",
  "export type ScopedProps<P> = P & { scope?: string }; // a type-parameter part: kept",
  "export type PartialProps<T> = Partial<T> & { e?: string }; // a mapped type over a type parameter: kept",
  "export type ScopedBoxProps = ScopedProps<Base & Extra>; // object parts passed to a wrapper: reported",
  "export type BrokenProps = Missing & { f?: string }; // an unresolved part: reported",
  "",
].join("\n");

let fixtureDir: string;
let exitCode: number;
let reported: Array<string>;

// Runs the audit command in-process, so the type server it spawns is the one subprocess and coverage sees the probe.
beforeAll(async () => {
  fixtureDir = mkdtempSync(path.join(tmpdir(), "codefast-audit-props-"));
  writeFileSync(
    path.join(fixtureDir, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { strict: true, noEmit: true, types: [] }, include: ["src"] }),
  );
  mkdirSync(path.join(fixtureDir, "src"));
  writeFileSync(path.join(fixtureDir, "src", "props.ts"), PROPS_SOURCE);

  const previousExitCode = process.exitCode;
  process.exitCode = undefined;
  const out = vi.spyOn(logger, "out").mockImplementation(() => {});
  try {
    await createAuditCommand().parseAsync(["node", "audit", "props", fixtureDir, "--json"]);
    exitCode = typeof process.exitCode === "number" ? process.exitCode : 0;
    const summary = JSON.parse(String(out.mock.calls[0]?.[0])) as { result: PropsAuditResult };
    reported = summary.result.files.flatMap(({ violations }) =>
      violations.map(({ raw }) => /type (\w+)/.exec(raw)?.[1] ?? raw),
    );
  } finally {
    process.exitCode = previousExitCode;
    out.mockRestore();
  }
}, 60_000);

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

describe("audit props over a real type server", () => {
  it("reports a props intersection of object types, and exits non-zero", () => {
    expect(exitCode).toBe(1);
    expect(reported).toContain("BoxProps");
    expect(reported).toContain("ScopedBoxProps");
  });

  it("keeps an intersection whose part is a union", () => {
    expect(reported).not.toContain("ChoiceProps");
  });

  it("keeps an intersection over a type parameter, bare or mapped", () => {
    expect(reported).not.toContain("ScopedProps");
    expect(reported).not.toContain("PartialProps");
  });

  it("does not report a plain alias", () => {
    expect(reported).not.toContain("PlainProps");
  });

  it("reports a part that does not resolve instead of letting it pass", () => {
    expect(reported).toStrictEqual(["BoxProps", "ScopedBoxProps", "BrokenProps"]);
  });
});
