#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BENCH_PORT_ENV_KEY,
  BENCH_RESULTS_DIR_NAME,
  resolveDisplayName,
  startBenchServer,
} from "@codefast/benchmark-harness";
import { CODEFAST_TV, CVA, SERVE_TITLE, TAILWIND_VARIANTS } from "#/harness/config";

await startBenchServer({
  benchResultsDir: join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    BENCH_RESULTS_DIR_NAME,
  ),
  preferredPort: Number(process.env[BENCH_PORT_ENV_KEY] ?? 3002),
  title: SERVE_TITLE,
  libraries: [
    {
      name: CODEFAST_TV.libraryName,
      displayName: resolveDisplayName(CODEFAST_TV),
      isPrimary: true,
    },
    { name: TAILWIND_VARIANTS.libraryName, displayName: resolveDisplayName(TAILWIND_VARIANTS) },
    { name: CVA.libraryName, displayName: resolveDisplayName(CVA) },
  ],
});
