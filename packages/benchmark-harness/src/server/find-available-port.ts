import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

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

    server.listen(preferred, () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}
