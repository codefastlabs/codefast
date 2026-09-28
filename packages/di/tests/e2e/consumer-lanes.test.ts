/**
 * A consumer's program run against the built package through each lane that ships one: tsx, whose esbuild lowers the
 * decorators as it loads, and `tsc` output on a bare Node.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ConsumerProject, ProcessRun } from "#tests/e2e/support/consumer-project";
import { createConsumerProject, SUBPROCESS_TEST_TIMEOUT_MS } from "#tests/e2e/support/consumer-project";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "consumer");

/**
 * What the fixture prints under every lane: the constructor body and a later field see the injected accessor, a
 * subclass's accessor is set once `super()` returns, and teardown runs in reverse creation order.
 */
const EXPECTED_OUTPUT = {
  fieldSawInjection: true,
  log: [
    "constructor:hello",
    "init:Greeter",
    "constructor:hello",
    "constructor:HELLO",
    "init:LoudGreeter",
    "close:LoudGreeter",
    "close:Greeter",
  ],
};

/** A run reduced to what the assertions compare: stderr only when the child failed, the output parsed once it passed. */
function outcomeOf(run: ProcessRun): Readonly<Record<string, unknown>> {
  const passed = run.status === 0;
  return {
    status: run.status,
    error: run.error,
    stderr: passed ? "" : run.stderr,
    output: passed ? (JSON.parse(run.stdout) as unknown) : run.stdout,
  };
}

const PASSED = { status: 0, error: undefined, stderr: "", output: EXPECTED_OUTPUT };

let project: ConsumerProject;

beforeAll(() => {
  project = createConsumerProject(fixtureDir);
}, SUBPROCESS_TEST_TIMEOUT_MS);

afterAll(() => {
  project.remove();
});

describe("tsx", () => {
  it("runs the program with no setup", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    expect(outcomeOf(project.runTsx("src/entry-bare.ts"))).toEqual(PASSED);
  });
});

describe("tsc at a target below ESNext, then a bare Node", () => {
  beforeAll(() => {
    // The setup the README states: no host types, the explicit-resource-management lib, declarations checked.
    project.compile("lowered", {
      target: "ES2025",
      module: "NodeNext",
      strict: true,
      skipLibCheck: false,
      types: [],
      lib: ["ES2025", "ESNext.Disposable"],
    });
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("runs the program once Symbol.metadata is installed first", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    expect(outcomeOf(project.runNode("lowered/entry-installed.js"))).toEqual(PASSED);
  });

  it(
    "throws MissingDecoratorMetadataError naming the fix when Symbol.metadata is missing",
    { timeout: SUBPROCESS_TEST_TIMEOUT_MS },
    () => {
      const run = project.runNode("lowered/entry-bare.js");

      expect(run.status).toBe(1);
      expect(run.stdout).toBe("");
      expect(run.stderr).toContain("MissingDecoratorMetadataError");
      expect(run.stderr).toContain('(Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata")');
    },
  );
});

describe("tsc at target ESNext", () => {
  it("leaves the decorators in place, which Node cannot parse", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    project.compile("esnext", { target: "ESNext", module: "NodeNext", strict: true, types: [], lib: ["ESNext"] });

    const run = project.runNode("esnext/entry-installed.js");

    expect(run.status).toBe(1);
    expect(run.stderr).toContain("SyntaxError");
  });
});
