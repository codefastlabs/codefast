#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBenchServer } from "@codefast/benchmark-harness";

const benchResultsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "bench-results");
const port = Number(process.env["BENCH_PORT"] ?? 3001);

const server = createBenchServer({
  benchResultsDir,
  port,
  title: "@codefast/di vs inversify — bench history",
  libraries: [
    { name: "@codefast/di", displayName: "@codefast/di", isPrimary: true },
    { name: "inversify", displayName: "inversify" },
  ],
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Bench history server: http://localhost:${String(port)}`);
  console.log(`  bench-results: ${benchResultsDir}`);
  console.log("  Data is read fresh on every page load. Ctrl+C to stop.");
});
