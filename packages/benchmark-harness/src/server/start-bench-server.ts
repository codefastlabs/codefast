import { createBenchServer } from "#/server/create-bench-server";
import { findAvailablePort } from "#/server/find-available-port";
import type { BenchServerOptions } from "#/server/server-types";

/**
 * @since 0.3.16-canary.0
 */
export interface StartBenchServerOptions extends BenchServerOptions {
  readonly preferredPort: number;
}

/**
 * @since 0.3.16-canary.0
 */
export async function startBenchServer({
  preferredPort,
  ...serverOptions
}: StartBenchServerOptions): Promise<void> {
  const server = createBenchServer(serverOptions);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${String(preferredPort)} in use, using ${String(port)} instead.`);
  }

  server.listen(port, "127.0.0.1", () => {
    console.log(`Bench history server: http://localhost:${String(port)}`);
    console.log(`  bench-results: ${serverOptions.benchResultsDir}`);
    console.log("  Data is read fresh on every page load. Ctrl+C to stop.");
  });
}
