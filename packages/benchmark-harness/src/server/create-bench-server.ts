import type { Server } from "node:http";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEmbeddedPayload } from "#/server/build-payload";
import { listRawRuns } from "#/server/read-runs";
import type { BenchServerOptions } from "#/server/server-types";

const clientDir = join(dirname(fileURLToPath(import.meta.url)), "client");

/**
 * @since 0.3.16-canary.0
 */
export function createBenchServer(options: BenchServerOptions): Server {
  return createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      const indexHtml = readFileSync(join(clientDir, "index.html"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(indexHtml);
      return;
    }

    if (url.pathname === "/app.js") {
      const appJs = readFileSync(join(clientDir, "app.js"), "utf8");
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
      res.end(appJs);
      return;
    }

    if (url.pathname === "/api/payload") {
      try {
        const rawRuns = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options);
        const json = JSON.stringify(payload);
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(json);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });
}
