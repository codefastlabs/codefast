import type { Server } from "node:http";
import { createBenchServer } from "#/server/http";
import { findAvailablePort } from "#/server/port";
import type { BenchServerOptions } from "#/types";

const MAX_LISTEN_ATTEMPTS = 32;

function listenLoopback(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      server.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

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
  let port = await findAvailablePort(preferredPort);

  for (let attempt = 0; attempt < MAX_LISTEN_ATTEMPTS; attempt++) {
    try {
      await listenLoopback(server, port);
      break;
    } catch (err) {
      const errno = err as NodeJS.ErrnoException;
      if (errno.code === "EADDRINUSE" && attempt + 1 < MAX_LISTEN_ATTEMPTS) {
        port = await findAvailablePort(port + 1);
        continue;
      }
      server.close();
      console.error("Bench history server failed to listen:", err);
      throw err;
    }
  }

  if (!server.listening) {
    throw new Error(
      `Bench history server: failed to bind after ${String(MAX_LISTEN_ATTEMPTS)} attempts.`,
    );
  }

  if (port !== preferredPort) {
    console.log(`Port ${String(preferredPort)} in use, using ${String(port)} instead.`);
  }

  console.log(`Bench history server: http://localhost:${String(port)}`);
  console.log(`  bench-results: ${serverOptions.benchResultsDir}`);
  console.log("  Payload cached in memory; invalidated automatically on new run. Ctrl+C to stop.");
}
