#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BENCH_PORT_ENV_KEY,
  BENCH_RESULTS_DIR_NAME,
  resolveDisplayName,
  startBenchServer,
} from "@codefast/benchmark-harness";
import { CODEFAST_DI, INVERSIFY, SERVE_TITLE } from "#/harness/config";

await startBenchServer({
  benchResultsDir: join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    BENCH_RESULTS_DIR_NAME,
  ),
  preferredPort: Number(process.env[BENCH_PORT_ENV_KEY] ?? 3001),
  title: SERVE_TITLE,
  libraries: [
    {
      name: CODEFAST_DI.libraryName,
      displayName: resolveDisplayName(CODEFAST_DI),
      isPrimary: true,
    },
    { name: INVERSIFY.libraryName, displayName: resolveDisplayName(INVERSIFY) },
  ],
});
