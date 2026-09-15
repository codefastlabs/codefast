/** Runs the shared paired-A/B driver with `@codefast/tailwind-variants` as the subject. */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runBenchAbMain } from "@internal/benchmark-harness/parent/run-ab-main";

import { CODEFAST_TV } from "#/harness/config";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

runBenchAbMain(process.argv.slice(2), {
  packageRootDirectory,
  subjectLibraryName: CODEFAST_TV.libraryName,
  subjectSourcePath: "packages/tailwind-variants/src",
});
