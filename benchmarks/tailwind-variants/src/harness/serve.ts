#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBenchServer } from "@codefast/benchmark-harness";

const benchResultsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "bench-results");
const port = Number(process.env["BENCH_PORT"] ?? 3002);

const server = createBenchServer({
  benchResultsDir,
  port,
  title: "@codefast/tailwind-variants vs tailwind-variants & cva — bench history",
  libraries: [
    { name: "@codefast/tailwind-variants", displayName: "@codefast/tv", isPrimary: true },
    { name: "tailwind-variants", displayName: "tailwind-variants" },
    { name: "class-variance-authority", displayName: "cva" },
  ],
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Bench history server: http://localhost:${String(port)}`);
  console.log(`  bench-results: ${benchResultsDir}`);
  console.log("  Data is read fresh on every page load. Ctrl+C to stop.");
});
