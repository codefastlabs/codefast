#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startBenchServer } from "@codefast/benchmark-harness";

await startBenchServer({
  benchResultsDir: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "bench-results"),
  preferredPort: Number(process.env["BENCH_PORT"] ?? 3001),
  title: "@codefast/di vs inversify — bench history",
  libraries: [
    { name: "@codefast/di", displayName: "@codefast/di", isPrimary: true },
    { name: "inversify", displayName: "inversify" },
  ],
});
