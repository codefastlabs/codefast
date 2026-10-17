/**
 * A browser bundle of the built package keeps only what the consumer calls: the functions that check and describe a
 * container stay out of a program that only binds and resolves, and so does the async lane until it awaits a resolve; a
 * production build takes the short error messages.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ConsumerProject } from "#tests/e2e/support/consumer-project";
import { createConsumerProject, SUBPROCESS_TEST_TIMEOUT_MS } from "#tests/e2e/support/consumer-project";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "bundle");

/** The modules behind `validate`, `inspect`, `lookupBindings`, `explain` and `generateDependencyGraph`. */
const INTROSPECTION_MODULES = [
  "container/introspect.js",
  "introspection/validation.js",
  "introspection/explanation.js",
  "introspection/dependency-graph.js",
];

/** The modules behind `resolveAsync`, `resolveOptionalAsync`, `resolveAllAsync` and `initializeAsync`. */
const ASYNC_LANE_MODULES = [
  "container/async.js",
  "resolution/async-lane.js",
  "resolution/async-fan-out.js",
  "resolution/plan/async-compiler.js",
];

let project: ConsumerProject;

beforeAll(() => {
  project = createConsumerProject(fixtureDir);
}, SUBPROCESS_TEST_TIMEOUT_MS);

afterAll(() => {
  project.remove();
});

describe("a Rolldown browser bundle", () => {
  it(
    "leaves the introspection functions out of a program that only binds and resolves",
    {
      timeout: SUBPROCESS_TEST_TIMEOUT_MS,
    },
    async () => {
      const { packageModules } = await project.bundle("src/entry-resolve-only.ts");

      expect(packageModules).toContain("container/container.js");
      expect(packageModules.filter((id) => INTROSPECTION_MODULES.includes(id))).toEqual([]);
    },
  );

  it(
    "leaves the async lane out of a program that never awaits a resolve",
    { timeout: SUBPROCESS_TEST_TIMEOUT_MS },
    async () => {
      const { packageModules } = await project.bundle("src/entry-resolve-only.ts");

      expect(packageModules.filter((id) => ASYNC_LANE_MODULES.includes(id))).toEqual([]);
    },
  );

  it("keeps the async lane once the program calls resolveAsync", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, async () => {
    const { packageModules } = await project.bundle("src/entry-resolve-async.ts");

    expect(packageModules).toEqual(
      expect.arrayContaining(["container/async.js", "resolution/async-lane.js", "resolution/plan/async-compiler.js"]),
    );
  });

  it("keeps the validation walk once the program calls validate", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, async () => {
    const { packageModules } = await project.bundle("src/entry-validate.ts");

    expect(packageModules).toEqual(expect.arrayContaining(["container/introspect.js", "introspection/validation.js"]));
  });

  it(
    "takes the short error messages in a production build and the full ones in development",
    { timeout: SUBPROCESS_TEST_TIMEOUT_MS },
    async () => {
      const production = await project.bundle("src/entry-resolve-only.ts", "production");
      const development = await project.bundle("src/entry-resolve-only.ts", "development");

      expect(production.packageModules).toContain("error-messages.production.js");
      expect(production.packageModules).not.toContain("error-messages.js");
      expect(development.packageModules).toContain("error-messages.js");
      expect(development.packageModules).not.toContain("error-messages.production.js");
    },
  );
});
