#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startBenchServer } from "@codefast/benchmark-harness";

await startBenchServer({
  benchResultsDir: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "bench-results"),
  preferredPort: Number(process.env["BENCH_PORT"] ?? 3002),
  title: "@codefast/tailwind-variants vs tailwind-variants & cva — bench history",
  libraries: [
    { name: "@codefast/tailwind-variants", displayName: "@codefast/tv", isPrimary: true },
    { name: "tailwind-variants", displayName: "tailwind-variants" },
    { name: "class-variance-authority", displayName: "cva" },
  ],
});
