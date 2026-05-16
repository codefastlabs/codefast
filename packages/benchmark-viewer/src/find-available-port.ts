import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * @since 0.3.16-canary.0
 */
export function findAvailablePort(preferred: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(findAvailablePort(preferred + 1));
      } else {
        reject(err);
      }
    });

    // Match `startBenchServer` / production bind — probing `0.0.0.0`/`::` can disagree with loopback.
    server.listen(preferred, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}
