import type { Server } from "node:http";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEmbeddedPayload } from "#/server/build-payload";
import { renderDocument } from "#/server/client/entry-server";
import { listRawRuns } from "#/server/read-runs";
import type { BenchServerOptions } from "#/server/server-types";

const clientDir = join(dirname(fileURLToPath(import.meta.url)), "client");

/**
 * Creates an HTTP server for the benchmark history viewer.
 *
 * Bind to loopback (`127.0.0.1`) unless you intend to expose benchmark results on the network:
 * routes stream JSON and HTML derived from {@link BenchServerOptions.benchResultsDir}.
 *
 * @since 0.3.16-canary.0
 */
export function createBenchServer(options: BenchServerOptions): Server {
  return createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      try {
        const { runs: rawRuns, warning } = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options, warning);
        renderDocument(payload, res, req);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err));
      }
      return;
    }

    if (url.pathname === "/client.js") {
      const js = readFileSync(join(clientDir, "client.js"));
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(js);
      return;
    }

    const chunkMatch = /^\/chunks\/([^/]+\.js)$/.exec(url.pathname);
    if (chunkMatch) {
      const chunkPath = resolve(clientDir, "chunks", chunkMatch[1]!);
      if (!chunkPath.startsWith(resolve(clientDir, "chunks") + "/")) {
        res.writeHead(400);
        res.end("Bad request");
        return;
      }
      const js = readFileSync(chunkPath);
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      });
      res.end(js);
      return;
    }

    if (url.pathname === "/styles.css") {
      const css = readFileSync(join(clientDir, "styles.css"));
      res.writeHead(200, {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(css);
      return;
    }

    if (url.pathname === "/api/payload") {
      try {
        const { runs: rawRuns, warning } = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options, warning);
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
