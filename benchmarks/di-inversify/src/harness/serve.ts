#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDisplayName } from "@codefast/benchmark-harness/shared/config";
import {
  BENCH_PORT_ENV_KEY,
  BENCH_RESULTS_DIR_NAME,
  parseEnvInteger,
} from "@codefast/benchmark-harness/shared/env-keys";
import { startBenchServer } from "@codefast/benchmark-viewer/server";

import { CODEFAST_DI, INVERSIFY, SERVE_TITLE, AWILIX, TSYRINGE } from "#/harness/config";

await startBenchServer({
  benchResultsDir: join(dirname(fileURLToPath(import.meta.url)), "..", "..", BENCH_RESULTS_DIR_NAME),
  preferredPort: parseEnvInteger(BENCH_PORT_ENV_KEY) ?? 3001,
  title: SERVE_TITLE,
  libraries: [
    {
      name: CODEFAST_DI.libraryName,
      displayName: resolveDisplayName(CODEFAST_DI),
      isPrimary: true,
    },
    { name: INVERSIFY.libraryName, displayName: resolveDisplayName(INVERSIFY) },
    { name: AWILIX.libraryName, displayName: resolveDisplayName(AWILIX) },
    { name: TSYRINGE.libraryName, displayName: resolveDisplayName(TSYRINGE) },
  ],
});
