import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

const MAX_PORT = 65_535;

function tryListen(candidate: number): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(undefined);
      } else {
        reject(err);
      }
    });

    // Match `startBenchServer` / production bind — probing `0.0.0.0`/`::` can disagree with loopback.
    server.listen(candidate, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Resolves the first free loopback port at or above the preferred one.
 *
 * @since 0.3.16-canary.0
 */
export async function findAvailablePort(preferred: number): Promise<number> {
  for (let candidate = preferred; candidate <= MAX_PORT; candidate += 1) {
    const port = await tryListen(candidate);
    if (port !== undefined) {
      return port;
    }
  }
  throw new Error(`No free loopback port between ${String(preferred)} and ${String(MAX_PORT)}.`);
}
