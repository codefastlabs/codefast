/**
 * A browser bundle of the built package keeps only what the consumer calls: the functions that check and describe a
 * container stay out of a program that only binds and resolves.
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

  it("keeps the validation walk once the program calls validate", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, async () => {
    const { packageModules } = await project.bundle("src/entry-validate.ts");

    expect(packageModules).toEqual(expect.arrayContaining(["container/introspect.js", "introspection/validation.js"]));
  });
});
