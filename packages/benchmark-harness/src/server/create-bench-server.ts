import type { Server } from "node:http";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEmbeddedPayload } from "#/server/build-payload";
import { renderDocument } from "#/server/client/entry-server";
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
      try {
        const rawRuns = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options);
        renderDocument(payload, res);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err));
      }
      return;
    }

    if (url.pathname === "/client.js") {
      const js = readFileSync(join(clientDir, "client.js"));
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
      res.end(js);
      return;
    }

    if (url.pathname === "/styles.css") {
      const css = readFileSync(join(clientDir, "styles.css"));
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      res.end(css);
      return;
    }

    if (url.pathname === "/api/payload") {
      try {
        const rawRuns = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options);
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(payload));
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
